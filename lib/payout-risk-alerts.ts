import { appendIntegrationLog, listIntegrationLogs } from '@/lib/integration-log-store';

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export async function emitPayoutAtRiskAlert(input: {
  alertStatus: 'OK' | 'AT_RISK';
  atRiskCodes: number;
  failureRate: number;
  totalFailed: number;
  totalItems: number;
  failureCodes: Array<{ failureCode: string; count: number; threshold: number; atRisk: boolean }>;
}) {
  if (input.alertStatus !== 'AT_RISK') return { emitted: false, reason: 'status_ok' as const };

  const today = dayKey(new Date().toISOString());
  const existing = listIntegrationLogs({
    provider: 'internal_ops',
    actionPrefix: 'payout_batch_settlement.alert.at_risk',
    limit: 50,
  }).find((row) => dayKey(row.createdAt) === today);

  if (existing) return { emitted: false, reason: 'already_emitted_today' as const };

  await appendIntegrationLog({
    provider: 'internal_ops',
    action: 'payout_batch_settlement.alert.at_risk',
    requestPayload: {
      day: today,
      source: 'metrics_endpoint',
    },
    responsePayload: {
      alertStatus: input.alertStatus,
      atRiskCodes: input.atRiskCodes,
      failureRate: input.failureRate,
      totalFailed: input.totalFailed,
      totalItems: input.totalItems,
      topAtRisk: input.failureCodes.filter((row) => row.atRisk).slice(0, 5),
    },
    statusCode: 200,
    success: true,
  });

  return { emitted: true as const };
}
