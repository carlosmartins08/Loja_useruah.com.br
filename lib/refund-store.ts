import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export type RefundStatus = 'requested' | 'approved' | 'rejected';

export interface RefundRecord {
  refundId: string;
  orderId: string;
  paymentId: string;
  status: RefundStatus;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  rejectedBy?: string;
  createdAt: string;
  updatedAt: string;
  idempotencyKey: string;
}

interface RefundState {
  refunds: Record<string, RefundRecord>;
  byIdempotency: Record<string, string>;
}

function readState(): RefundState {
  return readStoreFile<RefundState>('refunds', { refunds: {}, byIdempotency: {} });
}

function writeState(value: RefundState) {
  writeStoreFile('refunds', value);
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToRecord(row: MysqlRow): RefundRecord {
  return {
    refundId: String(row.refund_id),
    orderId: String(row.order_id),
    paymentId: String(row.payment_id),
    status: row.status as RefundStatus,
    reason: String(row.reason),
    requestedBy: String(row.requested_by),
    approvedBy: row.approved_by ? String(row.approved_by) : undefined,
    rejectedBy: row.rejected_by ? String(row.rejected_by) : undefined,
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: mysqlDatetimeToIso(row.updated_at) ?? new Date().toISOString(),
    idempotencyKey: String(row.idempotency_key),
  };
}

export async function createRefundRequested(input: {
  orderId: string;
  paymentId: string;
  reason: string;
  requestedBy: string;
  idempotencyKey: string;
}) {
  const mysql = await getMysqlPool();
  const now = new Date().toISOString();
  if (mysql && shouldUseMysql()) {
    const [existingRows] = await mysql.execute<MysqlRow[]>(
      `SELECT * FROM refunds WHERE idempotency_key = ? LIMIT 1`,
      [input.idempotencyKey]
    );
    if (existingRows[0]) return { created: false, refund: rowToRecord(existingRows[0]) };

    const refund: RefundRecord = {
      refundId: `RFD-${randomUUID()}`,
      orderId: input.orderId,
      paymentId: input.paymentId,
      status: 'requested',
      reason: input.reason,
      requestedBy: input.requestedBy,
      createdAt: now,
      updatedAt: now,
      idempotencyKey: input.idempotencyKey,
    };
    await mysql.execute<MysqlResult>(
      `INSERT INTO refunds
       (refund_id, order_id, payment_id, status, reason, requested_by, approved_by, rejected_by, created_at, updated_at, idempotency_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        refund.refundId,
        refund.orderId,
        refund.paymentId,
        refund.status,
        refund.reason,
        refund.requestedBy,
        null,
        null,
        toMysqlDatetime(refund.createdAt),
        toMysqlDatetime(refund.updatedAt),
        refund.idempotencyKey,
      ]
    );
    return { created: true, refund };
  }

  const state = readState();
  const existingId = state.byIdempotency[input.idempotencyKey];
  if (existingId && state.refunds[existingId]) {
    return { created: false, refund: state.refunds[existingId] };
  }

  const refund: RefundRecord = {
    refundId: `RFD-${randomUUID()}`,
    orderId: input.orderId,
    paymentId: input.paymentId,
    status: 'requested',
    reason: input.reason,
    requestedBy: input.requestedBy,
    createdAt: now,
    updatedAt: now,
    idempotencyKey: input.idempotencyKey,
  };
  state.refunds[refund.refundId] = refund;
  state.byIdempotency[input.idempotencyKey] = refund.refundId;
  writeState(state);
  return { created: true, refund };
}

export async function getRefund(refundId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM refunds WHERE refund_id = ? LIMIT 1`, [refundId]);
    return rows[0] ? rowToRecord(rows[0]) : null;
  }

  const state = readState();
  return state.refunds[refundId] ?? null;
}

export async function listRefunds() {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM refunds ORDER BY created_at DESC`);
    return rows.map(rowToRecord);
  }

  return Object.values(readState().refunds).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateRefundStatus(
  refundId: string,
  input: { status: RefundStatus; approvedBy?: string; rejectedBy?: string }
) {
  const mysql = await getMysqlPool();
  const now = new Date().toISOString();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(
      `UPDATE refunds
       SET status = ?, approved_by = ?, rejected_by = ?, updated_at = ?
       WHERE refund_id = ?`,
      [
        input.status,
        input.approvedBy ?? null,
        input.rejectedBy ?? null,
        toMysqlDatetime(now),
        refundId,
      ]
    );
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM refunds WHERE refund_id = ? LIMIT 1`, [refundId]);
    return rows[0] ? rowToRecord(rows[0]) : null;
  }

  const state = readState();
  const current = state.refunds[refundId];
  if (!current) return null;
  const next: RefundRecord = {
    ...current,
    status: input.status,
    approvedBy: input.approvedBy ?? current.approvedBy,
    rejectedBy: input.rejectedBy ?? current.rejectedBy,
    updatedAt: now,
  };
  state.refunds[refundId] = next;
  writeState(state);
  return next;
}
