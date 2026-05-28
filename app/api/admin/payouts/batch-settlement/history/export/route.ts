import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';
import { listIntegrationLogs } from '@/lib/integration-log-store';

function csvEscape(value: unknown) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canManageFinancialOperations(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const successParam = searchParams.get('success');
  const format = searchParams.get('format') === 'long' ? 'long' : 'summary';
  const success =
    successParam === 'true' ? true : successParam === 'false' ? false : undefined;
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  let logs = listIntegrationLogs({
    provider: 'internal_ops',
    actionPrefix: 'payout_batch_settlement.executed',
    success,
    limit: 2000,
  });

  if (dateFrom) {
    const fromTs = new Date(dateFrom).getTime();
    if (!Number.isNaN(fromTs)) logs = logs.filter((row) => new Date(row.createdAt).getTime() >= fromTs);
  }
  if (dateTo) {
    const toTs = new Date(dateTo).getTime();
    if (!Number.isNaN(toTs)) logs = logs.filter((row) => new Date(row.createdAt).getTime() <= toTs);
  }

  let header = '';
  let lines: string[] = [];
  if (format === 'summary') {
    header = [
      'log_id',
      'created_at',
      'success',
      'error_message',
      'success_count',
      'fail_count',
      'total',
    ].join(',');

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
