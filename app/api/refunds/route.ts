import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { PaymentExceptionError, requestRefund } from '@/lib/payment-exception-service';
import { canManageFinancialOperations, canOperateSupport } from '@/lib/role-matrix/permission-matrix';

interface RefundRequestPayload {
  orderId: string;
  reason: string;
}

function isValidPayload(payload: unknown): payload is RefundRequestPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return (
    typeof row.orderId === 'string' &&
    row.orderId.trim().length > 0 &&
    typeof row.reason === 'string' &&
    row.reason.trim().length > 0
  );
}

function getIdempotencyKey(request: Request) {
  const key = request.headers.get('x-idempotency-key');
  if (!key || key.trim().length < 8) return null;
  return key.trim();
}

export async function POST(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive()) {
    const allowed = canOperateSupport(actor?.actorRole) || canManageFinancialOperations(actor?.actorRole);
    if (!allowed) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const idempotencyKey = getIdempotencyKey(request);
  if (!idempotencyKey) {
    return NextResponse.json({ error: 'validation_error', detail: 'missing_x_idempotency_key' }, { status: 422 });
  }

  try {
    const result = await requestRefund({
      orderId: payload.orderId.trim(),
      reason: payload.reason.trim(),
      actorId: actor?.actorId ?? 'system-support',
      idempotencyKey,
    });
    return NextResponse.json({ ok: true, refund: result.refund, reused: result.reused }, { status: result.reused ? 200 : 201 });
  } catch (error) {
    if (error instanceof PaymentExceptionError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
