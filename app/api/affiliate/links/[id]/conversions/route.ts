import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canRecordAffiliateConversionActor, getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { getReferralLinkById, recordReferralConversion } from '@/lib/referral-store';

interface ConversionPayload {
  orderId: string;
  revenueAmount: number;
}

function isValidPayload(payload: unknown): payload is ConversionPayload {
  if (!payload || typeof payload !== 'object') return false;
  const body = payload as Record<string, unknown>;
  return typeof body.orderId === 'string' && body.orderId.trim().length > 0 && typeof body.revenueAmount === 'number' && body.revenueAmount > 0;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!canRecordAffiliateConversionActor(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const { id } = await context.params;
  const link = await getReferralLinkById(id);
  if (!link) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const result = await recordReferralConversion({
    referralLinkId: id,
    orderId: payload.orderId.trim(),
    revenueAmount: payload.revenueAmount,
  });
  if (result.kind === 'not_found') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (result.kind === 'already_recorded') {
    return NextResponse.json({ ok: true, event: result.event, reused: true });
  }

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'referral_conversion_recorded',
    entity_type: 'ReferralLink',
    entity_id: link.referralLinkId,
    reason: `order:${payload.orderId.trim()}|revenue:${payload.revenueAmount.toFixed(2)}`,
  });

  return NextResponse.json({ ok: true, event: result.event }, { status: 201 });
}
