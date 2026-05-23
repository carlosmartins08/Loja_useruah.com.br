import { NextResponse } from 'next/server';
import { canAccessSupportContext, getActorFromRequest } from '@/lib/access-control';
import { buildOrderOperationalView } from '@/lib/order-operational-view';

export async function GET(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const actor = getActorFromRequest(request);
  if (!canAccessSupportContext(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { orderId } = await context.params;
  const view = await buildOrderOperationalView(orderId, { includeTickets: true });
  if (!view) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    order: {
      id: view.order.orderId,
      status: view.order.status,
      customerId: view.order.customerId,
      createdAt: view.order.createdAt,
    },
    payment: view.payment
      ? {
          id: view.payment.paymentId,
          status: view.payment.status,
        }
      : null,
    production: view.production
      ? {
          id: view.production.productionJobId,
          status: view.production.status,
        }
      : null,
    shipment: view.shipment
      ? {
          trackingCode: view.shipment.trackingCode,
          carrier: view.shipment.carrier,
        }
      : null,
    tickets: view.tickets.map((ticket) => ({
      ticketId: ticket.ticketId,
      orderId: ticket.orderId,
      customerId: ticket.customerId,
      subject: ticket.subject,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      messages: ticket.messages,
    })),
    auditSummary: view.auditSummary,
  });
}
