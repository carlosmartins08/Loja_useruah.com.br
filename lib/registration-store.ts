import type { UserRole } from '@/lib/auth-session';
import type { RegistrationStatus } from '@/lib/role-matrix/registration-matrix';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export type RegistrationPersona = 'ALMA' | 'FAROL' | 'SOPRO';

export interface RegistrationRecord {
  registrationId: string;
  userId: string;
  role: UserRole;
  persona: RegistrationPersona;
  status: RegistrationStatus;
  fullName: string;
  email: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface RegistrationState {
  records: Record<string, RegistrationRecord>;
}

function readState(): RegistrationState {
  return readStoreFile<RegistrationState>('registrations', { records: {} });
}

function writeState(value: RegistrationState) {
  writeStoreFile('registrations', value);
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return new Date().toISOString();
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToRegistration(row: MysqlRow): RegistrationRecord {
  let metadata: Record<string, unknown> = {};
  try {
    metadata = typeof row.metadata_json === 'string' ? (JSON.parse(row.metadata_json) as Record<string, unknown>) : (row.metadata_json as Record<string, unknown>) ?? {};
  } catch {
    metadata = {};
  }

  return {
    registrationId: String(row.registration_id),
    userId: String(row.user_id),
    role: row.role as UserRole,
    persona: row.persona as RegistrationPersona,
    status: row.status as RegistrationStatus,
    fullName: String(row.full_name),
    email: String(row.email).toLowerCase(),
    metadata,
    createdAt: mysqlDatetimeToIso(row.created_at),
    updatedAt: mysqlDatetimeToIso(row.updated_at),
  };
}

async function getRegistrationPool() {
  if (!shouldUseMysql()) return null;
  return getMysqlPool();
}

function nowIso() {
  return new Date().toISOString();
}

export async function upsertRegistration(input: Omit<RegistrationRecord, 'registrationId' | 'createdAt' | 'updatedAt'>) {
  const mysql = await getRegistrationPool();
  if (mysql) {
    const timestamp = nowIso();
    await mysql.execute<MysqlResult>(
      `INSERT INTO registrations
        (registration_id, user_id, role, persona, status, full_name, email, metadata_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        role = VALUES(role), persona = VALUES(persona), status = VALUES(status), full_name = VALUES(full_name),
        email = VALUES(email), metadata_json = VALUES(metadata_json), updated_at = VALUES(updated_at)`,
      [
        `reg:${input.userId}`,
        input.userId,
        input.role,
        input.persona,
        input.status,
        input.fullName,
        input.email.toLowerCase(),
        JSON.stringify(input.metadata),
        toMysqlDatetime(timestamp),
        toMysqlDatetime(timestamp),
      ]
    );
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM registrations WHERE user_id = ? LIMIT 1`, [input.userId]);
    if (!rows[0]) throw new Error('registration_persistence_write_failed');
    return rowToRegistration(rows[0]);
  }

  const state = readState();
  const existing = state.records[input.userId];
  const timestamp = nowIso();
  const next: RegistrationRecord = existing
    ? {
        ...existing,
        ...input,
        updatedAt: timestamp,
      }
    : {
        registrationId: `reg:${input.userId}`,
        ...input,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
  state.records[input.userId] = next;
  writeState(state);
  return next;
}

export async function getRegistrationByUserId(userId: string) {
  const mysql = await getRegistrationPool();
  if (mysql) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM registrations WHERE user_id = ? LIMIT 1`, [userId]);
    return rows[0] ? rowToRegistration(rows[0]) : null;
  }

  const state = readState();
  return state.records[userId] ?? null;
}

export async function listRegistrations(input?: {
  status?: RegistrationStatus;
  role?: UserRole;
  limit?: number;
}) {
  const mysql = await getRegistrationPool();
  if (mysql) {
    const conditions: string[] = [];
    const params: string[] = [];
    if (input?.status) {
      conditions.push('status = ?');
      params.push(input.status);
    }
    if (input?.role) {
      conditions.push('role = ?');
      params.push(input.role);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM registrations ${where} ORDER BY updated_at DESC LIMIT ?`, [
      ...params,
      Math.max(1, input?.limit ?? 100),
    ]);
    return rows.map(rowToRegistration);
  }

  const state = readState();
  let rows = Object.values(state.records);
  if (input?.status) {
    rows = rows.filter((row) => row.status === input.status);
  }
  if (input?.role) {
    rows = rows.filter((row) => row.role === input.role);
  }
  rows.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const limit = input?.limit ?? 100;
  return rows.slice(0, Math.max(1, limit));
}

export async function listRegistrationsPage(input?: {
  status?: RegistrationStatus;
  role?: UserRole;
  limit?: number;
  offset?: number;
}) {
  const mysql = await getRegistrationPool();
  if (mysql) {
    const conditions: string[] = [];
    const params: Array<string | number> = [];
    if (input?.status) {
      conditions.push('status = ?');
      params.push(input.status);
    }
    if (input?.role) {
      conditions.push('role = ?');
      params.push(input.role);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [countRows] = await mysql.execute<MysqlRow[]>(`SELECT COUNT(*) AS total FROM registrations ${where}`, params);
    const limit = Math.max(1, input?.limit ?? 100);
    const offset = Math.max(0, input?.offset ?? 0);
    const [rows] = await mysql.execute<MysqlRow[]>(
      `SELECT * FROM registrations ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return {
      total: Number(countRows[0]?.total ?? 0),
      limit,
      offset,
      rows: rows.map(rowToRegistration),
    };
  }

  const state = readState();
  let rows = Object.values(state.records);
  if (input?.status) {
    rows = rows.filter((row) => row.status === input.status);
  }
  if (input?.role) {
    rows = rows.filter((row) => row.role === input.role);
  }
  rows.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const total = rows.length;
  const limit = Math.max(1, input?.limit ?? 100);
  const offset = Math.max(0, input?.offset ?? 0);
  return {
    total,
    limit,
    offset,
    rows: rows.slice(offset, offset + limit),
  };
}

export async function setRegistrationStatus(input: { userId: string; status: RegistrationStatus }) {
  const mysql = await getRegistrationPool();
  if (mysql) {
    const current = await getRegistrationByUserId(input.userId);
    if (!current) return { kind: 'not_found' as const };
    await mysql.execute<MysqlResult>(`UPDATE registrations SET status = ?, updated_at = ? WHERE user_id = ?`, [
      input.status,
      toMysqlDatetime(nowIso()),
      input.userId,
    ]);
    const updated = await getRegistrationByUserId(input.userId);
    if (!updated) return { kind: 'not_found' as const };
    return { kind: 'updated' as const, previous: current, registration: updated };
  }

  const state = readState();
  const current = state.records[input.userId];
  if (!current) return { kind: 'not_found' as const };
  const next: RegistrationRecord = {
    ...current,
    status: input.status,
    updatedAt: nowIso(),
  };
  state.records[input.userId] = next;
  writeState(state);
  return { kind: 'updated' as const, previous: current, registration: next };
}

export async function patchRegistrationMetadata(input: { userId: string; patch: Record<string, unknown> }) {
  const mysql = await getRegistrationPool();
  if (mysql) {
    const current = await getRegistrationByUserId(input.userId);
    if (!current) return { kind: 'not_found' as const };
    const metadata = { ...current.metadata, ...input.patch };
    await mysql.execute<MysqlResult>(`UPDATE registrations SET metadata_json = ?, updated_at = ? WHERE user_id = ?`, [
      JSON.stringify(metadata),
      toMysqlDatetime(nowIso()),
      input.userId,
    ]);
    const updated = await getRegistrationByUserId(input.userId);
    if (!updated) return { kind: 'not_found' as const };
    return { kind: 'updated' as const, previous: current, registration: updated };
  }

  const state = readState();
  const current = state.records[input.userId];
  if (!current) return { kind: 'not_found' as const };
  const next: RegistrationRecord = {
    ...current,
    metadata: {
      ...current.metadata,
      ...input.patch,
    },
    updatedAt: nowIso(),
  };
  state.records[input.userId] = next;
  writeState(state);
  return { kind: 'updated' as const, previous: current, registration: next };
}
