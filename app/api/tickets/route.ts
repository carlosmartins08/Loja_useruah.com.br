import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canReadTicketByCustomerId, getActorFromRequest } from '@/lib/access-control';
import { getOrder } from '@/lib/order-store';
import { createTicket, listTickets, listTicketsByOrderId } from '@/lib/ticket-store';

interface CreateTicketPayload {
  orderId: string;
  subject: string;
  message: string;
}

function isValidCreatePayload(payload: unknown): payload is CreateTicketPayload {
  if (!payload || typeof payload !== 'object') return false;
  const obj = payload as Record<string, unknown>;
  return (
    typeof obj.orderId === 'string' &&
    obj.orderId.trim().length > 0 &&
    typeof obj.subject === 'string' &&
    obj.subject.trim().length > 0 &&
    typeof obj.message === 'string' &&
    obj.message.trim().length > 0
  );
}

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  const source = orderId ? await listTicketsByOrderId(orderId) : await listTickets();
  const allowed = source.filter((ticket) => canReadTicketByCustomerId(ticket.customerId, actor));

  return NextResponse.json({ ok: true, tickets: allowed });
}

export async function POST(request: Request) {
  const actor = getActorFromRequest(request);
  if (!actor || actor.actorRole !== 'customer') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!isValidCreatePayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const order = await getOrder(payload.orderId);
  if (!order) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (order.customerId !== actor.actorId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const ticket = await createTicket({
    orderId: order.orderId,
    customerId: order.customerId,
    subject: payload.subject,
    message: payload.message,
    actorId: actor.actorId,
    actorRole: actor.actorRole,
  });

  appendAuditLog({
    actor_id: actor.actorId,
    actor_role: actor.actorRole,
    action: 'ticket.created',
    entity_type: 'Ticket',
    entity_id: ticket.ticketId,
    previous_status: 'none',
    new_status: ticket.status,
    reason: `order:${order.orderId}`,
  });

  return NextResponse.json({ ok: true, ticket }, { status: 201 });
}
