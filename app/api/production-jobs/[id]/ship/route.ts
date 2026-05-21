import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canOperateProduction, getActorFromRequest } from '@/lib/access-control';
import { reconcileCommissionAvailabilityForOrder } from '@/lib/commission-store';
import { getOrder, updateOrderStatus } from '@/lib/order-store';
import { getProductionJobById, updateProductionJobStatus } from '@/lib/production-store';
import { createOrGetShipment } from '@/lib/shipment-store';

interface ShipPayload {
  trackingCode: string;
  carrier: string;
}

function isValidPayload(payload: unknown): payload is ShipPayload {
  if (!payload || typeof payload !== 'object') return false;
  const obj = payload as Record<string, unknown>;
  return (
    typeof obj.trackingCode === 'string' &&
    obj.trackingCode.trim().length > 0 &&
    typeof obj.carrier === 'string' &&
    obj.carrier.trim().length > 0
  );
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (!canOperateProduction(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const job = await getProductionJobById(id);
  if (!job) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (job.status === 'shipped') {
    const shipment = (
      await createOrGetShipment({
      orderId: job.orderId,
      trackingCode: payload.trackingCode,
      carrier: payload.carrier,
      })
    ).shipment;
    return NextResponse.json({ ok: true, status: 'already_shipped', job, shipment });
  }

  if (job.status !== 'in_progress') {
    return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });
  }

  const order = await getOrder(job.orderId);
  if (!order) {
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
  }

  if (order.status !== 'in_production' && order.status !== 'paid') {
    return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });
  }

  const updatedJob = await updateProductionJobStatus(job.productionJobId, 'shipped');
  if (!updatedJob) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const updatedOrder = await updateOrderStatus(order.orderId, 'shipped');
  if (!updatedOrder) {
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
  }

  const shipmentResult = await createOrGetShipment({
    orderId: order.orderId,
    trackingCode: payload.trackingCode,
    carrier: payload.carrier,
  });

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'production.shipped',
    entity_type: 'ProductionJob',
    entity_id: updatedJob.productionJobId,
    previous_status: job.status,
    new_status: updatedJob.status,
    reason: 'manual_ship',
  });

  if (shipmentResult.created) {
    appendAuditLog({
      actor_id: actor?.actorId ?? 'unknown',
      actor_role: actor?.actorRole ?? 'unknown',
      action: 'shipment.created',
      entity_type: 'Shipment',
      entity_id: shipmentResult.shipment.shipmentId,
      previous_status: 'none',
      new_status: shipmentResult.shipment.status,
      reason: 'production_shipped',
    });
  }

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'order.shipped',
    entity_type: 'Order',
    entity_id: updatedOrder.orderId,
    previous_status: order.status,
    new_status: updatedOrder.status,
    reason: 'production_shipped',
  });

  const nowAvailable = await reconcileCommissionAvailabilityForOrder(updatedOrder.orderId);
  for (const row of nowAvailable) {
    appendAuditLog({
      actor_id: 'system',
      actor_role: 'backend',
      action: 'commission.available',
      entity_type: 'Commission',
      entity_id: row.commissionId,
      previous_status: 'pending',
      new_status: row.status,
      reason: `order:${updatedOrder.orderId}`,
    });
  }

  return NextResponse.json({
    ok: true,
    job: updatedJob,
    shipment: shipmentResult.shipment,
    order: updatedOrder,
  });
}
