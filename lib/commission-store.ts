import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';
import { getOrder } from '@/lib/order-store';

export type CommissionStatus = 'pending' | 'available' | 'blocked' | 'paid' | 'reversed';
export type CommissionOwnerRole = 'artist' | 'community_manager';

export interface CommissionRecord {
  commissionId: string;
  orderId: string;
  ownerId: string;
  ownerRole: CommissionOwnerRole;
  amount: number;
  currency: 'BRL';
  status: CommissionStatus;
  sourceKey: string;
  createdAt: string;
  updatedAt: string;
}

interface CommissionState {
  commissions: Record<string, CommissionRecord>;
  byOwner: Record<string, string[]>;
  byOrder: Record<string, string[]>;
  bySourceKey: Record<string, string>;
}

function readState(): CommissionState {
  return readStoreFile<CommissionState>('commissions', {
    commissions: {},
    byOwner: {},
    byOrder: {},
    bySourceKey: {},
  });
}

function writeState(value: CommissionState) {
  writeStoreFile('commissions', value);
}

function pushUnique(list: string[], value: string) {
  return list.includes(value) ? list : [...list, value];
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToCommission(row: MysqlRow): CommissionRecord {
  return {
    commissionId: String(row.commission_id),
    orderId: String(row.order_id),
    ownerId: String(row.owner_id),
    ownerRole: row.owner_role as CommissionOwnerRole,
    amount: Number(row.amount),
    currency: 'BRL',
    status: row.status as CommissionStatus,
    sourceKey: String(row.source_key),
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: mysqlDatetimeToIso(row.updated_at) ?? new Date().toISOString(),
  };
}

export async function createCommissionPending(input: {
  orderId: string;
  ownerId: string;
  ownerRole: CommissionOwnerRole;
  amount: number;
  sourceKey: string;
}) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [existingRows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM commissions WHERE source_key = ? LIMIT 1`, [input.sourceKey]);
    if (existingRows[0]) {
      return { commission: rowToCommission(existingRows[0]), created: false };
    }

    const now = new Date().toISOString();
    const commission: CommissionRecord = {
      commissionId: `COM-${randomUUID()}`,
      orderId: input.orderId,
      ownerId: input.ownerId,
      ownerRole: input.ownerRole,
      amount: input.amount,
      currency: 'BRL',
      status: 'pending',
      sourceKey: input.sourceKey,
      createdAt: now,
      updatedAt: now,
    };

    await mysql.execute<MysqlResult>(
      `INSERT INTO commissions (commission_id, order_id, owner_id, owner_role, amount, currency, status, source_key, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        commission.commissionId,
        commission.orderId,
        commission.ownerId,
        commission.ownerRole,
        commission.amount,
        commission.currency,
        commission.status,
        commission.sourceKey,
        toMysqlDatetime(commission.createdAt),
        toMysqlDatetime(commission.updatedAt),
      ]
    );
    return { commission, created: true };
  }

  const state = readState();
  const existingId = state.bySourceKey[input.sourceKey];
  if (existingId) {
    const existing = state.commissions[existingId];
    if (existing) return { commission: existing, created: false };
  }

  const now = new Date().toISOString();
  const commission: CommissionRecord = {
    commissionId: `COM-${randomUUID()}`,
    orderId: input.orderId,
    ownerId: input.ownerId,
    ownerRole: input.ownerRole,
    amount: input.amount,
    currency: 'BRL',
    status: 'pending',
    sourceKey: input.sourceKey,
    createdAt: now,
    updatedAt: now,
  };

  state.commissions[commission.commissionId] = commission;
  state.bySourceKey[input.sourceKey] = commission.commissionId;
  state.byOwner[input.ownerId] = pushUnique(state.byOwner[input.ownerId] ?? [], commission.commissionId);
  state.byOrder[input.orderId] = pushUnique(state.byOrder[input.orderId] ?? [], commission.commissionId);
  writeState(state);
  return { commission, created: true };
}

export async function listCommissionsByOwner(ownerId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM commissions WHERE owner_id = ? ORDER BY created_at DESC`, [ownerId]);
    return rows.map(rowToCommission);
  }

  const state = readState();
  const ids = state.byOwner[ownerId] ?? [];
  return ids.map((id) => state.commissions[id]).filter((row): row is CommissionRecord => Boolean(row));
}

export async function listCommissionsByOrderId(orderId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM commissions WHERE order_id = ? ORDER BY created_at ASC`, [orderId]);
    return rows.map(rowToCommission);
  }

  const state = readState();
  const ids = state.byOrder[orderId] ?? [];
  return ids.map((id) => state.commissions[id]).filter((row): row is CommissionRecord => Boolean(row));
}

export async function updateCommissionStatus(commissionId: string, status: CommissionStatus) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM commissions WHERE commission_id = ?`, [commissionId]);
    const current = rows[0];
    if (!current) return null;

    const now = new Date().toISOString();
    await mysql.execute<MysqlResult>(`UPDATE commissions SET status = ?, updated_at = ? WHERE commission_id = ?`, [
      status,
      toMysqlDatetime(now),
      commissionId,
    ]);
    const [updatedRows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM commissions WHERE commission_id = ?`, [commissionId]);
    return updatedRows[0] ? rowToCommission(updatedRows[0]) : null;
  }

  const state = readState();
  const current = state.commissions[commissionId];
  if (!current) return null;
  const updated: CommissionRecord = {
    ...current,
    status,
    updatedAt: new Date().toISOString(),
  };
  state.commissions[commissionId] = updated;
  writeState(state);
  return updated;
}

export async function reconcileCommissionAvailabilityForOrder(orderId: string) {
  const order = await getOrder(orderId);
  if (!order || order.status !== 'shipped') return [];

  const rows = await listCommissionsByOrderId(orderId);
  const changed: CommissionRecord[] = [];
  for (const row of rows) {
    if (row.status === 'pending') {
      const updated = await updateCommissionStatus(row.commissionId, 'available');
      if (updated) changed.push(updated);
    }
  }
  return changed;
}

export async function reconcileCommissionAvailabilityForOwner(ownerId: string) {
  const rows = await listCommissionsByOwner(ownerId);
  const changed: CommissionRecord[] = [];
  for (const row of rows) {
    const updates = await reconcileCommissionAvailabilityForOrder(row.orderId);
    if (updates.length > 0) changed.push(...updates);
  }
  return changed;
}
