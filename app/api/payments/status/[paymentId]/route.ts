import { NextResponse } from 'next/server';
import { getPayment, listPaymentEvents } from '@/lib/payment-store';
import { canReadOrder, getActorFromRequest } from '@/lib/access-control';
import { getOrder } from '@/lib/order-store';
import { canManageFinancialOperations } from '@/lib/role-matrix/permission-matrix';

export async function GET(request: Request, context: { params: Promise<{ paymentId: string }> }) {
  const actor = getActorFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { paymentId } = await context.params;
  const payment = await getPayment(paymentId);

  if (!payment) {
    return NextResponse.json({ error: 'payment_not_found' }, { status: 404 });
  }

  const order = await getOrder(payment.orderId);
  if (!order) {
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
  }
  const canRead = canReadOrder(order, actor) || canManageFinancialOperations(actor.actorRole);
  if (!canRead) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const events = await listPaymentEvents(paymentId);
  return NextResponse.json({ ok: true, payment, events });
}
