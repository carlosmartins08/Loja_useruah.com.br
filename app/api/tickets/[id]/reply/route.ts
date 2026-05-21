import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canReadTicketByCustomerId, getActorFromRequest } from '@/lib/access-control';
import { appendTicketReply, getTicket } from '@/lib/ticket-store';

interface ReplyPayload {
  message: string;
}

function isValidReplyPayload(payload: unknown): payload is ReplyPayload {
  if (!payload || typeof payload !== 'object') return false;
  const obj = payload as Record<string, unknown>;
  return typeof obj.message === 'string' && obj.message.trim().length > 0;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  const { id } = await context.params;
  const current = await getTicket(id);
  if (!current) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (!canReadTicketByCustomerId(current.customerId, actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  if (!actor) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!isValidReplyPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const ticket = await appendTicketReply({
    ticketId: id,
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    message: payload.message,
  });
  if (!ticket) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const action = actor.actorRole === 'customer' ? 'ticket.reply_by_customer' : 'ticket.reply_by_support';
  appendAuditLog({
    actor_id: actor.actorId,
    actor_role: actor.actorRole,
    action,
    entity_type: 'Ticket',
    entity_id: ticket.ticketId,
    previous_status: current.status,
    new_status: ticket.status,
    reason: `order:${ticket.orderId}`,
  });

  return NextResponse.json({ ok: true, ticket });
}
