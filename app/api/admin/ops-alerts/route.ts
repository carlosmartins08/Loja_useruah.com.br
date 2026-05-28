import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canManageFinancialOperations, canApproveImpactReviews } from '@/lib/role-matrix/permission-matrix';
import { listIntegrationLogs } from '@/lib/integration-log-store';
import { listOpsAlertStates } from '@/lib/ops-alert-state-store';
import { isOpsAlertOverdue, readOpsAlertSla } from '@/lib/ops-alert-sla';
import { emitOpsOverdueAlert } from '@/lib/ops-alert-overdue-alerts';

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive()) {
    const allowed = canManageFinancialOperations(actor?.actorRole) || canApproveImpactReviews(actor?.actorRole);
    if (!allowed) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limitRaw = Number(searchParams.get('limit') ?? '40');
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 40;

  const impact = listIntegrationLogs({
    provider: 'internal_ops',
    actionPrefix: 'impact_review_notify.',
    limit: 200,
  });
  const payoutRisk = listIntegrationLogs({
    provider: 'internal_ops',
    actionPrefix: 'payout_batch_settlement.alert.at_risk',
    limit: 200,
  });
  const overdueOps = listIntegrationLogs({
    provider: 'internal_ops',
    actionPrefix: 'ops_alerts.alert.overdue',
    limit: 200,
  });

  const merged = [...impact, ...payoutRisk, ...overdueOps]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
  const states = listOpsAlertStates();
  const sla = readOpsAlertSla();
  const alerts = merged.map((row) => ({
    ...row,
    state: states[row.id] ?? {
      alertId: row.id,
      workflowStatus: 'new',
      owner: '',
      updatedAt: row.createdAt,
      updatedBy: 'system',
    },
  })).map((row) => ({
    ...row,
    isOverdue: isOpsAlertOverdue({
      createdAt: row.createdAt,
      workflowStatus: row.state.workflowStatus,
      sla,
    }),
  }));

  const summary = {
    total: alerts.length,
    impactAlerts: alerts.filter((row) => row.action.startsWith('impact_review_notify.')).length,
    payoutRiskAlerts: alerts.filter((row) => row.action === 'payout_batch_settlement.alert.at_risk').length,
    overdueOpsAlerts: alerts.filter((row) => row.action === 'ops_alerts.alert.overdue').length,
    critical: alerts.filter((row) => row.action === 'payout_batch_settlement.alert.at_risk' || row.action === 'ops_alerts.alert.overdue' || row.action.endsWith('created_overdue')).length,
    open: alerts.filter((row) => row.state.workflowStatus !== 'resolved').length,
    inProgress: alerts.filter((row) => row.state.workflowStatus === 'in_progress').length,
    resolved: alerts.filter((row) => row.state.workflowStatus === 'resolved').length,
    overdue: alerts.filter((row) => row.isOverdue).length,
    sla,
  };

  await emitOpsOverdueAlert({
    overdue: summary.overdue,
    total: summary.total,
    critical: summary.critical,
    impactAlerts: summary.impactAlerts,
    payoutRiskAlerts: summary.payoutRiskAlerts,
  });

  return NextResponse.json({ ok: true, summary, alerts });
}
