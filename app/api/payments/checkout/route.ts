import { NextResponse } from 'next/server';
import { createPaymentWithIdempotency, PaymentFlowError } from '@/lib/payment-service';
import type { CheckoutPaymentPayload } from '@/lib/payments';
import { getPaymentGateway } from '@/lib/payment-gateway-registry';

function isValidPayload(payload: unknown): payload is CheckoutPaymentPayload {
  if (!payload || typeof payload !== 'object') return false;
  const obj = payload as Record<string, unknown>;
  const methodValid = obj.method === 'card' || obj.method === 'pix' || obj.method === 'wallet';
  const providerValid = obj.provider === undefined || (typeof obj.provider === 'string' && Boolean(getPaymentGateway(obj.provider)));
  const orderValid = typeof obj.orderId === 'string' && obj.orderId.length > 0;
  const amountValid = typeof obj.amount === 'number' && obj.amount > 0;
  const currencyValid = obj.currency === 'BRL';
  const itemsValid =
    Array.isArray(obj.items) &&
    obj.items.length > 0 &&
    obj.items.every((item) => {
      if (!item || typeof item !== 'object') return false;
      const entry = item as Record<string, unknown>;
      return (
        typeof entry.id === 'string' &&
        typeof entry.name === 'string' &&
        typeof entry.quantity === 'number' &&
        entry.quantity > 0 &&
        typeof entry.unitPrice === 'number' &&
        entry.unitPrice > 0
      );
    });

  return orderValid && methodValid && providerValid && amountValid && currencyValid && itemsValid;
}

function getIdempotencyKey(request: Request) {
  const header = request.headers.get('x-idempotency-key');
  if (header && header.trim().length >= 8) return header.trim();
  return null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!isValidPayload(body)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const idempotencyKey = getIdempotencyKey(request);
  if (!idempotencyKey) {
    return NextResponse.json({ error: 'validation_error', detail: 'missing_x_idempotency_key' }, { status: 422 });
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
