import { NextResponse } from 'next/server';
import { getProductionJobById } from '@/lib/production-store';
import { getOrder } from '@/lib/order-store';

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = await getProductionJobById(id);
  if (!job) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const order = await getOrder(job.orderId);
  const operationalContext = order
    ? {
        supplierIds: Array.from(new Set(order.items.map((item) => item.supplierId))),
        shippingAddress: order.items[0]?.shippingAddress ?? null,
        items: order.items.map((item) => ({
          orderItemId: item.orderItemId,
          catalogItemId: item.catalogItemId,
          variantId: item.variantId,
          quantity: item.quantity,
          supplierId: item.supplierId,
        })),
      }
    : null;
  return NextResponse.json({ ok: true, job, operationalContext });
}
