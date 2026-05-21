import { NextResponse } from 'next/server';
import { canAccessSupportContext, getActorFromRequest } from '@/lib/access-control';
import { listAuditLogs } from '@/lib/audit-log-store';
import { getOrder } from '@/lib/order-store';
import { findPaymentByOrderId } from '@/lib/payment-store';
import { getProductionJobByOrderId } from '@/lib/production-store';
import { getShipmentByOrderId } from '@/lib/shipment-store';
import { listTicketsByOrderId } from '@/lib/ticket-store';

export async function GET(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const actor = getActorFromRequest(request);
  if (!canAccessSupportContext(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { orderId } = await context.params;
  const order = await getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const payment = await findPaymentByOrderId(orderId);
  const production = await getProductionJobByOrderId(orderId);
  const shipment = await getShipmentByOrderId(orderId);
  const tickets = await listTicketsByOrderId(orderId);
  const relatedIds = new Set<string>([
    order.orderId,
    payment?.paymentId ?? '',
    production?.productionJobId ?? '',
    shipment?.shipmentId ?? '',
  ]);
  const auditSummary = listAuditLogs()
    .filter((entry) => relatedIds.has(entry.entity_id))
    .filter(
      (entry) =>
        entry.entity_type === 'Order' ||
        entry.entity_type === 'Payment' ||
        entry.entity_type === 'ProductionJob' ||
        entry.entity_type === 'Shipment'
    )
    .map((entry) => ({
      action: entry.action,
      createdAt: entry.created_at,
    }));

  return NextResponse.json({
    ok: true,
    order: {
      id: order.orderId,
      status: order.status,
      customerId: order.customerId,
      createdAt: order.createdAt,
    },
    payment: payment
      ? {
          id: payment.paymentId,
          status: payment.status,
        }
      : null,
    production: production
      ? {
          id: production.productionJobId,
          status: production.status,
        }
      : null,
    shipment: shipment
      ? {
          trackingCode: shipment.trackingCode,
          carrier: shipment.carrier,
        }
      : null,
    tickets: tickets.map((ticket) => ({
      ticketId: ticket.ticketId,
      orderId: ticket.orderId,
      customerId: ticket.customerId,
      subject: ticket.subject,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      messages: ticket.messages,
    })),
    auditSummary,
  });
}
