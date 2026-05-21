import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export type PayoutStatus = 'requested' | 'approved' | 'paid' | 'rejected';

export interface PayoutRecord {
  payoutId: string;
  ownerId: string;
  ownerRole: 'artist' | 'community_manager';
  amount: number;
  currency: 'BRL';
  status: PayoutStatus;
  commissionIds: string[];
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

interface PayoutState {
  payouts: Record<string, PayoutRecord>;
  byOwner: Record<string, string[]>;
  byIdempotencyKey: Record<string, string>;
}

function readState(): PayoutState {
  return readStoreFile<PayoutState>('payouts', { payouts: {}, byOwner: {}, byIdempotencyKey: {} });
}

function writeState(value: PayoutState) {
  writeStoreFile('payouts', value);
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToPayout(row: MysqlRow): PayoutRecord {
  return {
    payoutId: String(row.payout_id),
    ownerId: String(row.owner_id),
    ownerRole: row.owner_role as 'artist' | 'community_manager',
    amount: Number(row.amount),
    currency: 'BRL',
    status: row.status as PayoutStatus,
    commissionIds: typeof row.commission_ids_json === 'string' ? (JSON.parse(row.commission_ids_json) as string[]) : [],
    idempotencyKey: String(row.idempotency_key),
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: mysqlDatetimeToIso(row.updated_at) ?? new Date().toISOString(),
  };
}

export async function createPayoutRequested(input: {
  ownerId: string;
  ownerRole: 'artist' | 'community_manager';
  amount: number;
  currency: 'BRL';
  commissionIds: string[];
  idempotencyKey: string;
}) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [existingRows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM payouts WHERE idempotency_key = ? LIMIT 1`, [
      input.idempotencyKey,
    ]);
    if (existingRows[0]) {
      return { payout: rowToPayout(existingRows[0]), created: false };
    }

    const now = new Date().toISOString();
    const payout: PayoutRecord = {
      payoutId: `PAYOUT-${randomUUID()}`,
      ownerId: input.ownerId,
      ownerRole: input.ownerRole,
      amount: input.amount,
      currency: input.currency,
      status: 'requested',
      commissionIds: input.commissionIds,
      idempotencyKey: input.idempotencyKey,
      createdAt: now,
      updatedAt: now,
    };

    await mysql.execute<MysqlResult>(
      `INSERT INTO payouts (payout_id, owner_id, owner_role, amount, currency, status, commission_ids_json, idempotency_key, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payout.payoutId,
        payout.ownerId,
        payout.ownerRole,
        payout.amount,
        payout.currency,
        payout.status,
        JSON.stringify(payout.commissionIds),
        payout.idempotencyKey,
        toMysqlDatetime(payout.createdAt),
        toMysqlDatetime(payout.updatedAt),
      ]
    );
    return { payout, created: true };
  }

  const state = readState();
  const existingId = state.byIdempotencyKey[input.idempotencyKey];
  if (existingId) {
    const existing = state.payouts[existingId];
    if (existing) return { payout: existing, created: false };
  }

  const now = new Date().toISOString();
  const payout: PayoutRecord = {
    payoutId: `PAYOUT-${randomUUID()}`,
    ownerId: input.ownerId,
    ownerRole: input.ownerRole,
    amount: input.amount,
    currency: input.currency,
    status: 'requested',
    commissionIds: input.commissionIds,
    idempotencyKey: input.idempotencyKey,
    createdAt: now,
    updatedAt: now,
  };

  state.payouts[payout.payoutId] = payout;
  state.byIdempotencyKey[input.idempotencyKey] = payout.payoutId;
  state.byOwner[input.ownerId] = [...(state.byOwner[input.ownerId] ?? []), payout.payoutId];
  writeState(state);
  return { payout, created: true };
}

export async function listPayoutsByOwner(ownerId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM payouts WHERE owner_id = ? ORDER BY created_at DESC`, [ownerId]);
    return rows.map(rowToPayout);
  }

  const state = readState();
  const ids = state.byOwner[ownerId] ?? [];
  return ids.map((id) => state.payouts[id]).filter((row): row is PayoutRecord => Boolean(row));
}
