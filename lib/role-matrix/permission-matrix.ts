export function canManageFinancialOperations(actorRole: string | null | undefined) {
  return actorRole === 'finance_admin' || actorRole === 'platform_admin';
}

export function canManagePaymentConnectors(actorRole: string | null | undefined) {
  return actorRole === 'platform_admin' || actorRole === 'finance_admin';
}

export function canApproveImpactReviews(actorRole: string | null | undefined) {
  return actorRole === 'platform_admin';
}

export function canModerateCampaigns(actorRole: string | null | undefined) {
  return actorRole === 'platform_admin' || actorRole === 'curator';
}

export function canModerateArtworks(actorRole: string | null | undefined) {
  return actorRole === 'platform_admin' || actorRole === 'curator';
}

export function canOperateSupport(actorRole: string | null | undefined) {
  return actorRole === 'support_agent' || actorRole === 'platform_admin';
}

export function canReadRegistrationQueue(actorRole: string | null | undefined) {
  return actorRole === 'support_agent' || actorRole === 'platform_admin';
}

export function canSendRegistrationReminder(actorRole: string | null | undefined) {
  return actorRole === 'support_agent' || actorRole === 'platform_admin';
}

export function canManageRegistrationStatus(actorRole: string | null | undefined) {
  return actorRole === 'platform_admin';
}
