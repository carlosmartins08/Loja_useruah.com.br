import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';
import { listIntegrationLogs } from '@/lib/integration-log-store';
import { readPayoutFailureThresholds } from '@/lib/payout-failure-thresholds';
import { emitPayoutAtRiskAlert } from '@/lib/payout-risk-alerts';

interface BatchResultRow {
  failureCode?: string;
  playbookSeverity?: string;
  ok?: boolean;
}

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canManageFinancialOperations(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  let logs = listIntegrationLogs({
    provider: 'internal_ops',
    actionPrefix: 'payout_batch_settlement.executed',
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
    alertStatus: atRiskCodes > 0 ? 'AT_RISK' : 'OK' as 'OK' | 'AT_RISK',
  };

  await emitPayoutAtRiskAlert({
    alertStatus: summary.alertStatus,
    atRiskCodes: summary.atRiskCodes,
    failureRate: summary.failureRate,
    totalFailed: summary.totalFailed,
    totalItems: summary.totalItems,
    failureCodes,
  });

  return NextResponse.json({
    ok: true,
    summary,
    failureCodes,
  });
}
