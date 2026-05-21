import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export type TicketStatus = 'open' | 'in_progress' | 'resolved';

export interface TicketMessageRecord {
  id: string;
  actorId: string;
  actorRole: string;
  message: string;
  createdAt: string;
}

export interface TicketRecord {
  ticketId: string;
  orderId: string;
  customerId: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessageRecord[];
}

interface TicketState {
  tickets: Record<string, TicketRecord>;
  byOrder: Record<string, string[]>;
}

function readState(): TicketState {
  return readStoreFile<TicketState>('tickets', { tickets: {}, byOrder: {} });
}

function writeState(value: TicketState) {
  writeStoreFile('tickets', value);
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToTicket(row: MysqlRow): TicketRecord {
  return {
    ticketId: String(row.ticket_id),
    orderId: String(row.order_id),
    customerId: String(row.customer_id),
    subject: String(row.subject),
    status: row.status as TicketStatus,
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: mysqlDatetimeToIso(row.updated_at) ?? new Date().toISOString(),
    messages: typeof row.messages_json === 'string' ? (JSON.parse(row.messages_json) as TicketMessageRecord[]) : [],
  };
}

export async function createTicket(input: {
  orderId: string;
  customerId: string;
  subject: string;
  message: string;
  actorId: string;
  actorRole: string;
}) {
  const now = new Date().toISOString();
  const ticketId = `TCK-${randomUUID()}`;
  const firstMessage: TicketMessageRecord = {
    id: randomUUID(),
    actorId: input.actorId,
    actorRole: input.actorRole,
    message: input.message,
    createdAt: now,
  };

  const ticket: TicketRecord = {
    ticketId,
    orderId: input.orderId,
    customerId: input.customerId,
    subject: input.subject,
    status: 'open',
    createdAt: now,
    updatedAt: now,
    messages: [firstMessage],
  };

  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(
      `INSERT INTO tickets (ticket_id, order_id, customer_id, subject, status, created_at, updated_at, messages_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticket.ticketId,
        ticket.orderId,
        ticket.customerId,
        ticket.subject,
        ticket.status,
        toMysqlDatetime(ticket.createdAt),
        toMysqlDatetime(ticket.updatedAt),
        JSON.stringify(ticket.messages),
      ]
    );
    return ticket;
  }

  const state = readState();
  state.tickets[ticketId] = ticket;
  state.byOrder[input.orderId] = [...(state.byOrder[input.orderId] ?? []), ticketId];
  writeState(state);
  return ticket;
}

export async function getTicket(ticketId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM tickets WHERE ticket_id = ?`, [ticketId]);
    return rows[0] ? rowToTicket(rows[0]) : null;
  }

  const state = readState();
  return state.tickets[ticketId] ?? null;
}

export async function listTickets() {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM tickets ORDER BY created_at DESC`);
    return rows.map(rowToTicket);
  }

  const state = readState();
  return Object.values(state.tickets);
}

export async function listTicketsByOrderId(orderId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM tickets WHERE order_id = ? ORDER BY created_at ASC`, [orderId]);
    return rows.map(rowToTicket);
  }

  const state = readState();
  const ids = state.byOrder[orderId] ?? [];
  return ids.map((id) => state.tickets[id]).filter((ticket): ticket is TicketRecord => Boolean(ticket));
}

export async function appendTicketReply(input: {
  ticketId: string;
  actorId: string;
  actorRole: string;
  message: string;
}) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM tickets WHERE ticket_id = ?`, [input.ticketId]);
    const currentRow = rows[0];
    if (!currentRow) return null;

    const current = rowToTicket(currentRow);
    const nextStatus: TicketStatus =
      current.status === 'open' && (input.actorRole === 'support_agent' || input.actorRole === 'platform_admin')
        ? 'in_progress'
        : current.status;

    const now = new Date().toISOString();
    const updated: TicketRecord = {
      ...current,
      status: nextStatus,
      updatedAt: now,
      messages: [
        ...current.messages,
        {
          id: randomUUID(),
          actorId: input.actorId,
          actorRole: input.actorRole,
          message: input.message,
          createdAt: now,
        },
      ],
    };

    await mysql.execute<MysqlResult>(`UPDATE tickets SET status = ?, updated_at = ?, messages_json = ? WHERE ticket_id = ?`, [
      updated.status,
      toMysqlDatetime(updated.updatedAt),
      JSON.stringify(updated.messages),
      updated.ticketId,
    ]);
    return updated;
  }

  const state = readState();
  const current = state.tickets[input.ticketId];
  if (!current) return null;

  const nextStatus: TicketStatus =
    current.status === 'open' && (input.actorRole === 'support_agent' || input.actorRole === 'platform_admin')
      ? 'in_progress'
      : current.status;

  const updated: TicketRecord = {
    ...current,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
    messages: [
      ...current.messages,
      {
        id: randomUUID(),
        actorId: input.actorId,
        actorRole: input.actorRole,
        message: input.message,
        createdAt: new Date().toISOString(),
      },
    ],
  };

  state.tickets[input.ticketId] = updated;
  writeState(state);
  return updated;
}
