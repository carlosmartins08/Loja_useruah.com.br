import { NextResponse } from 'next/server';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { approveRefund, PaymentExceptionError } from '@/lib/payment-exception-service';

export async function POST(request: Request, context: { params: Promise<{ refundId: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive()) {
    const allowed = actor?.actorRole === 'finance_admin' || actor?.actorRole === 'platform_admin';
    if (!allowed) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { refundId } = await context.params;

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
