import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { appendIntegrationLog, listIntegrationLogs } from '@/lib/integration-log-store';
import { readPayoutFailureThresholds } from '@/lib/payout-failure-thresholds';
import { getPayoutFailurePlaybook } from '@/lib/payout-reconciliation-playbook';
import type { PayoutReconciliationFailureCode } from '@/lib/payout-reconciliation-codes';
import { emitPayoutAtRiskAlert } from '@/lib/payout-risk-alerts';
import { settlePayoutToPaid } from '@/lib/payout-settlement-service';
import { canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';

interface BatchPayload {
  payoutIds: string[];
}

interface BatchResultRow {
  failureCode?: string;
  playbookSeverity?: string;
  ok?: boolean;
}

function parsePayload(payload: unknown): BatchPayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const row = payload as Record<string, unknown>;
  if (!Array.isArray(row.payoutIds)) return null;
  const payoutIds = row.payoutIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0).map((id) => id.trim());
  if (payoutIds.length === 0) return null;
  return { payoutIds: Array.from(new Set(payoutIds)) };
}

function csvEscape(value: unknown) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function ensureFinanceAdmin(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canManageFinancialOperations(actor?.actorRole)) {
    return null;
  }
  return actor;
}

function filterBatchLogs(request: Request, limitCap: number, defaultLimit: number, successLimit = 500) {
  const { searchParams } = new URL(request.url);
  const limitRaw = Number(searchParams.get('limit') ?? String(defaultLimit));
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, limitCap) : defaultLimit;
  const successParam = searchParams.get('success');
  const success = successParam === 'true' ? true : successParam === 'false' ? false : undefined;
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  let logs = listIntegrationLogs({
    provider: 'internal_ops',
    actionPrefix: 'payout_batch_settlement.executed',
    success,
    limit: successLimit,
  });

  if (dateFrom) {
    const fromTs = new Date(dateFrom).getTime();
    if (!Number.isNaN(fromTs)) logs = logs.filter((row) => new Date(row.createdAt).getTime() >= fromTs);
  }
  if (dateTo) {
    const toTs = new Date(dateTo).getTime();
    if (!Number.isNaN(toTs)) logs = logs.filter((row) => new Date(row.createdAt).getTime() <= toTs);
  }

  return { logs, limit, searchParams };
}

export async function handleAdminPayoutBatchSettlementPost(request: Request) {
  const actor = ensureFinanceAdmin(request);
  if (!actor) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const payload = parsePayload(await request.json().catch(() => null));
  if (!payload) return NextResponse.json({ error: 'validation_error' }, { status: 422 });

  const results: Array<{
    payoutId: string;
    ok: boolean;
    detail: string;
    failureCode?: PayoutReconciliationFailureCode | 'not_found' | 'invalid_transition';
    playbookAction?: string;
    playbookOwner?: string;
    playbookSeverity?: string;
    reconciliation?: Record<string, unknown>;
  }> = [];
  for (const payoutId of payload.payoutIds) {
    const settled = await settlePayoutToPaid({
      payoutId,
      actorId: actor.actorId,
      actorRole: actor.actorRole,
    });
    if (settled.kind === 'settled') {
      results.push({ payoutId, ok: true, detail: 'paid', reconciliation: settled.reconciliation as unknown as Record<string, unknown> });
    } else if (settled.kind === 'precheck_failed') {
      const pb = getPayoutFailurePlaybook(settled.precheck.detail);
      results.push({
        payoutId,
        ok: false,
        detail: settled.precheck.detail,
        failureCode: settled.precheck.detail,
        playbookAction: pb?.action,
        playbookOwner: pb?.owner,
        playbookSeverity: pb?.severity,
        reconciliation: settled.precheck.reconciliation,
      });
    } else {
      const pb = getPayoutFailurePlaybook(settled.kind);
      results.push({
        payoutId,
        ok: false,
        detail: settled.kind,
        failureCode: settled.kind,
        playbookAction: pb?.action,
        playbookOwner: pb?.owner,
        playbookSeverity: pb?.severity,
      });
    }
  }

  const successCount = results.filter((row) => row.ok).length;
  const failCount = results.length - successCount;
  await appendIntegrationLog({
    provider: 'internal_ops',
    action: 'payout_batch_settlement.executed',
    requestPayload: { payoutIds: payload.payoutIds, actorId: actor.actorId, actorRole: actor.actorRole },
    responsePayload: { successCount, failCount, results },
    statusCode: 200,
    success: failCount === 0,
    errorMessage: failCount > 0 ? `partial_failure:${failCount}` : undefined,
  });

  return NextResponse.json({ ok: true, summary: { total: results.length, successCount, failCount }, results });
}

export async function handleAdminPayoutBatchSettlementHistoryGet(request: Request) {
  const actor = ensureFinanceAdmin(request);
  if (!actor) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { logs, limit } = filterBatchLogs(request, 100, 20);
  return NextResponse.json({ ok: true, logs: logs.slice(0, limit) });
}

export async function handleAdminPayoutBatchSettlementHistoryExportGet(request: Request) {
  const actor = ensureFinanceAdmin(request);
  if (!actor) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { logs, searchParams } = filterBatchLogs(request, 2000, 500, 2000);
  const format = searchParams.get('format') === 'long' ? 'long' : 'summary';

  let header = '';
  let lines: string[] = [];
  if (format === 'summary') {
    header = ['log_id', 'created_at', 'success', 'error_message', 'success_count', 'fail_count', 'total'].join(',');
    lines = logs.map((row) => {
      const payload = (row.responsePayload ?? {}) as Record<string, unknown>;
      const successCount = Number(payload.successCount ?? 0);
      const failCount = Number(payload.failCount ?? 0);
      const total = successCount + failCount;
      return [
        csvEscape(row.id),
        csvEscape(row.createdAt),
        csvEscape(row.success),
        csvEscape(row.errorMessage ?? ''),
        csvEscape(successCount),
        csvEscape(failCount),
        csvEscape(total),
      ].join(',');
    });
  } else {
    header = [
      'log_id',
      'created_at',
      'batch_success',
      'batch_error_message',
      'payout_id',
      'item_ok',
      'item_detail',
      'failure_code',
      'playbook_action',
      'playbook_owner',
      'playbook_severity',
      'reconciliation_action',
      'reconciliation_delta',
      'reconciliation_json',
    ].join(',');
    lines = logs.flatMap((row) => {
      const payload = (row.responsePayload ?? {}) as {
        results?: Array<{
          payoutId?: string;
          ok?: boolean;
          detail?: string;
          failureCode?: string;
          playbookAction?: string;
          playbookOwner?: string;
          playbookSeverity?: string;
          reconciliation?: Record<string, unknown>;
        }>;
      };
      const results = Array.isArray(payload.results) ? payload.results : [];
      if (results.length === 0) {
        return [[
          csvEscape(row.id),
          csvEscape(row.createdAt),
          csvEscape(row.success),
          csvEscape(row.errorMessage ?? ''),
          csvEscape(''),
          csvEscape(''),
          csvEscape('no_item_results'),
          csvEscape(''),
          csvEscape(''),
          csvEscape(''),
          csvEscape(''),
          csvEscape(''),
          csvEscape(''),
          csvEscape(''),
        ].join(',')];
      }
      return results.map((item) =>
        [
          csvEscape(row.id),
          csvEscape(row.createdAt),
          csvEscape(row.success),
          csvEscape(row.errorMessage ?? ''),
          csvEscape(item.payoutId ?? ''),
          csvEscape(item.ok ?? false),
          csvEscape(item.detail ?? ''),
          csvEscape(item.failureCode ?? ''),
          csvEscape(item.playbookAction ?? ''),
          csvEscape(item.playbookOwner ?? ''),
          csvEscape(item.playbookSeverity ?? ''),
          csvEscape(String(item.reconciliation?.action ?? '')),
          csvEscape(String(item.reconciliation?.delta ?? '')),
          csvEscape(item.reconciliation ? JSON.stringify(item.reconciliation) : ''),
        ].join(',')
      );
    });
  }

  const csv = [header, ...lines].join('\n');
  const filename = `payout-batch-history-${format}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

export async function handleAdminPayoutBatchSettlementMetricsGet(request: Request) {
  const actor = ensureFinanceAdmin(request);
  if (!actor) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { logs } = filterBatchLogs(request, 2000, 2000, 2000);
  const byCode = new Map<string, { failureCode: string; count: number; high: number; medium: number; low: number }>();
  let totalItems = 0;
  let totalFailed = 0;
  let totalSuccess = 0;

  for (const log of logs) {
    const payload = (log.responsePayload ?? {}) as { results?: BatchResultRow[] };
    const results = Array.isArray(payload.results) ? payload.results : [];
    for (const row of results) {
      totalItems += 1;
      if (row.ok) {
        totalSuccess += 1;
        continue;
      }
      totalFailed += 1;
      const code = row.failureCode ?? 'unknown_failure';
      const sev = row.playbookSeverity ?? 'medium';
      const current = byCode.get(code) ?? { failureCode: code, count: 0, high: 0, medium: 0, low: 0 };
      current.count += 1;
      if (sev === 'high') current.high += 1;
      else if (sev === 'low') current.low += 1;
      else current.medium += 1;
      byCode.set(code, current);
    }
  }

  const thresholds = readPayoutFailureThresholds();
  const failureCodes = Array.from(byCode.values())
    .map((row) => {
      const threshold = Number(thresholds.codes[row.failureCode] ?? thresholds.defaultMaxCount);
      const atRisk = row.count > threshold;
      return { ...row, threshold, atRisk };
    })
    .sort((a, b) => b.count - a.count);
  const atRiskCodes = failureCodes.filter((row) => row.atRisk).length;
  const summary = {
    logs: logs.length,
    totalItems,
    totalSuccess,
    totalFailed,
    failureRate: totalItems > 0 ? Number(((totalFailed / totalItems) * 100).toFixed(2)) : 0,
    atRiskCodes,
    alertStatus: (atRiskCodes > 0 ? 'AT_RISK' : 'OK') as 'OK' | 'AT_RISK',
  };

  await emitPayoutAtRiskAlert({
    alertStatus: summary.alertStatus,
    atRiskCodes: summary.atRiskCodes,
    failureRate: summary.failureRate,
    totalFailed: summary.totalFailed,
    totalItems: summary.totalItems,
    failureCodes,
  });

  return NextResponse.json({ ok: true, summary, failureCodes });
}
