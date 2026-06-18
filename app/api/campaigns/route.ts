import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canCreateCampaign, canReadCampaign, canReadCampaignWorkspace } from '@/lib/campaign-access';
import { countCampaignProducts } from '@/lib/campaign-product-store';
import { createCampaign, listCampaigns, type CampaignStatus } from '@/lib/campaign-store';
import { createImpactReview } from '@/lib/impact-review-store';
import { notifyImpactReviewEvent } from '@/lib/impact-notification-service';

interface CreateCampaignPayload {
  organizationId: string;
  name: string;
  description: string;
  budget: number;
  progressivePriceRule: string;
  startsAt?: string;
  endsAt?: string;
}

function parseStatus(input: string | null): CampaignStatus | undefined {
  if (!input) return undefined;
  if (input === 'draft' || input === 'pending_review' || input === 'active' || input === 'paused' || input === 'closed' || input === 'rejected' || input === 'cancelled') return input;
  return undefined;
}

function isValidPayload(payload: unknown): payload is CreateCampaignPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return (
    typeof row.organizationId === 'string' &&
    typeof row.name === 'string' &&
    typeof row.description === 'string' &&
    typeof row.budget === 'number' &&
    row.budget >= 0 &&
    typeof row.progressivePriceRule === 'string' &&
    (row.startsAt === undefined || typeof row.startsAt === 'string') &&
    (row.endsAt === undefined || typeof row.endsAt === 'string')
  );
}

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (isRbacActive() && !canReadCampaignWorkspace(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = parseStatus(searchParams.get('status'));
  const organizationId = searchParams.get('organizationId') ?? undefined;
  const createdBy = isRbacActive() && actor?.actorRole === 'community_manager' ? actor.actorId : undefined;
  const campaigns = (await listCampaigns({ status, organizationId, createdBy })).filter((campaign) => canReadCampaign(campaign, actor));
  return NextResponse.json({
    ok: true,
    campaigns: campaigns.map((campaign) => ({
      ...campaign,
      productCount: countCampaignProducts(campaign.campaignId),
    })),
  });
}

export async function POST(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (isRbacActive() && !canCreateCampaign(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const campaign = await createCampaign({
    organizationId: payload.organizationId,
    name: payload.name.trim(),
    description: payload.description.trim(),
    budget: payload.budget,
    progressivePriceRule: payload.progressivePriceRule.trim(),
    startsAt: payload.startsAt,
    endsAt: payload.endsAt,
    createdBy: actor?.actorId ?? 'unknown',
  });

  const impactReview = createImpactReview({
    domain: 'campaign_growth',
    entityType: 'Campaign',
    entityId: campaign.campaignId,
    sensitiveFields: ['campaignBudget', 'progressivePriceRule'],
    requestedBy: actor?.actorId ?? 'unknown',
    priority: 'high',
    slaHours: 2,
  });

  await notifyImpactReviewEvent({
    event: 'created_pending',
    reviewId: impactReview.review.reviewId,
    entityId: campaign.campaignId,
    actorId: actor?.actorId ?? 'unknown',
    actorRole: actor?.actorRole ?? 'unknown',
    dueAt: impactReview.review.dueAt,
  });

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'campaign.created',
    entity_type: 'Campaign',
    entity_id: campaign.campaignId,
    previous_status: 'none',
    new_status: campaign.status,
    reason: `organization:${campaign.organizationId}`,
  });

  return NextResponse.json(
    {
      ok: true,
      campaign: {
        ...campaign,
        productCount: 0,
      },
      governance: { reviewId: impactReview.review.reviewId, reviewDueAt: impactReview.review.dueAt },
    },
    { status: 201 }
  );
}
