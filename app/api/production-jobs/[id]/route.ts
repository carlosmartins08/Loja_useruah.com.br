import { NextResponse } from 'next/server';
import { canReadProductionOrder, getActorFromRequest } from '@/lib/access-control';
import { getProductionJobById } from '@/lib/production-store';
import { getOrder } from '@/lib/order-store';
import { getSupplierDispatchByProductionJobId } from '@/lib/supplier-dispatch-store';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const job = await getProductionJobById(id);
  if (!job) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const order = await getOrder(job.orderId);
  if (!order) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (!canReadProductionOrder(order, actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const dispatch = getSupplierDispatchByProductionJobId(job.productionJobId);
  const operationalContext = {
    supplierIds: Array.from(new Set(order.items.map((item) => item.supplierId))),
    shippingAddress: order.items[0]?.shippingAddress ?? null,
    items: order.items.map((item) => ({
      orderItemId: item.orderItemId,
      catalogItemId: item.catalogItemId,
      variantId: item.variantId,
      quantity: item.quantity,
      supplierId: item.supplierId,
    })),
  };
  return NextResponse.json({ ok: true, job, operationalContext, dispatch });
}
