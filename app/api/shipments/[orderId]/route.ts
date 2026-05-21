import { NextResponse } from 'next/server';
import { getShipmentByOrderId } from '@/lib/shipment-store';
import { canReadOrder, getActorFromRequest } from '@/lib/access-control';
import { getOrder } from '@/lib/order-store';

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

  const shipment = await getShipmentByOrderId(orderId);
  if (!shipment) {
    return NextResponse.json({ ok: true, orderId, shipment: null });
  }
  return NextResponse.json({
    ok: true,
    orderId,
    trackingCode: shipment.trackingCode,
    carrier: shipment.carrier,
    createdAt: shipment.createdAt,
    shipment,
  });
}
