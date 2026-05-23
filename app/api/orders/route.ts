import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { createPlacedOrder, listOrders } from '@/lib/order-store';
import { isTermsGateEnabledFor, validateTermsAcceptance } from '@/lib/terms-enforcement';
import { findPaymentByOrderId } from '@/lib/payment-store';
import { getProductionJobByOrderId } from '@/lib/production-store';
import { getShipmentByOrderId } from '@/lib/shipment-store';

interface OrderCreatePayload {
  items: Array<{
    catalogItemId: string;
    variantId: string;
    quantity: number;
    unitPrice: number;
  }>;
  customer?: {
    id?: string;
  };
}

function isValidOrderPayload(payload: unknown): payload is OrderCreatePayload {
  if (!payload || typeof payload !== 'object') return false;
  const body = payload as Record<string, unknown>;
  if (!Array.isArray(body.items) || body.items.length === 0) return false;

  return body.items.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const row = item as Record<string, unknown>;
    return (
      typeof row.catalogItemId === 'string' &&
      row.catalogItemId.length > 0 &&
      typeof row.variantId === 'string' &&
      row.variantId.length > 0 &&
      typeof row.quantity === 'number' &&
      row.quantity > 0 &&
      typeof row.unitPrice === 'number' &&
      row.unitPrice > 0
    );
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isValidOrderPayload(body)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const customerId = body.customer?.id ?? 'customer-session';
  if (isTermsGateEnabledFor('consumer')) {
    const accepted = await validateTermsAcceptance({ userId: customerId, termType: 'consumer_base' });
    if (!accepted) {
      return NextResponse.json({ error: 'forbidden', detail: 'terms_not_accepted' }, { status: 403 });
    }
  }

  const order = await createPlacedOrder({
    customerId,
    items: body.items,
  });

  appendAuditLog({
    actor_id: customerId,
    actor_role: 'customer',
    action: 'order.placed',
    entity_type: 'Order',
    entity_id: order.orderId,
    previous_status: 'draft',
    new_status: order.status,
    reason: 'checkout_create_order',
  });

  return NextResponse.json({ ok: true, order }, { status: 201 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId')?.trim();
  const orders = await listOrders(customerId ? { customerId } : undefined);

  const rows = await Promise.all(
    orders.map(async (order) => {
      const [payment, production, shipment] = await Promise.all([
        findPaymentByOrderId(order.orderId),
        getProductionJobByOrderId(order.orderId),
        getShipmentByOrderId(order.orderId),
      ]);

      return {
        ...order,
        paymentStatus: payment?.status ?? null,
        productionStatus: production?.status ?? null,
        shipmentStatus: shipment?.status ?? null,
      };
    })
  );

  return NextResponse.json({ ok: true, orders: rows });
}
