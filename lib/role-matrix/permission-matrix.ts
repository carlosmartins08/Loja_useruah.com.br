import type { UserRole } from '@/lib/auth-session';
import {
  canApproveImpactReviewsRole,
  canManageFinancialOperationsRole,
  canManagePaymentConnectorsRole,
  canManageRegistrationStatusRole,
  canModerateArtworksRole,
  canModerateCampaignsRole,
  canOperateSupportRole,
  canReadImpactReviewsRole,
  canReadRegistrationQueueRole,
  canSendRegistrationReminderRole,
} from '@/lib/access-control';

export function canManageFinancialOperations(actorRole: UserRole | null | undefined) {
  return canManageFinancialOperationsRole(actorRole);
}

export function canManagePaymentConnectors(actorRole: UserRole | null | undefined) {
  return canManagePaymentConnectorsRole(actorRole);
}

export function canApproveImpactReviews(actorRole: UserRole | null | undefined) {
  return canApproveImpactReviewsRole(actorRole);
}

export function canReadImpactReviews(actorRole: UserRole | null | undefined) {
  return canReadImpactReviewsRole(actorRole);
}

export function canModerateCampaigns(actorRole: UserRole | null | undefined) {
  return canModerateCampaignsRole(actorRole);
}

export function canModerateArtworks(actorRole: UserRole | null | undefined) {
  return canModerateArtworksRole(actorRole);
}

export function canOperateSupport(actorRole: UserRole | null | undefined) {
  return canOperateSupportRole(actorRole);
}

export function canReadRegistrationQueue(actorRole: UserRole | null | undefined) {
  return canReadRegistrationQueueRole(actorRole);
}

export function canSendRegistrationReminder(actorRole: UserRole | null | undefined) {
  return canSendRegistrationReminderRole(actorRole);
}

export function canManageRegistrationStatus(actorRole: UserRole | null | undefined) {
  return canManageRegistrationStatusRole(actorRole);
}
