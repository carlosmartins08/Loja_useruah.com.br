import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canMutateOwnedCampaign } from '@/lib/campaign-access';
import { getCampaign, updateCampaignStatus } from '@/lib/campaign-store';
import { createImpactReview } from '@/lib/impact-review-store';
import { notifyImpactReviewEvent } from '@/lib/impact-notification-service';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const campaign = getCampaign(id);
  if (!campaign) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (isRbacActive() && !canMutateOwnedCampaign(campaign, actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const result = await updateCampaignStatus({ campaignId: id, from: ['draft', 'rejected'], to: 'pending_review' });
  if (result.kind === 'invalid_transition') return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });
  if (result.kind !== 'updated') return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const impactReview = createImpactReview({
    domain: 'campaign_growth',
    entityType: 'Campaign',
    entityId: result.campaign.campaignId,
    sensitiveFields: ['campaignBudget', 'progressivePriceRule'],
    requestedBy: actor?.actorId ?? 'unknown',
    priority: 'high',
    slaHours: 2,
  });

  if (impactReview.created) {
    await notifyImpactReviewEvent({
      event: 'created_pending',
      reviewId: impactReview.review.reviewId,
      entityId: result.campaign.campaignId,
      actorId: actor?.actorId ?? 'unknown',
      actorRole: actor?.actorRole ?? 'unknown',
      dueAt: impactReview.review.dueAt,
    });
  }

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'campaign.submitted',
    entity_type: 'Campaign',
    entity_id: result.campaign.campaignId,
    previous_status: result.previous.status,
    new_status: result.campaign.status,
  });

  return NextResponse.json({ ok: true, campaign: result.campaign });
}
