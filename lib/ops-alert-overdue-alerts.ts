import { appendIntegrationLog, listIntegrationLogs } from '@/lib/integration-log-store';

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export async function emitOpsOverdueAlert(input: {
  overdue: number;
  total: number;
  critical: number;
  impactAlerts: number;
  payoutRiskAlerts: number;
}) {
  if (input.overdue <= 0) return { emitted: false, reason: 'no_overdue' as const };

  const today = dayKey(new Date().toISOString());
  const existing = listIntegrationLogs({
    provider: 'internal_ops',
    actionPrefix: 'ops_alerts.alert.overdue',
    limit: 50,
  }).find((row) => dayKey(row.createdAt) === today);

  if (existing) return { emitted: false, reason: 'already_emitted_today' as const };

  await appendIntegrationLog({
    provider: 'internal_ops',
    action: 'ops_alerts.alert.overdue',
    requestPayload: { day: today, source: 'ops_alerts_route' },
    responsePayload: {
      overdue: input.overdue,
      total: input.total,
      critical: input.critical,
      impactAlerts: input.impactAlerts,
      payoutRiskAlerts: input.payoutRiskAlerts,
    },
    statusCode: 200,
    success: true,
  });

  return { emitted: true as const };
}
