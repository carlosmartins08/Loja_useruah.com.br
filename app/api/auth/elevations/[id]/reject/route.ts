import { NextResponse } from 'next/server';
import { getActorFromRequest } from '@/lib/access-control';
import { appendAuditLog } from '@/lib/audit-log-store';
import { appendDecisionLog } from '@/lib/decision-log-store';
import { rejectPrivilegeElevation } from '@/lib/privilege-elevation-store';
import { canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';

interface RejectPayload {
  rationale: string;
}

function isValidPayload(payload: unknown): payload is RejectPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return typeof row.rationale === 'string' && row.rationale.trim().length > 0;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (!actor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canManageFinancialOperations(actor.actorRole) && actor.actorRole !== 'platform_admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) return NextResponse.json({ error: 'validation_error' }, { status: 422 });

  const { id } = await context.params;
  const result = rejectPrivilegeElevation(id, { actorId: actor.actorId });
  if (result.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (result.kind === 'invalid_transition') {
    return NextResponse.json({ error: 'invalid_transition', detail: result.current.status }, { status: 409 });
  }

  appendDecisionLog({
    elevation_id: result.elevation.id,
    decision: 'rejected',
    decided_by: actor.actorId,
    decided_role: actor.actorRole,
    rationale: payload.rationale.trim(),
  });
  appendAuditLog({
    actor_id: actor.actorId,
    actor_role: actor.actorRole,
    action: 'privilege_elevation.rejected',
    entity_type: 'PrivilegeElevation',
    entity_id: result.elevation.id,
    reason: payload.rationale.trim(),
  });

  return NextResponse.json({ ok: true, elevation: result.elevation });
}

