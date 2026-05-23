import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { CheckoutPaymentPayload, PaymentRecord, PaymentStatus } from '@/lib/payments';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

interface PaymentStoreState {
  payments: Record<string, PaymentRecord>;
  idempotency: Record<string, string>;
  events: Record<string, Array<{ event: string; fromStatus: string; toStatus: string; createdAt: string; meta?: string }>>;
}

type SqliteDb = {
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    run: (...args: unknown[]) => void;
    get: (...args: unknown[]) => Record<string, unknown> | undefined;
    all: (...args: unknown[]) => Array<Record<string, unknown>>;
  };
};

let sqliteDb: SqliteDb | null = null;
let sqliteAvailable = true;
let mysqlProviderColumnReady = false;

function shouldUseSqlite() {
  const mode = process.env.PAYMENT_PERSISTENCE?.toLowerCase() ?? 'sqlite';
  return mode === 'sqlite';
}

function getSqliteDb(): SqliteDb | null {
  if (!shouldUseSqlite() || !sqliteAvailable) return null;
  if (sqliteDb) return sqliteDb;

  try {
    const dataDir = join(process.cwd(), '.tmp-store');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    const sqlite = require('node:sqlite') as { DatabaseSync: new (path: string) => SqliteDb };
    const db = new sqlite.DatabaseSync(join(dataDir, 'payments.sqlite'));
    db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        payment_id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        method TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL,
        provider_reference TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        approved_at TEXT
      );
    `);
    try {
      db.exec(`ALTER TABLE payments ADD COLUMN provider TEXT NOT NULL DEFAULT 'sandbox';`);
    } catch {
      // column already exists
    }
    db.exec(`
      CREATE TABLE IF NOT EXISTS payment_idempotency (
        idempotency_key TEXT PRIMARY KEY,
        payment_id TEXT NOT NULL
      );
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS payment_events (
        event_id TEXT PRIMARY KEY,
        payment_id TEXT NOT NULL,
        event_name TEXT NOT NULL,
        from_status TEXT NOT NULL,
        to_status TEXT NOT NULL,
        meta TEXT,
        created_at TEXT NOT NULL
      );
    `);
    sqliteDb = db;
    return sqliteDb;
  } catch {
    sqliteAvailable = false;
    return null;
  }
}

function readState(): PaymentStoreState {
  return readStoreFile<PaymentStoreState>('payments', { payments: {}, idempotency: {}, events: {} });
}

function writeState(value: PaymentStoreState) {
  writeStoreFile('payments', value);
}

function rowToPaymentRecord(row: Record<string, unknown>): PaymentRecord {
  return {
    paymentId: String(row.payment_id),
    orderId: String(row.order_id),
    provider: (row.provider ? String(row.provider) : 'sandbox') as PaymentRecord['provider'],
    method: row.method as PaymentRecord['method'],
    amount: Number(row.amount),
    currency: 'BRL',
    status: row.status as PaymentStatus,
    providerReference: String(row.provider_reference),
    createdAt: String(row.created_at),
    approvedAt: row.approved_at ? String(row.approved_at) : undefined,
  };
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function mysqlRowToPaymentRecord(row: MysqlRow): PaymentRecord {
  return {
    paymentId: String(row.payment_id),
    orderId: String(row.order_id),
    provider: (row.provider ? String(row.provider) : 'sandbox') as PaymentRecord['provider'],
    method: row.method as PaymentRecord['method'],
    amount: Number(row.amount),
    currency: 'BRL',
    status: row.status as PaymentStatus,
    providerReference: String(row.provider_reference),
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    approvedAt: mysqlDatetimeToIso(row.approved_at),
  };
}

export async function createPaymentRecord(input: {
  payload: CheckoutPaymentPayload;
  orderId: string;
  provider: PaymentRecord['provider'];
  providerReference: string;
  status: PaymentStatus;
}): Promise<PaymentRecord> {
  const paymentId = randomUUID();
  const record: PaymentRecord = {
    paymentId,
    orderId: input.orderId,
    provider: input.provider,
    method: input.payload.method,
    amount: input.payload.amount,
    currency: input.payload.currency,
    status: input.status,
    providerReference: input.providerReference,
    createdAt: new Date().toISOString(),
    approvedAt: input.status === 'approved' ? new Date().toISOString() : undefined,
  };

  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    if (!mysqlProviderColumnReady) {
      try {
        await mysql.execute<MysqlResult>(`ALTER TABLE payments ADD COLUMN provider VARCHAR(32) NOT NULL DEFAULT 'sandbox'`);
      } catch {
        // ignore when column already exists
      } finally {
        mysqlProviderColumnReady = true;
      }
    }
    await mysql.execute<MysqlResult>(
      `INSERT INTO payments (payment_id, order_id, provider, method, amount, currency, status, provider_reference, created_at, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.paymentId,
        record.orderId,
        record.provider,
        record.method,
        record.amount,
        record.currency,
        record.status,
        record.providerReference,
        toMysqlDatetime(record.createdAt),
        record.approvedAt ? toMysqlDatetime(record.approvedAt) : null,
      ]
    );
    return record;
  }

  const db = getSqliteDb();
  if (db) {
    db.prepare(
      `INSERT INTO payments (payment_id, order_id, provider, method, amount, currency, status, provider_reference, created_at, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      record.paymentId,
      record.orderId,
      record.provider,
      record.method,
      record.amount,
      record.currency,
      record.status,
      record.providerReference,
      record.createdAt,
      record.approvedAt ?? null
    );
    return record;
  }

  const state = readState();
  state.payments[paymentId] = record;
  writeState(state);
  return record;
}

export async function linkIdempotencyKey(idempotencyKey: string, paymentId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(
      `INSERT INTO payment_idempotency (idempotency_key, payment_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE payment_id = VALUES(payment_id)`,
      [idempotencyKey, paymentId]
    );
    return;
  }

  const db = getSqliteDb();
  if (db) {
    db.prepare(
      `INSERT INTO payment_idempotency (idempotency_key, payment_id)
       VALUES (?, ?)
       ON CONFLICT(idempotency_key) DO UPDATE SET payment_id = excluded.payment_id`
    ).run(idempotencyKey, paymentId);
    return;
  }

  const state = readState();
  state.idempotency[idempotencyKey] = paymentId;
  writeState(state);
}

export async function getPaymentByIdempotencyKey(idempotencyKey: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(
      `SELECT p.*
       FROM payment_idempotency i
       JOIN payments p ON p.payment_id = i.payment_id
       WHERE i.idempotency_key = ?`,
      [idempotencyKey]
    );
    return rows[0] ? mysqlRowToPaymentRecord(rows[0]) : null;
  }

  const db = getSqliteDb();
  if (db) {
    const row = db
      .prepare(
        `SELECT p.*
         FROM payment_idempotency i
         JOIN payments p ON p.payment_id = i.payment_id
         WHERE i.idempotency_key = ?`
      )
      .get(idempotencyKey);
    return row ? rowToPaymentRecord(row) : null;
  }

  const state = readState();
  const paymentId = state.idempotency[idempotencyKey];
  if (!paymentId) return null;
  return state.payments[paymentId] ?? null;
}

export async function updatePaymentStatus(paymentId: string, status: PaymentStatus) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM payments WHERE payment_id = ?`, [paymentId]);
    const current = rows[0];
    if (!current) return null;

    const currentApprovedAt = mysqlDatetimeToIso(current.approved_at);
    const approvedAt = status === 'approved' ? new Date().toISOString() : currentApprovedAt;

    await mysql.execute<MysqlResult>(`UPDATE payments SET status = ?, approved_at = ? WHERE payment_id = ?`, [
      status,
      approvedAt ? toMysqlDatetime(approvedAt) : null,
      paymentId,
    ]);
    const [updatedRows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM payments WHERE payment_id = ?`, [paymentId]);
    return updatedRows[0] ? mysqlRowToPaymentRecord(updatedRows[0]) : null;
  }

  const db = getSqliteDb();
  if (db) {
    const current = db.prepare(`SELECT * FROM payments WHERE payment_id = ?`).get(paymentId);
    if (!current) return null;

    const approvedAt = status === 'approved' ? new Date().toISOString() : (current.approved_at as string | null);
    db.prepare(`UPDATE payments SET status = ?, approved_at = ? WHERE payment_id = ?`).run(status, approvedAt ?? null, paymentId);
    const updated = db.prepare(`SELECT * FROM payments WHERE payment_id = ?`).get(paymentId);
    return updated ? rowToPaymentRecord(updated) : null;
  }

  const state = readState();
  const current = state.payments[paymentId];
  if (!current) return null;

  const updated: PaymentRecord = {
    ...current,
    status,
    approvedAt: status === 'approved' ? new Date().toISOString() : current.approvedAt,
  };

  state.payments[paymentId] = updated;
  writeState(state);
  return updated;
}

export async function getPayment(paymentId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM payments WHERE payment_id = ?`, [paymentId]);
    return rows[0] ? mysqlRowToPaymentRecord(rows[0]) : null;
  }

  const db = getSqliteDb();
  if (db) {
    const row = db.prepare(`SELECT * FROM payments WHERE payment_id = ?`).get(paymentId);
    return row ? rowToPaymentRecord(row) : null;
  }

  const state = readState();
  return state.payments[paymentId] ?? null;
}

export async function findPaymentByProviderReference(providerReference: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM payments WHERE provider_reference = ?`, [providerReference]);
    return rows[0] ? mysqlRowToPaymentRecord(rows[0]) : null;
  }

  const db = getSqliteDb();
  if (db) {
    const row = db.prepare(`SELECT * FROM payments WHERE provider_reference = ?`).get(providerReference);
    return row ? rowToPaymentRecord(row) : null;
  }

  const state = readState();
  for (const payment of Object.values(state.payments)) {
    if (payment.providerReference === providerReference) return payment;
  }
  return null;
}

export async function findPaymentByOrderId(orderId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`, [orderId]);
    return rows[0] ? mysqlRowToPaymentRecord(rows[0]) : null;
  }

  const db = getSqliteDb();
  if (db) {
    const row = db.prepare(`SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`).get(orderId);
    return row ? rowToPaymentRecord(row) : null;
  }

  const state = readState();
  for (const payment of Object.values(state.payments)) {
    if (payment.orderId === orderId) return payment;
  }
  return null;
}

export async function appendPaymentEvent(input: {
  paymentId: string;
  event: string;
  fromStatus: string;
  toStatus: string;
  meta?: string;
}) {
  const createdAt = new Date().toISOString();
  const retentionDays = Number(process.env.PAYMENT_EVENTS_RETENTION_DAYS ?? '45');
  const shouldPrune = Number.isFinite(retentionDays) && retentionDays > 0;

  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(
      `INSERT INTO payment_events (event_id, payment_id, event_name, from_status, to_status, meta, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        input.paymentId,
        input.event,
        input.fromStatus,
        input.toStatus,
        input.meta ? JSON.parse(input.meta) : null,
        toMysqlDatetime(createdAt),
      ]
    );
    if (shouldPrune) {
      await mysql.execute<MysqlResult>(`DELETE FROM payment_events WHERE created_at < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL ? DAY)`, [
        retentionDays,
      ]);
    }
    return;
  }

  const db = getSqliteDb();
  if (db) {
    db.prepare(
      `INSERT INTO payment_events (event_id, payment_id, event_name, from_status, to_status, meta, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(randomUUID(), input.paymentId, input.event, input.fromStatus, input.toStatus, input.meta ?? null, createdAt);
    if (shouldPrune) {
      const cutoffIso = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
      db.prepare(`DELETE FROM payment_events WHERE created_at < ?`).run(cutoffIso);
    }
    return;
  }

  const state = readState();
  const list = state.events[input.paymentId] ?? [];
  list.push({
    event: input.event,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    createdAt,
    meta: input.meta,
  });
  state.events[input.paymentId] = list;
  if (shouldPrune) {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    for (const [paymentId, paymentEvents] of Object.entries(state.events)) {
      state.events[paymentId] = paymentEvents.filter((event) => {
        const ts = Date.parse(event.createdAt);
        return Number.isNaN(ts) || ts >= cutoff;
      });
      if (state.events[paymentId].length === 0) {
        delete state.events[paymentId];
      }
    }
  }
  writeState(state);
}

export async function listPaymentEvents(paymentId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(
      `SELECT event_name, from_status, to_status, meta, created_at
       FROM payment_events
       WHERE payment_id = ?
       ORDER BY created_at ASC`,
      [paymentId]
    );
    return rows.map((row) => ({
      event: String(row.event_name),
      fromStatus: String(row.from_status),
      toStatus: String(row.to_status),
      meta: row.meta ? JSON.stringify(row.meta) : undefined,
      createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    }));
  }

  const db = getSqliteDb();
  if (db) {
    const rows = db
      .prepare(
        `SELECT event_name, from_status, to_status, meta, created_at
         FROM payment_events
         WHERE payment_id = ?
         ORDER BY created_at ASC`
      )
      .all(paymentId) as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      event: String(row.event_name),
      fromStatus: String(row.from_status),
      toStatus: String(row.to_status),
      meta: row.meta ? String(row.meta) : undefined,
      createdAt: String(row.created_at),
    }));
  }

  const state = readState();
  return state.events[paymentId] ?? [];
}
