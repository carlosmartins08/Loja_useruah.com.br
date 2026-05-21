import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';

export interface AuditLogRecord {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  previous_status?: string;
  new_status?: string;
  reason?: string;
  created_at: string;
}

function readLogs() {
  return readStoreFile<AuditLogRecord[]>('audit-logs', []);
}

function writeLogs(value: AuditLogRecord[]) {
  writeStoreFile('audit-logs', value);
}

export function appendAuditLog(input: Omit<AuditLogRecord, 'id' | 'created_at'>) {
  const record: AuditLogRecord = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    ...input,
  };

  const logs = readLogs();
  logs.push(record);
  writeLogs(logs);
  return record;
}

export function listAuditLogs() {
  return readLogs();
}
