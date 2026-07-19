import { getCatalogItem } from '@/lib/catalog-item-store';
import { listCampaignProducts } from '@/lib/campaign-product-store';
import { getCampaign } from '@/lib/campaign-store';
import { listAuditLogs } from '@/lib/audit-log-store';
import {
  getLatestImpactReviewByEntity,
  getPendingImpactReviewByEntity,
  listImpactReviewsByEntities,
  type ImpactReviewRecord,
  type ImpactReviewStatus,
} from '@/lib/impact-review-store';
import { listCommunityCampaignRevenueByOwner } from '@/lib/community-campaign-revenue';

const CAMPAIGN_TIMELINE_ACTIONS = new Set([
  'campaign.created',
  'campaign.product_linked',
  'campaign.product_unlinked',
  'campaign.submitted',
  'campaign.approved',
  'campaign.reactivated',
  'campaign.paused',
  'campaign.closed',
  'campaign.cancelled',
  'campaign.rejected',
]);

const IMPACT_TIMELINE_ACTIONS = new Set(['impact_review_approved', 'impact_review_rejected']);

export interface CampaignGovernanceDetail {
  reviewId: string;
  status: ImpactReviewStatus;
  createdAt: string;
  updatedAt: string;
  dueAt: string;
  requestedBy: string;
  approvedBy?: string;
  rejectedBy?: string;
  decisionReason: string | null;
  historyCount: number;
}

export interface CampaignTimelineEvent {
  type:
    | 'campaign.created'
    | 'campaign.product_linked'
    | 'campaign.product_unlinked'
    | 'campaign.submitted'
    | 'impact_review_approved'
    | 'impact_review_rejected'
    | 'campaign.approved'
    | 'campaign.reactivated'
    | 'campaign.paused'
    | 'campaign.closed'
    | 'campaign.cancelled'
    | 'campaign.rejected';
  label: string;
  occurredAt: string;
  actorId: string;
  actorRole: string;
  source: 'audit_log' | 'impact_review_store';
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  reviewId?: string;
}

export interface CampaignReadinessBlocker {
  code: 'NO_LINKED_PRODUCTS' | 'IMPACT_REVIEW_PENDING' | 'IMPACT_REVIEW_REJECTED' | 'PUBLIC_STOREFRONT_OFFLINE';
  message: string;
}

function toGovernanceSummary(review: ImpactReviewRecord, historyCount: number): CampaignGovernanceDetail {
  return {
    reviewId: review.reviewId,
    status: review.status,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    dueAt: review.dueAt,
    requestedBy: review.requestedBy,
    approvedBy: review.approvedBy,
    rejectedBy: review.rejectedBy,
    decisionReason: review.decisionReason ?? null,
    historyCount,
  };
}

function timelineLabel(type: CampaignTimelineEvent['type']) {
  switch (type) {
    case 'campaign.created':
      return 'Campanha criada';
    case 'campaign.product_linked':
      return 'Produto vinculado';
    case 'campaign.product_unlinked':
      return 'Produto removido';
    case 'campaign.submitted':
      return 'Campanha submetida';
    case 'impact_review_approved':
      return 'Impact review aprovada';
    case 'impact_review_rejected':
      return 'Impact review rejeitada';
    case 'campaign.approved':
      return 'Campanha ativada';
    case 'campaign.reactivated':
      return 'Campanha reativada';
    case 'campaign.paused':
      return 'Campanha pausada';
    case 'campaign.closed':
      return 'Campanha encerrada';
    case 'campaign.cancelled':
      return 'Campanha cancelada';
    case 'campaign.rejected':
      return 'Campanha rejeitada';
    default:
      return type;
  }
}

function buildReadiness(input: {
  campaignStatus: string;
  linkedProductCount: number;
  hasPendingImpactReview: boolean;
  latestImpactRejected: boolean;
}) {
  const hasLinkedProducts = input.linkedProductCount > 0;
  const isPublicStorefrontLive = input.campaignStatus === 'active';
  const blockers: CampaignReadinessBlocker[] = [];

  if (!hasLinkedProducts) {
    blockers.push({
      code: 'NO_LINKED_PRODUCTS',
      message: 'Sem produtos vinculados na vitrine desta campanha.',
    });
  }

  if (input.hasPendingImpactReview) {
    blockers.push({
      code: 'IMPACT_REVIEW_PENDING',
      message: 'Existe impact review pendente para esta campanha.',
    });
  }

  if (input.latestImpactRejected) {
    blockers.push({
      code: 'IMPACT_REVIEW_REJECTED',
      message: 'A ultima decisao de impacto foi rejeitada.',
    });
  }

  if (!isPublicStorefrontLive) {
    blockers.push({
      code: 'PUBLIC_STOREFRONT_OFFLINE',
      message: 'A vitrine publica ainda nao esta ativa.',
    });
  }

  return {
    hasLinkedProducts,
    hasPendingImpactReview: input.hasPendingImpactReview,
    latestImpactRejected: input.latestImpactRejected,
    isPublicStorefrontLive,
    canSubmit: input.campaignStatus === 'draft' || input.campaignStatus === 'rejected',
    canActivate:
      (input.campaignStatus === 'pending_review' || input.campaignStatus === 'paused') &&
      !input.hasPendingImpactReview &&
      !input.latestImpactRejected,
    canPause: input.campaignStatus === 'active',
    canClose: input.campaignStatus === 'active' || input.campaignStatus === 'paused',
    blockers,
  };
}

export async function getCampaignOperationalDetail(campaignId: string) {
  const campaign = await getCampaign(campaignId);
  if (!campaign) return null;

  const [links, campaignRevenue] = await Promise.all([
    Promise.all(
      (await listCampaignProducts(campaignId)).map(async (link) => {
        const item = await getCatalogItem(link.catalogItemId);
        return {
          ...link,
          item: item
            ? {
                catalogItemId: item.catalogItemId,
                name: item.name,
                price: item.price,
                image: item.image,
                category: item.category,
                segment: item.segment,
                publicationStatus: item.publicationStatus,
              }
            : null,
        };
      })
    ),
    listCommunityCampaignRevenueByOwner(campaign.createdBy, { includeOrders: true }),
  ]);
  const governanceHistory = (await listImpactReviewsByEntities('Campaign', [campaignId]))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((review, index, history) => toGovernanceSummary(review, history.length));
  const latestGovernance = governanceHistory[0] ?? null;
  const pendingGovernance = await getPendingImpactReviewByEntity('Campaign', campaignId);
  const latestImpactReview = await getLatestImpactReviewByEntity('Campaign', campaignId);
  const reviewIds = new Set(governanceHistory.map((review) => review.reviewId));
  const reviewsById = new Map(governanceHistory.map((review) => [review.reviewId, review]));
  const fallbackImpactEvents = new Set<string>();

  const timeline = listAuditLogs()
    .filter((row) => {
      if (row.entity_type === 'Campaign' && row.entity_id === campaignId) {
        return CAMPAIGN_TIMELINE_ACTIONS.has(row.action);
      }

      return row.entity_type === 'ImpactReview' && reviewIds.has(row.entity_id) && IMPACT_TIMELINE_ACTIONS.has(row.action);
    })
    .map<CampaignTimelineEvent | null>((row) => {
      if (row.entity_type === 'Campaign' && CAMPAIGN_TIMELINE_ACTIONS.has(row.action)) {
        return {
          type: row.action as CampaignTimelineEvent['type'],
          label: timelineLabel(row.action as CampaignTimelineEvent['type']),
          occurredAt: row.created_at,
          actorId: row.actor_id,
          actorRole: row.actor_role,
          source: 'audit_log',
          previousStatus: row.previous_status,
          newStatus: row.new_status,
          reason: row.reason,
        };
      }

      const review = reviewsById.get(row.entity_id);
      if (!review) return null;
      fallbackImpactEvents.add(`${review.reviewId}:${row.action}`);
      return {
        type: row.action as CampaignTimelineEvent['type'],
        label: timelineLabel(row.action as CampaignTimelineEvent['type']),
        occurredAt: row.created_at,
        actorId: row.actor_id,
        actorRole: row.actor_role,
        source: 'audit_log',
        previousStatus: row.previous_status,
        newStatus: row.new_status,
        reason: row.reason ?? review.decisionReason ?? undefined,
        reviewId: review.reviewId,
      };
    })
    .filter((row): row is CampaignTimelineEvent => Boolean(row));

  for (const review of governanceHistory) {
    if (review.status !== 'approved' && review.status !== 'rejected') continue;
    const eventType = review.status === 'approved' ? 'impact_review_approved' : 'impact_review_rejected';
    if (fallbackImpactEvents.has(`${review.reviewId}:${eventType}`)) continue;
    timeline.push({
      type: eventType,
      label: timelineLabel(eventType),
      occurredAt: review.updatedAt,
      actorId: review.approvedBy ?? review.rejectedBy ?? review.requestedBy,
      actorRole: 'governance',
      source: 'impact_review_store',
      reason: review.decisionReason ?? undefined,
      reviewId: review.reviewId,
    });
  }

  timeline.sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));

  const attributionSummary =
    campaignRevenue.campaigns.find((row) => row.campaignId === campaignId) ??
    ({
      campaignId,
      campaignName: campaign.name,
      campaignStatus: campaign.status,
      orderCount: 0,
      commissionCount: 0,
      pending: 0,
      availableGross: 0,
      latestOrderAt: null,
    } as const);

  return {
    campaign: {
      ...campaign,
      productCount: links.length,
    },
    governance: latestGovernance,
    governanceHistory,
    timeline,
    linkedProducts: links,
    readiness: buildReadiness({
      campaignStatus: campaign.status,
      linkedProductCount: links.length,
      hasPendingImpactReview: Boolean(pendingGovernance),
      latestImpactRejected: latestImpactReview?.status === 'rejected',
    }),
    attributionSummary: {
      ...attributionSummary,
      orders: (campaignRevenue.orders ?? []).filter((row) => row.campaignId === campaignId),
    },
  };
}
