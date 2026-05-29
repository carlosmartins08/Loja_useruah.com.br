import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export interface ChargebackRecord {
  chargebackId: string;
  eventId: string;
  paymentId: string;
  orderId: string;
  reason?: string;
  createdAt: string;
}

interface ChargebackState {
  byEvent: Record<string, ChargebackRecord>;
}

function readState(): ChargebackState {
  return readStoreFile<ChargebackState>('chargebacks', { byEvent: {} });
}

function writeState(value: ChargebackState) {
  writeStoreFile('chargebacks', value);
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToRecord(row: MysqlRow): ChargebackRecord {
  return {
    chargebackId: String(row.chargeback_id),
    eventId: String(row.event_id),
    paymentId: String(row.payment_id),
    orderId: String(row.order_id),
    reason: row.reason ? String(row.reason) : undefined,
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
  };
}

export async function createChargebackEvent(input: { eventId: string; paymentId: string; orderId: string; reason?: string }) {
  const mysql = await getMysqlPool();
  const now = new Date().toISOString();
  if (mysql && shouldUseMysql()) {
    const [existingRows] = await mysql.execute<MysqlRow[]>(
      `SELECT * FROM chargeback_events WHERE event_id = ? LIMIT 1`,
      [input.eventId]
    );
    if (existingRows[0]) return { created: false, chargeback: rowToRecord(existingRows[0]) };

    const chargeback: ChargebackRecord = {
      chargebackId: `CHB-${randomUUID()}`,
      eventId: input.eventId,
      paymentId: input.paymentId,
      orderId: input.orderId,
      reason: input.reason,
      createdAt: now,
    };
    await mysql.execute<MysqlResult>(
      `INSERT INTO chargeback_events
       (chargeback_id, event_id, payment_id, order_id, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        chargeback.chargebackId,
        chargeback.eventId,
        chargeback.paymentId,
        chargeback.orderId,
        chargeback.reason ?? null,
        toMysqlDatetime(chargeback.createdAt),
      ]
    );
    return { created: true, chargeback };
  }

  const state = readState();
  const existing = state.byEvent[input.eventId];
  if (existing) return { created: false, chargeback: existing };

  const chargeback: ChargebackRecord = {
    chargebackId: `CHB-${randomUUID()}`,
    eventId: input.eventId,
    paymentId: input.paymentId,
    orderId: input.orderId,
    reason: input.reason,
    createdAt: now,
  };
  state.byEvent[input.eventId] = chargeback;
  writeState(state);
  return { created: true, chargeback };
}

export async function listChargebackEvents() {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM chargeback_events ORDER BY created_at DESC`);
    return rows.map(rowToRecord);
  }

  return Object.values(readState().byEvent).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
