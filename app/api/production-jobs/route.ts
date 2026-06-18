import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import {
  canAccessProductionWorkspace,
  canMutateProductionOrder,
  canReadProductionOrder,
  getActorFromRequest,
} from '@/lib/access-control';
import { getOrder } from '@/lib/order-store';
import { createQueuedProductionJob, listProductionJobs } from '@/lib/production-store';

interface CreateProductionJobPayload {
  orderId: string;
}

function isValidPayload(payload: unknown): payload is CreateProductionJobPayload {
  if (!payload || typeof payload !== 'object') return false;
  const obj = payload as Record<string, unknown>;
  return typeof obj.orderId === 'string' && obj.orderId.trim().length > 0;
}

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!canAccessProductionWorkspace(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const jobs = await listProductionJobs();
  const scopedJobs = (
    await Promise.all(
      jobs.map(async (job) => {
        const order = await getOrder(job.orderId);
        if (!order) return null;
        return canReadProductionOrder(order, actor) ? job : null;
      })
    )
  ).filter((job): job is Awaited<ReturnType<typeof listProductionJobs>>[number] => Boolean(job));

  return NextResponse.json({ ok: true, jobs: scopedJobs });
}

export async function POST(request: Request) {
  const actor = getActorFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!canAccessProductionWorkspace(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const order = await getOrder(payload.orderId);
  if (!order) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (!canMutateProductionOrder(order, actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (order.status !== 'paid') {
    return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });
  }

  const result = await createQueuedProductionJob(order.orderId);
  if (result.created) {
    appendAuditLog({
      actor_id: actor?.actorId ?? 'unknown',
      actor_role: actor?.actorRole ?? 'unknown',
      action: 'production.created',
      entity_type: 'ProductionJob',
      entity_id: result.job.productionJobId,
      previous_status: 'none',
      new_status: result.job.status,
      reason: `order:${order.orderId}`,
    });
  }

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

  return NextResponse.json(
    {
      ok: true,
      job: result.job,
      created: result.created,
      operationalContext,
    },
    { status: result.created ? 201 : 200 }
  );
}
