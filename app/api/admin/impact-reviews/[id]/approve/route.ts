import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { approveImpactReview } from '@/lib/impact-review-store';
import { canApproveImpactReviews } from '@/lib/role-matrix/permission-matrix';
import { notifyImpactReviewEvent } from '@/lib/impact-notification-service';

interface ApprovePayload {
  reason?: string;
}

function isValidPayload(payload: unknown): payload is ApprovePayload {
  if (payload === null || payload === undefined) return true;
  if (typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return row.reason === undefined || typeof row.reason === 'string';
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canApproveImpactReviews(actor?.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const payload = await request.json().catch(() => ({}));
  if (!isValidPayload(payload)) return NextResponse.json({ error: 'validation_error' }, { status: 422 });

  const { id } = await context.params;
  const result = approveImpactReview({
    reviewId: id,
    approvedBy: actor?.actorId ?? 'unknown',
    reason: payload.reason,
  });
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
