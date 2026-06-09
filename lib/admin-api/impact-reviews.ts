import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { approveImpactReview, listImpactReviews, rejectImpactReview } from '@/lib/impact-review-store';
import { listIntegrationLogs } from '@/lib/integration-log-store';
import { canApproveImpactReviews } from '@/lib/role-matrix/permission-matrix';
import { notifyImpactReviewEvent } from '@/lib/impact-notification-service';

interface ApprovePayload {
  reason?: string;
}

interface RejectPayload {
  reason: string;
}

interface ImpactReviewRouteContext {
  params: Promise<{ id: string }>;
}

function ensureImpactReviewAccess(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !canApproveImpactReviews(actor?.actorRole)) {
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

export async function handleAdminImpactReviewsGet(request: Request) {
  const { error } = ensureImpactReviewAccess(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const statusInput = searchParams.get('status');
  const status =
    statusInput === 'pending_review' || statusInput === 'approved' || statusInput === 'rejected' ? statusInput : undefined;
  const onlyOverdue = searchParams.get('onlyOverdue') === 'true';
  const reviews = listImpactReviews({ status, onlyOverdue });
  return NextResponse.json({ ok: true, reviews });
}

export async function handleAdminImpactReviewNotificationsGet(request: Request) {
  const { error } = ensureImpactReviewAccess(request);
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

export async function handleAdminImpactReviewRejectPost(request: Request, context: ImpactReviewRouteContext) {
  const { actor, error } = ensureImpactReviewAccess(request);
  if (error) return error;

  const payload = await request.json().catch(() => null);
  if (!isValidRejectPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const { id } = await context.params;
  const result = rejectImpactReview({
    reviewId: id,
    rejectedBy: actor?.actorId ?? 'unknown',
    reason: payload.reason,
  });
  if (result.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (result.kind === 'missing_reason') return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  if (result.kind === 'invalid_transition') return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });

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
