import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { PaymentExceptionError, rejectRefund } from '@/lib/payment-exception-service';
import { canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';

interface RejectRefundPayload {
  reason: string;
}

function isValidPayload(payload: unknown): payload is RejectRefundPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return typeof row.reason === 'string' && row.reason.trim().length > 0;
}

export async function POST(request: Request, context: { params: Promise<{ refundId: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive()) {
    if (!canManageFinancialOperations(actor?.actorRole)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const { refundId } = await context.params;
  try {
    const refund = await rejectRefund({
      refundId,
      actorId: actor?.actorId ?? 'system-finance',
      reason: payload.reason.trim(),
    });
    return NextResponse.json({ ok: true, refund });
  } catch (error) {
    if (error instanceof PaymentExceptionError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
