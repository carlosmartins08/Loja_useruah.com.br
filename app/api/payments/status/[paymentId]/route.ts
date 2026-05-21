import { NextResponse } from 'next/server';
import { getPayment, listPaymentEvents } from '@/lib/payment-store';

export async function GET(_: Request, context: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await context.params;
  const payment = await getPayment(paymentId);

  if (!payment) {
    return NextResponse.json({ error: 'payment_not_found' }, { status: 404 });
  }

  const events = await listPaymentEvents(paymentId);
  return NextResponse.json({ ok: true, payment, events });
}
