import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export type ProviderRecipientStatus = 'pending' | 'approved' | 'rejected' | 'incomplete';
export type ProviderRecipientEntityType = 'platform' | 'supplier' | 'artist';

export interface ProviderRecipientRecord {
  id: string;
  entityType: ProviderRecipientEntityType;
  entityId: string;
  provider: string;
  providerRecipientId: string;
  status: ProviderRecipientStatus;
  document?: string;
  bankAccountReference?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProviderRecipientState {
  records: Record<string, ProviderRecipientRecord>;
}

function readState(): ProviderRecipientState {
  return readStoreFile<ProviderRecipientState>('provider-recipients', { records: {} });
}

function writeState(value: ProviderRecipientState) {
  writeStoreFile('provider-recipients', value);
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToRecord(row: MysqlRow): ProviderRecipientRecord {
  return {
    id: String(row.id),
    entityType: row.entity_type as ProviderRecipientEntityType,
    entityId: String(row.entity_id),
    provider: String(row.provider),
    providerRecipientId: String(row.provider_recipient_id),
    status: row.status as ProviderRecipientStatus,
    document: row.document ? String(row.document) : undefined,
    bankAccountReference: row.bank_account_reference ? String(row.bank_account_reference) : undefined,
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: mysqlDatetimeToIso(row.updated_at) ?? new Date().toISOString(),
  };
}

export async function getProviderRecipient(input: {
  provider: string;
  entityType: ProviderRecipientEntityType;
  entityId: string;
}) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(
      `SELECT * FROM provider_recipients WHERE provider = ? AND entity_type = ? AND entity_id = ? LIMIT 1`,
      [input.provider, input.entityType, input.entityId]
    );
    return rows[0] ? rowToRecord(rows[0]) : null;
  }

  const state = readState();
  return (
    Object.values(state.records).find(
      (row) => row.provider === input.provider && row.entityType === input.entityType && row.entityId === input.entityId
    ) ?? null
  );
}

export async function upsertProviderRecipient(
  input: Omit<ProviderRecipientRecord, 'id' | 'createdAt' | 'updatedAt'>
) {
  const mysql = await getMysqlPool();
  const now = new Date().toISOString();
  if (mysql && shouldUseMysql()) {
    const existing = await getProviderRecipient({
      provider: input.provider,
      entityType: input.entityType,
      entityId: input.entityId,
    });
    if (existing) {
      await mysql.execute<MysqlResult>(
        `UPDATE provider_recipients
         SET provider_recipient_id = ?, status = ?, document = ?, bank_account_reference = ?, updated_at = ?
         WHERE id = ?`,
        [
          input.providerRecipientId,
          input.status,
          input.document ?? null,
          input.bankAccountReference ?? null,
          toMysqlDatetime(now),
          existing.id,
        ]
      );
      const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM provider_recipients WHERE id = ? LIMIT 1`, [existing.id]);
      return rows[0] ? rowToRecord(rows[0]) : existing;
    }

    const id = `PRC-${randomUUID()}`;
    await mysql.execute<MysqlResult>(
      `INSERT INTO provider_recipients
       (id, entity_type, entity_id, provider, provider_recipient_id, status, document, bank_account_reference, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.entityType,
        input.entityId,
        input.provider,
        input.providerRecipientId,
        input.status,
        input.document ?? null,
        input.bankAccountReference ?? null,
        toMysqlDatetime(now),
        toMysqlDatetime(now),
      ]
    );
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM provider_recipients WHERE id = ? LIMIT 1`, [id]);
    return rows[0] ? rowToRecord(rows[0]) : null;
  }

  const state = readState();
  const existing = Object.values(state.records).find(
    (row) => row.provider === input.provider && row.entityType === input.entityType && row.entityId === input.entityId
  );
  if (existing) {
    const next: ProviderRecipientRecord = {
      ...existing,
      ...input,
      updatedAt: now,
    };
    state.records[next.id] = next;
    writeState(state);
    return next;
  }

  const record: ProviderRecipientRecord = {
    id: `PRC-${randomUUID()}`,
    createdAt: now,
    updatedAt: now,
    ...input,
  };
  state.records[record.id] = record;
  writeState(state);
  return record;
}
