import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canApproveImpactReviews } from '@/lib/role-matrix/permission-matrix';
import { getLatestImpactReviewByEntity, getPendingImpactReviewByEntity } from '@/lib/impact-review-store';
import { updatePayoutStatus } from '@/lib/payout-store';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canApproveImpactReviews(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const pendingReview = getPendingImpactReviewByEntity('Payout', id);
  if (pendingReview) {
    return NextResponse.json({ error: 'invalid_transition', detail: 'impact_review_pending', reviewId: pendingReview.reviewId }, { status: 409 });
  }
  const latestReview = getLatestImpactReviewByEntity('Payout', id);
  if (latestReview && latestReview.status === 'rejected') {
    return NextResponse.json({ error: 'invalid_transition', detail: 'impact_review_rejected', reviewId: latestReview.reviewId }, { status: 409 });
  }

  const result = await updatePayoutStatus({ payoutId: id, from: ['under_review', 'requested'], to: 'approved' });
  if (result.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (result.kind === 'invalid_transition') return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'payout.approved',
    entity_type: 'Payout',
    entity_id: result.payout.payoutId,
    previous_status: result.previous.status,
    new_status: result.payout.status,
    reason: 'manual_financial_approval',
  });

  return NextResponse.json({ ok: true, payout: result.payout });
}

