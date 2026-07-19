import { NextResponse } from 'next/server';
import { getActorFromRequest } from '@/lib/access-control';
import { createPaymentWithIdempotency, PaymentFlowError } from '@/lib/payment-service';
import type { PaymentCheckoutRequest } from '@/lib/payments';
import { getOrder } from '@/lib/order-store';
import { getPaymentGateway } from '@/lib/payment-gateway-registry';

function isValidPayload(payload: unknown): payload is PaymentCheckoutRequest {
  if (!payload || typeof payload !== 'object') return false;
  const obj = payload as Record<string, unknown>;
  const methodValid = obj.method === 'card' || obj.method === 'pix' || obj.method === 'wallet';
  const providerValid = obj.provider === undefined || (typeof obj.provider === 'string' && Boolean(getPaymentGateway(obj.provider)));
  const orderValid = typeof obj.orderId === 'string' && obj.orderId.length > 0;

  return orderValid && methodValid && providerValid;
}

function getIdempotencyKey(request: Request) {
  const header = request.headers.get('x-idempotency-key');
  if (header && header.trim().length >= 8) return header.trim();
  return null;
}

export async function POST(request: Request) {
  const actor = getActorFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (actor.actorRole !== 'customer') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  if (!isValidPayload(body)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const idempotencyKey = getIdempotencyKey(request);
  if (!idempotencyKey) {
    return NextResponse.json({ error: 'validation_error', detail: 'missing_x_idempotency_key' }, { status: 422 });
  }

  const order = await getOrder(body.orderId);
  if (!order) {
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
  }
  if (order.customerId !== actor.actorId) {
    return NextResponse.json({ error: 'forbidden', detail: 'order_customer_mismatch' }, { status: 403 });
  }

  try {
    const result = await createPaymentWithIdempotency(body, idempotencyKey);

    return NextResponse.json({
      ok: true,
      payment: result.payment,
      nextAction: result.nextAction,
      idempotencyKey,
      reused: result.reused,
    });
  } catch (error) {
    if (error instanceof PaymentFlowError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    const detail = error instanceof Error ? error.message : 'unknown_error';
    return NextResponse.json(
      process.env.NODE_ENV === 'production' ? { error: 'internal_error' } : { error: 'internal_error', detail },
      { status: 500 }
    );
  }
}
