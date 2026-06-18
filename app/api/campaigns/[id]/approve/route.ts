import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canModerateCampaigns } from '@/lib/role-matrix/permission-matrix';
import { getLatestImpactReviewByEntity, getPendingImpactReviewByEntity } from '@/lib/impact-review-store';
import { updateCampaignStatus } from '@/lib/campaign-store';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (isRbacActive() && !canModerateCampaigns(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const pendingReview = getPendingImpactReviewByEntity('Campaign', id);
  if (pendingReview) {
    return NextResponse.json({ error: 'invalid_transition', detail: 'impact_review_pending', reviewId: pendingReview.reviewId }, { status: 409 });
  }
  const latestReview = getLatestImpactReviewByEntity('Campaign', id);
  if (latestReview && latestReview.status === 'rejected') {
    return NextResponse.json({ error: 'invalid_transition', detail: 'impact_review_rejected', reviewId: latestReview.reviewId }, { status: 409 });
  }

  const result = await updateCampaignStatus({ campaignId: id, from: ['pending_review', 'paused'], to: 'active' });
  if (result.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (result.kind === 'invalid_transition') return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: result.previous.status === 'paused' ? 'campaign.reactivated' : 'campaign.approved',
    entity_type: 'Campaign',
    entity_id: result.campaign.campaignId,
    previous_status: result.previous.status,
    new_status: result.campaign.status,
    reason: actor?.actorRole === 'curator' ? 'curator_approval' : 'platform_admin_approval',
  });

  return NextResponse.json({ ok: true, campaign: result.campaign });
}
