import { NextResponse } from 'next/server';
import { canReadOrder, getActorFromRequest } from '@/lib/access-control';
import { buildOrderOperationalView } from '@/lib/order-operational-view';

export async function GET(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params;
  const view = await buildOrderOperationalView(orderId);
  if (!view) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const actor = getActorFromRequest(request);
  if (!canReadOrder(view.order, actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    orderId: view.order.orderId,
    status: view.order.status,
    paymentStatus: view.payment?.status ?? null,
    productionStatus: view.production?.status ?? null,
    items: view.order.items.map((item) => ({
      orderItemId: item.orderItemId,
      catalogItemId: item.catalogItemId,
      productName: item.productName,
      productImage: item.productImage,
      variantId: item.variantId,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      priceCompositionVersion: item.priceCompositionVersion ?? null,
      movementMarkup: item.movementMarkup ?? null,
      snapshotVersion: item.snapshotVersion,
    })),
    shipment: view.shipment
      ? {
          trackingCode: view.shipment.trackingCode,
          carrier: view.shipment.carrier,
          status: view.shipment.status === 'created' ? 'shipped' : view.shipment.status,
        }
      : null,
    timeline: view.timeline,
  });
}
