import { NextResponse } from 'next/server';
import { getActorFromRequest } from '@/lib/access-control';
import { appendAuditLog } from '@/lib/audit-log-store';
import { riskLevelForAction } from '@/lib/privilege-elevation-service';
import {
  createPrivilegeElevation,
  expireStalePrivilegeElevations,
  listPrivilegeElevationsByActor,
} from '@/lib/privilege-elevation-store';
import { canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';

interface CreateElevationPayload {
  elevatedRole: string;
  action: string;
  entityType: string;
  entityId: string;
  scope: string;
  reason: string;
  durationMinutes?: number;
}

function isValidPayload(payload: unknown): payload is CreateElevationPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return (
    typeof row.elevatedRole === 'string' &&
    typeof row.action === 'string' &&
    typeof row.entityType === 'string' &&
    typeof row.entityId === 'string' &&
    typeof row.scope === 'string' &&
    typeof row.reason === 'string'
  );
}

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (!actor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  expireStalePrivilegeElevations();
  const rows = listPrivilegeElevationsByActor(actor.actorId);
  return NextResponse.json({ ok: true, elevations: rows });
}

export async function POST(request: Request) {
  const actor = getActorFromRequest(request);
  if (!actor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) return NextResponse.json({ error: 'validation_error' }, { status: 422 });

  const riskLevel = riskLevelForAction(payload.action.trim());
  if (riskLevel === 'high' && !canManageFinancialOperations(actor.actorRole) && actor.actorRole !== 'platform_admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const durationMinutes = Math.max(5, Math.min(120, Number(payload.durationMinutes ?? 20)));
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

  const elevation = createPrivilegeElevation({
    actorId: actor.actorId,
    primaryRole: actor.actorRole,
    elevatedRole: payload.elevatedRole.trim(),
    action: payload.action.trim(),
    entityType: payload.entityType.trim(),
    entityId: payload.entityId.trim(),
    scope: payload.scope.trim(),
    reason: payload.reason.trim(),
    riskLevel,
    expiresAt,
  });

  appendAuditLog({
    actor_id: actor.actorId,
    actor_role: actor.actorRole,
    primary_role: actor.actorRole,
    elevated_role: elevation.elevatedRole,
    action: 'privilege_elevation.requested',
    entity_type: elevation.entityType,
    entity_id: elevation.entityId,
    scope: elevation.scope,
    reason: elevation.reason,
    expires_at: elevation.expiresAt,
  });

  return NextResponse.json({ ok: true, elevation }, { status: elevation.status === 'requested' ? 202 : 201 });
}
