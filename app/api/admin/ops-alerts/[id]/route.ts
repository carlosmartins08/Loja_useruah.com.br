import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canManageFinancialOperations, canApproveImpactReviews } from '@/lib/role-matrix/permission-matrix';
import { getOpsAlertState, upsertOpsAlertState, type OpsAlertWorkflowStatus } from '@/lib/ops-alert-state-store';
import { appendIntegrationLog } from '@/lib/integration-log-store';

interface Payload {
  workflowStatus: OpsAlertWorkflowStatus;
  owner: string;
  note?: string;
}

function parsePayload(payload: unknown): Payload | null {
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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive()) {
    const allowed = canManageFinancialOperations(actor?.actorRole) || canApproveImpactReviews(actor?.actorRole);
    if (!allowed) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

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
