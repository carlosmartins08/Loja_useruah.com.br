import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export type SplitRecipientType = 'platform' | 'supplier' | 'artist';

export interface PaymentSplitRecord {
  splitId: string;
  orderId: string;
  orderItemId: string;
  paymentId: string;
  recipientType: SplitRecipientType;
  recipientId: string;
  providerRecipientId?: string;
  grossAmount: number;
  splitAmount: number;
  splitPercentage: number;
  netAmount: number;
  liable: boolean;
  chargeProcessingFee: boolean;
  status: 'pending' | 'available' | 'paid' | 'refunded';
  providerReference: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentSplitState {
  splits: Record<string, PaymentSplitRecord>;
  byPayment: Record<string, string[]>;
}

function readState(): PaymentSplitState {
  return readStoreFile<PaymentSplitState>('payment-splits', { splits: {}, byPayment: {} });
}

function writeState(value: PaymentSplitState) {
  writeStoreFile('payment-splits', value);
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToRecord(row: MysqlRow): PaymentSplitRecord {
  return {
    splitId: String(row.split_id),
    orderId: String(row.order_id),
    orderItemId: String(row.order_item_id),
    paymentId: String(row.payment_id),
    recipientType: row.recipient_type as SplitRecipientType,
    recipientId: String(row.recipient_id),
    providerRecipientId: row.provider_recipient_id ? String(row.provider_recipient_id) : undefined,
    grossAmount: Number(row.gross_amount),
    splitAmount: Number(row.split_amount),
    splitPercentage: Number(row.split_percentage),
    netAmount: Number(row.net_amount),
    liable: Boolean(row.liable),
    chargeProcessingFee: Boolean(row.charge_processing_fee),
    status: row.status as PaymentSplitRecord['status'],
    providerReference: String(row.provider_reference),
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: mysqlDatetimeToIso(row.updated_at) ?? new Date().toISOString(),
  };
}

export async function createPaymentSplits(input: { paymentId: string; rows: Omit<PaymentSplitRecord, 'splitId' | 'createdAt' | 'updatedAt'>[] }) {
  const mysql = await getMysqlPool();
  const now = new Date().toISOString();

  if (mysql && shouldUseMysql()) {
    const [existingRows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM payment_splits WHERE payment_id = ?`, [input.paymentId]);
    if (existingRows.length > 0) {
      return existingRows.map(rowToRecord);
    }

    for (const row of input.rows) {
      await mysql.execute<MysqlResult>(
        `INSERT INTO payment_splits
        (split_id, order_id, order_item_id, payment_id, recipient_type, recipient_id, provider_recipient_id, gross_amount, split_amount, split_percentage, net_amount, liable, charge_processing_fee, status, provider_reference, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `SPL-${randomUUID()}`,
          row.orderId,
          row.orderItemId,
          row.paymentId,
          row.recipientType,
          row.recipientId,
          row.providerRecipientId ?? null,
          row.grossAmount,
          row.splitAmount,
          row.splitPercentage,
          row.netAmount,
          row.liable ? 1 : 0,
          row.chargeProcessingFee ? 1 : 0,
          row.status,
          row.providerReference,
          toMysqlDatetime(now),
          toMysqlDatetime(now),
        ]
      );
    }

    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM payment_splits WHERE payment_id = ? ORDER BY created_at ASC`, [input.paymentId]);
    return rows.map(rowToRecord);
  }

  const state = readState();
  const existingIds = state.byPayment[input.paymentId] ?? [];
  if (existingIds.length > 0) {
    return existingIds.map((id) => state.splits[id]).filter((row): row is PaymentSplitRecord => Boolean(row));
  }

  const ids: string[] = [];
  const records: PaymentSplitRecord[] = [];
  for (const row of input.rows) {
    const splitId = `SPL-${randomUUID()}`;
    const record: PaymentSplitRecord = {
      splitId,
      createdAt: now,
      updatedAt: now,
      ...row,
    };
    state.splits[splitId] = record;
    ids.push(splitId);
    records.push(record);
  }
  state.byPayment[input.paymentId] = ids;
  writeState(state);
  return records;
}

export async function listPaymentSplitsByPaymentId(paymentId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM payment_splits WHERE payment_id = ? ORDER BY created_at ASC`, [paymentId]);
    return rows.map(rowToRecord);
  }

  const state = readState();
  const ids = state.byPayment[paymentId] ?? [];
  return ids.map((id) => state.splits[id]).filter((row): row is PaymentSplitRecord => Boolean(row));
}

export async function updatePaymentSplitsStatusByPaymentId(
  paymentId: string,
  nextStatus: PaymentSplitRecord['status']
) {
  const mysql = await getMysqlPool();
  const now = new Date().toISOString();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(`UPDATE payment_splits SET status = ?, updated_at = ? WHERE payment_id = ?`, [
      nextStatus,
      toMysqlDatetime(now),
      paymentId,
    ]);
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM payment_splits WHERE payment_id = ? ORDER BY created_at ASC`, [paymentId]);
    return rows.map(rowToRecord);
  }

  const state = readState();
  const ids = state.byPayment[paymentId] ?? [];
  const updated = ids
    .map((id) => state.splits[id])
    .filter((row): row is PaymentSplitRecord => Boolean(row))
    .map((row) => {
      const next: PaymentSplitRecord = {
        ...row,
        status: nextStatus,
        updatedAt: now,
      };
      state.splits[row.splitId] = next;
      return next;
    });
  writeState(state);
  return updated;
}
