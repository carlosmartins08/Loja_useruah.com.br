import { decodeSessionToken } from '@/lib/session-token';
import { normalizeAuthSession } from '@/lib/auth-session';
import { appendAuditLog } from '@/lib/audit-log-store';
import {
  getPrivilegeElevation,
  markPrivilegeElevationUsed,
  type ElevationRiskLevel,
  type PrivilegeElevationRecord,
} from '@/lib/privilege-elevation-store';

export class ElevationError extends Error {
  constructor(
    public status: number,
    public code: string,
    public detail?: string
  ) {
    super(code);
  }
}

function getSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const token = cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('ruah_session='))
    ?.slice('ruah_session='.length);
  return normalizeAuthSession(decodeSessionToken(token));
}

function isExpired(iso: string) {
  return new Date(iso).getTime() <= Date.now();
}

export function riskLevelForAction(action: string): ElevationRiskLevel {
  const high = new Set([
    'payout.approved',
    'payout.rejected',
    'payout.paid',
    'refund.approved',
    'refund.rejected',
    'chargeback.resolved',
    'order.cancel_paid',
    'price.public_changed',
    'commission.changed',
  ]);
  if (high.has(action)) return 'high';
  return 'low';
}

export function requireElevationIfNeeded(input: {
  request: Request;
  action: string;
  requiredRole: string;
  entityType: string;
  entityId: string;
  scope: string;
}) {
  if (process.env.NODE_ENV !== 'production') return null;

  const session = getSessionFromRequest(input.request);
  if (!session) throw new ElevationError(401, 'unauthorized');

  if (session.userRole === input.requiredRole) return null;

  const elevationId = input.request.headers.get('x-elevation-id')?.trim();
  if (!elevationId) {
    throw new ElevationError(403, 'elevation_required', 'missing_elevation_id');
  }

  const elevation = getPrivilegeElevation(elevationId);
  if (!elevation) throw new ElevationError(403, 'elevation_required', 'elevation_not_found');
  validateElevation({
    elevation,
    actorId: session.userId,
    requiredRole: input.requiredRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
  });

  if (elevation.status !== 'approved') {
    throw new ElevationError(403, 'elevation_required', `elevation_status_${elevation.status}`);
  }
  if (isExpired(elevation.expiresAt)) {
    throw new ElevationError(403, 'elevation_required', 'elevation_expired');
  }

  const used = markPrivilegeElevationUsed(elevation.id);
  appendAuditLog({
    actor_id: session.userId,
    actor_role: session.activeRole,
    primary_role: session.userRole,
    elevated_role: input.requiredRole,
    action: 'privilege_elevation.used',
    entity_type: input.entityType,
    entity_id: input.entityId,
    scope: input.scope,
    reason: used?.reason ?? elevation.reason,
    approved_by: elevation.approvedBy,
    expires_at: elevation.expiresAt,
  });

  return elevation;
}

function validateElevation(input: {
  elevation: PrivilegeElevationRecord;
  actorId: string;
  requiredRole: string;
  action: string;
  entityType: string;
  entityId: string;
}) {
  if (input.elevation.actorId !== input.actorId) {
    throw new ElevationError(403, 'elevation_required', 'elevation_actor_mismatch');
  }
  if (input.elevation.elevatedRole !== input.requiredRole) {
    throw new ElevationError(403, 'elevation_required', 'elevation_role_mismatch');
  }
  if (input.elevation.action !== input.action) {
    throw new ElevationError(403, 'elevation_required', 'elevation_action_mismatch');
  }
  if (input.elevation.entityType !== input.entityType || input.elevation.entityId !== input.entityId) {
    throw new ElevationError(403, 'elevation_required', 'elevation_entity_mismatch');
  }
}

