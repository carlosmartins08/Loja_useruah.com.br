import {
  canCreateCampaignActor,
  canModerateCampaignsRole,
  canReadCampaignWorkspaceActor,
  isActorRole,
  isRbacActive,
  type AccessActor,
} from '@/lib/access-control';
import type { CampaignRecord } from '@/lib/campaign-store';

const CAMPAIGN_PRODUCT_MUTABLE_STATUSES = new Set<CampaignRecord['status']>(['draft', 'rejected', 'paused']);

function isCommunityOwner(campaign: CampaignRecord, actor: AccessActor | null) {
  return Boolean(actor && isActorRole(actor, 'community_manager') && campaign.createdBy === actor.actorId);
}

export function canReadCampaignWorkspace(actor: AccessActor | null) {
  return canReadCampaignWorkspaceActor(actor);
}

export function canCreateCampaign(actor: AccessActor | null) {
  return canCreateCampaignActor(actor);
}

export function canReadCampaign(campaign: CampaignRecord, actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor) return false;
  if (canModerateCampaignsRole(actor.actorRole)) return true;
  return isCommunityOwner(campaign, actor);
}

export function canMutateOwnedCampaign(campaign: CampaignRecord, actor: AccessActor | null) {
  if (!isRbacActive()) return true;
  if (!actor) return false;
  if (isActorRole(actor, 'platform_admin')) return true;
  return isCommunityOwner(campaign, actor);
}

export function canManageCampaignProducts(campaign: CampaignRecord, actor: AccessActor | null) {
  return canMutateOwnedCampaign(campaign, actor);
}

export function isCampaignProductMutableStatus(status: CampaignRecord['status']) {
  return CAMPAIGN_PRODUCT_MUTABLE_STATUSES.has(status);
}
