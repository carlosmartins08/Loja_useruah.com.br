import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';

export type ElevationRiskLevel = 'low' | 'medium' | 'high';
export type ElevationStatus = 'requested' | 'approved' | 'rejected' | 'expired' | 'used';

export interface PrivilegeElevationRecord {
  id: string;
  actorId: string;
  primaryRole: string;
  elevatedRole: string;
  action: string;
  entityType: string;
  entityId: string;
  riskLevel: ElevationRiskLevel;
  reason: string;
  scope: string;
  status: ElevationStatus;
  approvedBy?: string;
  approvedAt?: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
}

interface ElevationStoreState {
  records: Record<string, PrivilegeElevationRecord>;
}

function readState() {
  return readStoreFile<ElevationStoreState>('privilege-elevations', { records: {} });
}

function writeState(value: ElevationStoreState) {
  writeStoreFile('privilege-elevations', value);
}

export function createPrivilegeElevation(input: {
  actorId: string;
  primaryRole: string;
  elevatedRole: string;
  action: string;
  entityType: string;
  entityId: string;
  riskLevel: ElevationRiskLevel;
  reason: string;
  scope: string;
  expiresAt: string;
}) {
  const now = new Date().toISOString();
  const next: PrivilegeElevationRecord = {
    id: `ELV-${randomUUID()}`,
    actorId: input.actorId,
    primaryRole: input.primaryRole,
    elevatedRole: input.elevatedRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    riskLevel: input.riskLevel,
    reason: input.reason,
    scope: input.scope,
    status: input.riskLevel === 'high' ? 'requested' : 'approved',
    approvedBy: input.riskLevel === 'high' ? undefined : input.actorId,
    approvedAt: input.riskLevel === 'high' ? undefined : now,
    expiresAt: input.expiresAt,
    createdAt: now,
  };
  const state = readState();
  state.records[next.id] = next;
  writeState(state);
  return next;
}

export function getPrivilegeElevation(id: string) {
  return readState().records[id] ?? null;
}

export function expireStalePrivilegeElevations() {
  const state = readState();
  const now = Date.now();
  let changed = 0;
  Object.keys(state.records).forEach((id) => {
    const row = state.records[id];
    if ((row.status === 'requested' || row.status === 'approved') && new Date(row.expiresAt).getTime() <= now) {
      state.records[id] = { ...row, status: 'expired' };
      changed += 1;
    }
  });
  if (changed > 0) writeState(state);
  return changed;
}

export function approvePrivilegeElevation(id: string, approver: { actorId: string }) {
  const state = readState();
  const current = state.records[id];
  if (!current) return { kind: 'not_found' as const };
  if (current.status !== 'requested') return { kind: 'invalid_transition' as const, current };
  const now = new Date().toISOString();
  const next: PrivilegeElevationRecord = {
    ...current,
    status: 'approved',
    approvedBy: approver.actorId,
    approvedAt: now,
  };
  state.records[id] = next;
  writeState(state);
  return { kind: 'approved' as const, elevation: next };
}

export function rejectPrivilegeElevation(id: string, approver: { actorId: string }) {
  const state = readState();
  const current = state.records[id];
  if (!current) return { kind: 'not_found' as const };
  if (current.status !== 'requested') return { kind: 'invalid_transition' as const, current };
  const next: PrivilegeElevationRecord = {
    ...current,
    status: 'rejected',
    approvedBy: approver.actorId,
    approvedAt: new Date().toISOString(),
  };
  state.records[id] = next;
  writeState(state);
  return { kind: 'rejected' as const, elevation: next };
}

export function markPrivilegeElevationUsed(id: string) {
  const state = readState();
  const current = state.records[id];
  if (!current) return null;
  const next: PrivilegeElevationRecord = {
    ...current,
    status: 'used',
    usedAt: new Date().toISOString(),
  };
  state.records[id] = next;
  writeState(state);
  return next;
}

export function listPrivilegeElevationsByActor(actorId: string) {
  return Object.values(readState().records)
    .filter((row) => row.actorId === actorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listPrivilegeElevations(filter?: { status?: ElevationStatus }) {
  const rows = Object.values(readState().records);
  const filtered = filter?.status ? rows.filter((row) => row.status === filter.status) : rows;
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
