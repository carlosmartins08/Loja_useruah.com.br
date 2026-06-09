import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { appendIntegrationLog, listIntegrationLogs } from '@/lib/integration-log-store';
import { emitOpsOverdueAlert } from '@/lib/ops-alert-overdue-alerts';
import { isOpsAlertOverdue, readOpsAlertSla } from '@/lib/ops-alert-sla';
import { getOpsAlertState, listOpsAlertStates, upsertOpsAlertState, type OpsAlertWorkflowStatus } from '@/lib/ops-alert-state-store';
import { canApproveImpactReviews, canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';

interface UpdateOpsAlertPayload {
  workflowStatus: OpsAlertWorkflowStatus;
  owner: string;
  note?: string;
}

function parsePayload(payload: unknown): UpdateOpsAlertPayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const row = payload as Record<string, unknown>;
  const status = row.workflowStatus;
  const owner = row.owner;
  if (status !== 'new' && status !== 'in_progress' && status !== 'resolved') return null;
  if (typeof owner !== 'string') return null;
  if (!owner.trim()) return null;
  if (row.note !== undefined && typeof row.note !== 'string') return null;
  return { workflowStatus: status, owner: owner.trim(), note: typeof row.note === 'string' ? row.note : undefined };
}

function ensureAdminOpsAccess(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive()) {
    const allowed = canManageFinancialOperations(actor?.actorRole) || canApproveImpactReviews(actor?.actorRole);
    if (!allowed) return { actor, error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }

  return { actor, error: null };
}

export async function handleAdminOpsAlertsGet(request: Request) {
  const { error } = ensureAdminOpsAccess(request);
  if (error) return error;

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
  const alerts = merged
    .map((row) => ({
      ...row,
      state: states[row.id] ?? {
        alertId: row.id,
        workflowStatus: 'new',
        owner: '',
        updatedAt: row.createdAt,
        updatedBy: 'system',
      },
    }))
    .map((row) => ({
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

export async function handleAdminOpsAlertPatch(request: Request, context: { params: Promise<{ id: string }> }) {
  const { actor, error } = ensureAdminOpsAccess(request);
  if (error) return error;

  const payload = parsePayload(await request.json().catch(() => null));
  if (!payload) return NextResponse.json({ error: 'validation_error' }, { status: 422 });

  const { id } = await context.params;
  const previous = getOpsAlertState(id);
  const state = upsertOpsAlertState({
    alertId: id,
    workflowStatus: payload.workflowStatus,
    owner: payload.owner,
    note: payload.note,
    updatedBy: actor?.actorId ?? 'unknown',
  });

  await appendIntegrationLog({
    provider: 'internal_ops',
    action: 'ops_alerts.workflow.updated',
    requestPayload: {
      alertId: id,
      actorId: actor?.actorId ?? 'unknown',
      actorRole: actor?.actorRole ?? 'unknown',
      previous: previous ?? null,
      next: state,
    },
    responsePayload: {
      ok: true,
      workflowStatus: state.workflowStatus,
      owner: state.owner,
      updatedAt: state.updatedAt,
    },
    statusCode: 200,
    success: true,
  });
  return NextResponse.json({ ok: true, state });
}
