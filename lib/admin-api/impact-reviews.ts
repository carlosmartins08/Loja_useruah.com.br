import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import {
  approveImpactReview,
  getImpactReview,
  listImpactReviews,
  rejectImpactReview,
  type ImpactReviewEntityType,
  type ImpactReviewRecord,
} from '@/lib/impact-review-store';
import { listIntegrationLogs } from '@/lib/integration-log-store';
import { canApproveImpactReviews, canReadImpactReviews } from '@/lib/role-matrix/permission-matrix';
import { notifyImpactReviewEvent } from '@/lib/impact-notification-service';
import { getCampaign, updateCampaignStatus } from '@/lib/campaign-store';
import { countCampaignProducts } from '@/lib/campaign-product-store';
import { listCampaigns } from '@/lib/campaign-store';

interface ApprovePayload {
  reason?: string;
}

interface RejectPayload {
  reason: string;
}

interface ImpactReviewRouteContext {
  params: Promise<{ id: string }>;
}

const IMPACT_ENTITY_TYPES: ImpactReviewEntityType[] = ['CatalogItem', 'Payout', 'Campaign', 'Refund', 'Chargeback'];

function ensureImpactReviewAccess(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canApproveImpactReviews(actor?.actorRole)) {
    return { actor, error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }

  return { actor, error: null };
}

function ensureImpactReviewReadAccess(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canReadImpactReviews(actor?.actorRole)) {
    return { actor, error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }

  return { actor, error: null };
}

function isValidApprovePayload(payload: unknown): payload is ApprovePayload {
  if (payload === null || payload === undefined) return true;
  if (typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return row.reason === undefined || typeof row.reason === 'string';
}

function isValidRejectPayload(payload: unknown): payload is RejectPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return typeof row.reason === 'string' && row.reason.trim().length > 0;
}

function parseImpactEntityType(input: string | null): ImpactReviewEntityType | undefined {
  if (!input) return undefined;
  return IMPACT_ENTITY_TYPES.includes(input as ImpactReviewEntityType) ? (input as ImpactReviewEntityType) : undefined;
}

async function serializeImpactReviews(reviews: ImpactReviewRecord[]) {
  const campaignIds = Array.from(new Set(reviews.filter((row) => row.entityType === 'Campaign').map((row) => row.entityId)));
  const campaigns =
    campaignIds.length > 0
      ? await listCampaigns().then((rows) => rows.filter((campaign) => campaignIds.includes(campaign.campaignId)))
      : [];
  const campaignRows = await Promise.all(
    campaigns.map(async (campaign) => [
      campaign.campaignId,
      {
        campaignId: campaign.campaignId,
        name: campaign.name,
        organizationId: campaign.organizationId,
        status: campaign.status,
        progressivePriceRule: campaign.progressivePriceRule,
        startsAt: campaign.startsAt,
        endsAt: campaign.endsAt,
        createdBy: campaign.createdBy,
        updatedAt: campaign.updatedAt,
        productCount: await countCampaignProducts(campaign.campaignId),
      },
    ] as const)
  );
  const campaignsById = new Map(campaignRows);

  return reviews.map((review) => ({
    ...review,
    campaign: review.entityType === 'Campaign' ? campaignsById.get(review.entityId) ?? null : undefined,
  }));
}

export async function handleAdminImpactReviewsGet(request: Request) {
  const { error } = ensureImpactReviewReadAccess(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const statusInput = searchParams.get('status');
  const entityType = parseImpactEntityType(searchParams.get('entityType'));
  const status =
    statusInput === 'pending_review' || statusInput === 'approved' || statusInput === 'rejected' ? statusInput : undefined;
  const onlyOverdue = searchParams.get('onlyOverdue') === 'true';
  let persistedReviews;
  try {
    persistedReviews = await listImpactReviews({ status, onlyOverdue });
  } catch {
    return NextResponse.json({ error: 'impact_review_persistence_unavailable' }, { status: 503 });
  }
  const reviews = (await serializeImpactReviews(persistedReviews))
    .filter((row) => (entityType ? row.entityType === entityType : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return NextResponse.json({ ok: true, reviews });
}

export async function handleAdminImpactReviewNotificationsGet(request: Request) {
  const { error } = ensureImpactReviewReadAccess(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const limitRaw = Number(searchParams.get('limit') ?? '20');
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 20;
  const logs = listIntegrationLogs({ provider: 'internal_ops', actionPrefix: 'impact_review_notify.', limit });
  return NextResponse.json({ ok: true, logs });
}

export async function handleAdminImpactReviewApprovePost(request: Request, context: ImpactReviewRouteContext) {
  const { actor, error } = ensureImpactReviewAccess(request);
  if (error) return error;

  const payload = await request.json().catch(() => ({}));
  if (!isValidApprovePayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const { id } = await context.params;
  let result;
  try {
    result = await approveImpactReview({
      reviewId: id,
      approvedBy: actor?.actorId ?? 'unknown',
      reason: payload.reason,
    });
  } catch {
    return NextResponse.json({ error: 'impact_review_persistence_unavailable' }, { status: 503 });
  }
  if (result.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (result.kind === 'invalid_transition') return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'impact_review_approved',
    entity_type: 'ImpactReview',
    entity_id: result.review.reviewId,
    previous_status: result.previous.status,
    new_status: result.review.status,
    reason: result.review.decisionReason ?? 'approved_by_platform_admin',
  });
  await notifyImpactReviewEvent({
    event: 'approved',
    reviewId: result.review.reviewId,
    entityId: result.review.entityId,
    actorId: actor?.actorId ?? 'unknown',
    actorRole: actor?.actorRole ?? 'unknown',
    reason: result.review.decisionReason,
  });

  return NextResponse.json({ ok: true, review: result.review });
}

export async function handleAdminImpactReviewRejectPost(request: Request, context: ImpactReviewRouteContext) {
  const { actor, error } = ensureImpactReviewAccess(request);
  if (error) return error;

  const payload = await request.json().catch(() => null);
  if (!isValidRejectPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const { id } = await context.params;
  let currentReview;
  try {
    currentReview = await getImpactReview(id);
  } catch {
    return NextResponse.json({ error: 'impact_review_persistence_unavailable' }, { status: 503 });
  }
  if (!currentReview) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (currentReview.entityType === 'Campaign') {
    const campaign = await getCampaign(currentReview.entityId);
    if (!campaign) {
      return NextResponse.json({ error: 'campaign_not_found_for_review' }, { status: 409 });
    }

    if (campaign.status !== 'pending_review') {
      return NextResponse.json(
        { error: 'invalid_transition', detail: 'campaign_not_pending_review', campaignStatus: campaign.status },
        { status: 409 }
      );
    }
  }

  let result;
  try {
    result = await rejectImpactReview({
      reviewId: id,
      rejectedBy: actor?.actorId ?? 'unknown',
      reason: payload.reason,
    });
  } catch {
    return NextResponse.json({ error: 'impact_review_persistence_unavailable' }, { status: 503 });
  }
  if (result.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (result.kind === 'missing_reason') return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  if (result.kind === 'invalid_transition') return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });

  if (result.review.entityType === 'Campaign') {
    const campaignSync = await updateCampaignStatus({
      campaignId: result.review.entityId,
      from: ['pending_review'],
      to: 'rejected',
    });

    if (campaignSync.kind === 'not_found') {
      return NextResponse.json({ error: 'campaign_not_found_for_review' }, { status: 409 });
    }

    if (campaignSync.kind === 'invalid_transition') {
      return NextResponse.json(
        { error: 'invalid_transition', detail: 'campaign_not_pending_review', campaignStatus: campaignSync.campaign.status },
        { status: 409 }
      );
    }

    appendAuditLog({
      actor_id: actor?.actorId ?? 'unknown',
      actor_role: actor?.actorRole ?? 'unknown',
      action: 'campaign.rejected',
      entity_type: 'Campaign',
      entity_id: campaignSync.campaign.campaignId,
      previous_status: campaignSync.previous.status,
      new_status: campaignSync.campaign.status,
      reason: result.review.decisionReason ?? 'rejected_by_platform_admin',
    });
  }

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'impact_review_rejected',
    entity_type: 'ImpactReview',
    entity_id: result.review.reviewId,
    previous_status: result.previous.status,
    new_status: result.review.status,
    reason: result.review.decisionReason ?? 'rejected_by_platform_admin',
  });
  await notifyImpactReviewEvent({
    event: 'rejected',
    reviewId: result.review.reviewId,
    entityId: result.review.entityId,
    actorId: actor?.actorId ?? 'unknown',
    actorRole: actor?.actorRole ?? 'unknown',
    reason: result.review.decisionReason,
  });

  return NextResponse.json({ ok: true, review: result.review });
}
