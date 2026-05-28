import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getActorFromRequest } from '@/lib/access-control';
import { listCommissionsByOwner, reconcileCommissionAvailabilityForOwner } from '@/lib/commission-store';
import { createPayoutRequested, listPayoutsByOwner } from '@/lib/payout-store';
import { createImpactReview } from '@/lib/impact-review-store';
import { notifyImpactReviewEvent } from '@/lib/impact-notification-service';

interface PayoutPayload {
  amount: number;
  currency: 'BRL';
}

function isFinanceOwnerRole(role: string) {
  return role === 'artist' || role === 'community_manager';
}

function isValidPayload(payload: unknown): payload is PayoutPayload {
  if (!payload || typeof payload !== 'object') return false;
  const obj = payload as Record<string, unknown>;
  return typeof obj.amount === 'number' && obj.amount > 0 && obj.currency === 'BRL';
}

function getIdempotencyKey(request: Request) {
  const key = request.headers.get('x-idempotency-key');
  if (!key || key.trim().length < 8) return null;
  return key.trim();
}

export async function POST(request: Request) {
  const actor = getActorFromRequest(request);
  if (!actor || !isFinanceOwnerRole(actor.actorRole)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const idempotencyKey = getIdempotencyKey(request);
  if (!idempotencyKey) {
    return NextResponse.json({ error: 'validation_error', detail: 'missing_x_idempotency_key' }, { status: 422 });
  }

  await reconcileCommissionAvailabilityForOwner(actor.actorId);
  const commissions = (await listCommissionsByOwner(actor.actorId)).filter((row) => row.status === 'available');
  const grossAvailable = commissions.reduce((acc, row) => acc + row.amount, 0);
  const requested = (await listPayoutsByOwner(actor.actorId))
    .filter((row) => row.status === 'requested' || row.status === 'under_review' || row.status === 'approved')
    .reduce((acc, row) => acc + row.amount, 0);
  const availableToWithdraw = Number(Math.max(0, grossAvailable - requested).toFixed(2));

  if (payload.amount > availableToWithdraw) {
    return NextResponse.json({ error: 'insufficient_available_balance' }, { status: 409 });
  }

  const selectedCommissionIds: string[] = [];
  let remaining = payload.amount;
  for (const row of commissions) {
    if (remaining <= 0) break;
    selectedCommissionIds.push(row.commissionId);
    remaining = Number((remaining - row.amount).toFixed(2));
  }

  const result = await createPayoutRequested({
    ownerId: actor.actorId,
    ownerRole: actor.actorRole as 'artist' | 'community_manager',
    amount: payload.amount,
    currency: payload.currency,
    commissionIds: selectedCommissionIds,
    idempotencyKey,
  });

  if (result.created) {
    const impactReview = createImpactReview({
      domain: 'payout_finance',
      entityType: 'Payout',
      entityId: result.payout.payoutId,
      sensitiveFields: ['payoutDecision'],
      requestedBy: actor.actorId,
      priority: 'high',
      slaHours: 2,
    });
    appendAuditLog({
      actor_id: actor.actorId,
      actor_role: actor.actorRole,
      action: 'payout.requested',
      entity_type: 'Payout',
      entity_id: result.payout.payoutId,
      previous_status: 'none',
      new_status: result.payout.status,
      reason: `owner:${actor.actorId}`,
    });
    await notifyImpactReviewEvent({
      event: 'created_pending',
      reviewId: impactReview.review.reviewId,
      entityId: result.payout.payoutId,
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      dueAt: impactReview.review.dueAt,
    });
  }

  return NextResponse.json({ ok: true, payout: result.payout, reused: !result.created });
}
