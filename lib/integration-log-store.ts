import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult } from '@/lib/mysql-runtime';

export interface IntegrationLogRecord {
  id: string;
  provider: string;
  action: string;
  requestPayload?: unknown;
  responsePayload?: unknown;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

interface IntegrationLogState {
  logs: IntegrationLogRecord[];
}

function readState(): IntegrationLogState {
  return readStoreFile<IntegrationLogState>('integration-logs', { logs: [] });
}

function writeState(value: IntegrationLogState) {
  writeStoreFile('integration-logs', value);
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

export async function appendIntegrationLog(input: Omit<IntegrationLogRecord, 'id' | 'createdAt'>) {
  const log: IntegrationLogRecord = {
    id: `INT-${randomUUID()}`,
    createdAt: new Date().toISOString(),
    ...input,
  };

  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(
      `INSERT INTO integration_logs
       (id, provider, action, request_payload_json, response_payload_json, status_code, success, error_message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        log.id,
        log.provider,
        log.action,
        log.requestPayload === undefined ? null : JSON.stringify(log.requestPayload),
        log.responsePayload === undefined ? null : JSON.stringify(log.responsePayload),
        log.statusCode ?? null,
        log.success ? 1 : 0,
        log.errorMessage ?? null,
        toMysqlDatetime(log.createdAt),
      ]
    );
    return log;
  }

  const state = readState();
  state.logs.push(log);
  if (state.logs.length > 5000) {
    state.logs = state.logs.slice(state.logs.length - 5000);
  }
  writeState(state);
  return log;
}

export function listIntegrationLogs(filters?: { provider?: string; actionPrefix?: string; success?: boolean; limit?: number }) {
  let rows = readState().logs;
  if (filters?.provider) {
    rows = rows.filter((row) => row.provider === filters.provider);
  }
  const actionPrefix = filters?.actionPrefix;
  if (actionPrefix) {
    rows = rows.filter((row) => row.action.startsWith(actionPrefix));
  }
  if (filters?.success !== undefined) {
    rows = rows.filter((row) => row.success === filters.success);
  }
  rows = rows.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filters?.limit && filters.limit > 0) {
    rows = rows.slice(0, filters.limit);
  }
  return rows;
}
