import type { OrderRecord } from '@/lib/order-store';
import { decodeSessionToken } from '@/lib/session-token';
import { normalizeAuthSession } from '@/lib/auth-session';

export interface AccessActor {
  actorId: string;
  actorRole: string;
}

export function isRbacActive() {
  return process.env.RBAC_ACTIVE === 'true';
}

export function getActorFromRequest(request: Request): AccessActor | null {
  const cookieHeader = request.headers.get('cookie');
  const sessionToken = cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('ruah_session='))
    ?.slice('ruah_session='.length);

  const session = normalizeAuthSession(decodeSessionToken(sessionToken));
  if (session) {
    return {
      actorId: session.userId,
      actorRole: session.activeRole,
    };
  }

  const allowHeaderFallback = process.env.NODE_ENV !== 'production' || process.env.ALLOW_HEADER_ACTOR_FALLBACK === 'true';
  if (!allowHeaderFallback) {
    return null;
  }

  const actorId = request.headers.get('x-actor-id');
  const actorRole = request.headers.get('x-actor-role');
  if (!actorId || !actorRole) return null;
  return { actorId, actorRole };
}

export function canReadOrder(order: OrderRecord, actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor) return false;

  if (actor.actorRole === 'platform_admin' || actor.actorRole === 'support_agent') return true;
  if (actor.actorRole === 'customer' && actor.actorId === order.customerId) return true;
  if (actor.actorRole === 'supplier' && order.items.some((item) => item.supplierId === actor.actorId)) return true;
  return false;
}

export function canAccessSupportContext(actor: AccessActor | null) {
  if (!actor) return false;
  return actor.actorRole === 'support_agent' || actor.actorRole === 'platform_admin';
}

export function canReadTicketByCustomerId(customerId: string, actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor) return false;
  if (actor.actorRole === 'support_agent' || actor.actorRole === 'platform_admin') return true;
  return actor.actorRole === 'customer' && actor.actorId === customerId;
}

export function canCreateArtwork(actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor) return false;
  return actor.actorRole === 'artist' || actor.actorRole === 'community_manager' || actor.actorRole === 'platform_admin';
}

export function canReviewArtwork(actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor) return false;
  return actor.actorRole === 'curator' || actor.actorRole === 'platform_admin';
}

export function canManageCatalog(actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor) return false;
  return actor.actorRole === 'curator' || actor.actorRole === 'platform_admin';
}

export function canOperateProduction(actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor) return false;
  return actor.actorRole === 'production_operator' || actor.actorRole === 'supplier' || actor.actorRole === 'platform_admin';
}
