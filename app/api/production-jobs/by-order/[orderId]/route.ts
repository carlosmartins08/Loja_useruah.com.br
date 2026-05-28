import { NextResponse } from 'next/server';
import { getProductionJobByOrderId } from '@/lib/production-store';
import { getOrder } from '@/lib/order-store';
import { getSupplierDispatchByProductionJobId } from '@/lib/supplier-dispatch-store';

export async function GET(_: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params;
  const job = await getProductionJobByOrderId(orderId);
  if (!job) {
    return NextResponse.json({ ok: true, job: null });
  }
  const dispatch = getSupplierDispatchByProductionJobId(job.productionJobId);
  const order = await getOrder(orderId);
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
  return NextResponse.json({ ok: true, job, operationalContext, dispatch });
}
