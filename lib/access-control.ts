import type { UserRole } from '@/lib/auth-session';
import { isUserRole } from '@/lib/auth-session';
import type { OrderRecord } from '@/lib/order-store';
import { decodeSessionToken, extractCookieValue } from '@/lib/session-token';
import { normalizeAuthSession } from '@/lib/auth-session';
import { isProductionLikeEnvironment } from '@/lib/mysql-runtime';

export interface AccessActor {
  actorId: string;
  actorRole: UserRole;
}

export function isRbacConfigured() {
  return process.env.RBAC_ACTIVE?.trim().toLowerCase() === 'true';
}

function isAdminApiRequest(request: Request) {
  try {
    return new URL(request.url).pathname.startsWith('/api/admin');
  } catch {
    return false;
  }
}

export function isRbacActive() {
  return isProductionLikeEnvironment() || isRbacConfigured();
}

export function getActorFromRequest(request: Request): AccessActor | null {
  const productionLike = isProductionLikeEnvironment();
  if (isAdminApiRequest(request) && !isRbacConfigured()) {
    throw new Error(productionLike ? 'rbac_required_in_public_environment' : 'rbac_required_for_admin_environment');
  }

  const cookieHeader = request.headers.get('cookie');
  const sessionToken = extractCookieValue(cookieHeader, 'ruah_session');

  const session = normalizeAuthSession(decodeSessionToken(sessionToken));
  if (session) {
    return {
      actorId: session.userId,
      actorRole: session.activeRole,
    };
  }

  const allowHeaderFallback = !productionLike && (process.env.NODE_ENV !== 'production' || process.env.ALLOW_HEADER_ACTOR_FALLBACK === 'true');
  if (!allowHeaderFallback) {
    return null;
  }

  const actorId = request.headers.get('x-actor-id');
  const actorRole = request.headers.get('x-actor-role');
  if (!actorId || !isUserRole(actorRole)) return null;
  return { actorId, actorRole };
}

function hasAnyRole(actorRole: UserRole | null | undefined, roles: readonly UserRole[]) {
  return Boolean(actorRole && roles.includes(actorRole));
}

export function isActorRole(actor: AccessActor | null, role: UserRole) {
  return Boolean(actor && actor.actorRole === role);
}

export function canManageFinancialOperationsRole(actorRole: UserRole | null | undefined) {
  return hasAnyRole(actorRole, ['finance_admin', 'platform_admin']);
}

export function canManagePaymentConnectorsRole(actorRole: UserRole | null | undefined) {
  return hasAnyRole(actorRole, ['finance_admin', 'platform_admin']);
}

export function canApproveImpactReviewsRole(actorRole: UserRole | null | undefined) {
  return hasAnyRole(actorRole, ['platform_admin']);
}

export function canReadImpactReviewsRole(actorRole: UserRole | null | undefined) {
  return hasAnyRole(actorRole, ['curator', 'support_agent', 'finance_admin', 'platform_admin']);
}

export function canModerateCampaignsRole(actorRole: UserRole | null | undefined) {
  return hasAnyRole(actorRole, ['curator', 'platform_admin']);
}

export function canModerateArtworksRole(actorRole: UserRole | null | undefined) {
  return hasAnyRole(actorRole, ['curator', 'platform_admin']);
}

export function canOperateSupportRole(actorRole: UserRole | null | undefined) {
  return hasAnyRole(actorRole, ['support_agent', 'platform_admin']);
}

export function canReadRegistrationQueueRole(actorRole: UserRole | null | undefined) {
  return hasAnyRole(actorRole, ['support_agent', 'platform_admin']);
}

export function canSendRegistrationReminderRole(actorRole: UserRole | null | undefined) {
  return hasAnyRole(actorRole, ['support_agent', 'platform_admin']);
}

export function canManageRegistrationStatusRole(actorRole: UserRole | null | undefined) {
  return hasAnyRole(actorRole, ['platform_admin']);
}

export function canReadCampaignWorkspaceActor(actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor) return false;
  return isActorRole(actor, 'community_manager') || canModerateCampaignsRole(actor.actorRole);
}

export function canCreateCampaignActor(actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor) return false;
  return hasAnyRole(actor.actorRole, ['community_manager', 'platform_admin']);
}

export function canReadAffiliateWorkspaceActor(actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor) return false;
  return hasAnyRole(actor.actorRole, ['affiliate', 'platform_admin']);
}

export function canManageAffiliateLinksActor(actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor) return false;
  return hasAnyRole(actor.actorRole, ['affiliate', 'platform_admin']);
}

export function canRecordAffiliateConversionActor(actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor) return false;
  return hasAnyRole(actor.actorRole, ['platform_admin']);
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

export function canAccessProductionWorkspace(actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor) return false;
  return actor.actorRole === 'production_operator' || actor.actorRole === 'supplier' || actor.actorRole === 'platform_admin';
}

export function hasGlobalProductionScope(actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor) return false;
  return actor.actorRole === 'production_operator' || actor.actorRole === 'platform_admin';
}

export function getUniqueSupplierIdsFromOrder(order: OrderRecord) {
  return Array.from(new Set(order.items.map((item) => item.supplierId).filter((supplierId) => supplierId.trim().length > 0)));
}

function hasStrictSupplierProductionScope(order: OrderRecord, actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor || actor.actorRole !== 'supplier') return false;
  const supplierIds = getUniqueSupplierIdsFromOrder(order);
  return supplierIds.length === 1 && supplierIds[0] === actor.actorId;
}

export function canReadProductionOrder(order: OrderRecord, actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor) return false;
  if (hasGlobalProductionScope(actor)) return true;
  return hasStrictSupplierProductionScope(order, actor);
}

export function canMutateProductionOrder(order: OrderRecord, actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor) return false;
  if (hasGlobalProductionScope(actor)) return true;
  return hasStrictSupplierProductionScope(order, actor);
}
