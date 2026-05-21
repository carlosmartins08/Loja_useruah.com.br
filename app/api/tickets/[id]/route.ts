import { NextResponse } from 'next/server';
import { canReadTicketByCustomerId, getActorFromRequest } from '@/lib/access-control';
import { getTicket } from '@/lib/ticket-store';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  const { id } = await context.params;
  const ticket = await getTicket(id);
  if (!ticket) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (!canReadTicketByCustomerId(ticket.customerId, actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  return NextResponse.json({ ok: true, ticket });
}
