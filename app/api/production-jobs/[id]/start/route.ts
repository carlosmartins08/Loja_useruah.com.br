import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canOperateProduction, getActorFromRequest } from '@/lib/access-control';
import { getOrder, updateOrderStatus } from '@/lib/order-store';
import { getProductionJobById, updateProductionJobStatus } from '@/lib/production-store';
import { dispatchProductionToSupplier } from '@/lib/supplier-production-dispatch';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (!canOperateProduction(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const job = await getProductionJobById(id);
  if (!job) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (job.status !== 'queued') {
    return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });
  }

  const order = await getOrder(job.orderId);
  if (!order) {
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
  }

  if (order.status !== 'paid') {
    return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });
  }

  const dispatchResult = await dispatchProductionToSupplier({ job, order });
  if (!dispatchResult.ok && dispatchResult.blocking) {
    return NextResponse.json(
      {
        error: 'supplier_dispatch_failed',
        detail: dispatchResult.dispatch.errorMessage ?? 'unknown',
        dispatch: dispatchResult.dispatch,
      },
      { status: 502 }
    );
  }

  const updatedJob = await updateProductionJobStatus(job.productionJobId, 'in_progress');
  if (!updatedJob) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const updatedOrder = await updateOrderStatus(order.orderId, 'in_production');
  if (!updatedOrder) {
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
  }

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'production.started',
    entity_type: 'ProductionJob',
    entity_id: updatedJob.productionJobId,
    previous_status: job.status,
    new_status: updatedJob.status,
    reason: 'manual_start',
  });

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'order.in_production',
    entity_type: 'Order',
    entity_id: updatedOrder.orderId,
    previous_status: order.status,
    new_status: updatedOrder.status,
    reason: 'production_started',
  });

  return NextResponse.json({ ok: true, job: updatedJob, order: updatedOrder, dispatch: dispatchResult.dispatch });
}
