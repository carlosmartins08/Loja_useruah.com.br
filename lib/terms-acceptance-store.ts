import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export type TermType = 'industry_base' | 'artist_base' | 'consumer_base';

export interface TermsAcceptanceRecord {
  acceptanceId: string;
  userId: string;
  entityType: 'industry' | 'artist' | 'consumer';
  entityId: string;
  termType: TermType;
  termVersion: string;
  acceptedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

interface TermsState {
  acceptances: TermsAcceptanceRecord[];
}

function readState(): TermsState {
  return readStoreFile<TermsState>('terms-acceptances', { acceptances: [] });
}

function writeState(value: TermsState) {
  writeStoreFile('terms-acceptances', value);
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToRecord(row: MysqlRow): TermsAcceptanceRecord {
  return {
    acceptanceId: String(row.acceptance_id),
    userId: String(row.user_id),
    entityType: row.entity_type as TermsAcceptanceRecord['entityType'],
    entityId: String(row.entity_id),
    termType: row.term_type as TermType,
    termVersion: String(row.term_version),
    acceptedAt: mysqlDatetimeToIso(row.accepted_at) ?? new Date().toISOString(),
    ipAddress: row.ip_address ? String(row.ip_address) : undefined,
    userAgent: row.user_agent ? String(row.user_agent) : undefined,
  };
}

export async function registerTermsAcceptance(input: Omit<TermsAcceptanceRecord, 'acceptanceId' | 'acceptedAt'>) {
  const acceptance: TermsAcceptanceRecord = {
    acceptanceId: `TERM-${randomUUID()}`,
    acceptedAt: new Date().toISOString(),
    ...input,
  };

  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(
      `INSERT INTO terms_acceptances
      (acceptance_id, user_id, entity_type, entity_id, term_type, term_version, accepted_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        acceptance.acceptanceId,
        acceptance.userId,
        acceptance.entityType,
        acceptance.entityId,
        acceptance.termType,
        acceptance.termVersion,
        toMysqlDatetime(acceptance.acceptedAt),
        acceptance.ipAddress ?? null,
        acceptance.userAgent ?? null,
      ]
    );
    return acceptance;
  }

  const state = readState();
  state.acceptances.push(acceptance);
  writeState(state);
  return acceptance;
}

export async function hasAcceptedTerms(input: {
  userId: string;
  termType: TermType;
  termVersion: string;
}) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(
      `SELECT * FROM terms_acceptances WHERE user_id = ? AND term_type = ? AND term_version = ? ORDER BY accepted_at DESC LIMIT 1`,
      [input.userId, input.termType, input.termVersion]
    );
    return Boolean(rows[0]);
  }

  const state = readState();
  return state.acceptances.some((row) => row.userId === input.userId && row.termType === input.termType && row.termVersion === input.termVersion);
}

export async function listTermsAcceptancesByUser(userId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM terms_acceptances WHERE user_id = ? ORDER BY accepted_at DESC`, [userId]);
    return rows.map(rowToRecord);
  }
  return readState()
    .acceptances.filter((row) => row.userId === userId)
    .sort((a, b) => Date.parse(b.acceptedAt) - Date.parse(a.acceptedAt));
}
