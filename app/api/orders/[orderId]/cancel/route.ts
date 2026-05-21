import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { cancelOrderWithFinancials, PaymentExceptionError } from '@/lib/payment-exception-service';
import { getOrder } from '@/lib/order-store';

interface CancelOrderPayload {
  reason: string;
}

function isValidPayload(payload: unknown): payload is CancelOrderPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return typeof row.reason === 'string' && row.reason.trim().length > 0;
}

function canCancelOrderByRole(
  status: string,
  actor: { actorId: string; actorRole: string } | null,
  customerId: string
) {
  if (!isRbacActive()) return true;
  if (!actor) return false;
  if (actor.actorRole === 'platform_admin' || actor.actorRole === 'support_agent') return true;
  if (actor.actorRole === 'customer' && actor.actorId === customerId) {
    return status === 'placed' || status === 'cancelled';
  }
  return false;
}

export async function POST(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params;
  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const order = await getOrder(orderId);
  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const actor = getActorFromRequest(request);
  if (!canCancelOrderByRole(order.status, actor, order.customerId)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const actorId = actor?.actorId ?? order.customerId;
  const actorRole = actor?.actorRole ?? 'customer';

  try {
    const result = await cancelOrderWithFinancials({
      orderId,
      actorId,
      actorRole,
      reason: payload.reason.trim(),
    });
    return NextResponse.json({ ok: true, order: result.order, payment: result.payment });
  } catch (error) {
    if (error instanceof PaymentExceptionError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
