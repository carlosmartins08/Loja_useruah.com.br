import type { UserRole } from '@/lib/auth-session';
import type { RegistrationStatus } from '@/lib/role-matrix/registration-matrix';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';

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

function nowIso() {
  return new Date().toISOString();
}

export async function upsertRegistration(input: Omit<RegistrationRecord, 'registrationId' | 'createdAt' | 'updatedAt'>) {
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
  const state = readState();
  return state.records[userId] ?? null;
}

export async function listRegistrations(input?: {
  status?: RegistrationStatus;
  role?: UserRole;
  limit?: number;
}) {
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
