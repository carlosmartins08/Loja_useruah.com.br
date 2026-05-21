import { NextResponse } from 'next/server';
import { getOrder } from '@/lib/order-store';
import { findPaymentByOrderId } from '@/lib/payment-store';
import { getProductionJobByOrderId } from '@/lib/production-store';
import { getShipmentByOrderId } from '@/lib/shipment-store';
import { listAuditLogs } from '@/lib/audit-log-store';
import { canReadOrder, getActorFromRequest } from '@/lib/access-control';

export async function GET(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params;
  const order = await getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const actor = getActorFromRequest(request);
  if (!canReadOrder(order, actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payment = await findPaymentByOrderId(orderId);
  const production = await getProductionJobByOrderId(orderId);
  const shipment = await getShipmentByOrderId(orderId);
  const timeline = listAuditLogs()
    .filter((entry) => entry.entity_id === orderId || entry.reason === 'order.paid')
    .filter((entry) => entry.entity_type === 'Order' || entry.action.startsWith('order.'))
    .map((entry) => ({
      event: entry.action,
      createdAt: entry.created_at,
    }));

  return NextResponse.json({
    ok: true,
    orderId: order.orderId,
    status: order.status,
    paymentStatus: payment?.status ?? null,
    productionStatus: production?.status ?? null,
    shipment: shipment
      ? {
          trackingCode: shipment.trackingCode,
          carrier: shipment.carrier,
          status: shipment.status === 'created' ? 'shipped' : shipment.status,
        }
      : null,
    timeline,
  });
}
