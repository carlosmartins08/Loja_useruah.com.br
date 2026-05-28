import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { approveRefund, PaymentExceptionError } from '@/lib/payment-exception-service';
import { canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';
import { getLatestImpactReviewByEntity, getPendingImpactReviewByEntity } from '@/lib/impact-review-store';

export async function POST(request: Request, context: { params: Promise<{ refundId: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive()) {
    if (!canManageFinancialOperations(actor?.actorRole)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { refundId } = await context.params;
  const pendingReview = getPendingImpactReviewByEntity('Refund', refundId);
  if (pendingReview) {
    return NextResponse.json({ error: 'invalid_transition', detail: 'impact_review_pending', reviewId: pendingReview.reviewId }, { status: 409 });
  }
  const latestReview = getLatestImpactReviewByEntity('Refund', refundId);
  if (latestReview && latestReview.status === 'rejected') {
    return NextResponse.json({ error: 'invalid_transition', detail: 'impact_review_rejected', reviewId: latestReview.reviewId }, { status: 409 });
  }

  try {
    const refund = await approveRefund({
      refundId,
      actorId: actor?.actorId ?? 'system-finance',
    });
    return NextResponse.json({ ok: true, refund });
  } catch (error) {
    if (error instanceof PaymentExceptionError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
