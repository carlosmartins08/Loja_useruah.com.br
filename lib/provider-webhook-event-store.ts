import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export interface ProviderWebhookEventRecord {
  id: string;
  provider: string;
  eventType: string;
  providerEventId: string;
  providerReference?: string;
  payload: unknown;
  processed: boolean;
  processedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProviderWebhookEventState {
  byProviderEventId: Record<string, ProviderWebhookEventRecord>;
}

function readState(): ProviderWebhookEventState {
  return readStoreFile<ProviderWebhookEventState>('provider-webhook-events', { byProviderEventId: {} });
}

function writeState(value: ProviderWebhookEventState) {
  writeStoreFile('provider-webhook-events', value);
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToRecord(row: MysqlRow): ProviderWebhookEventRecord {
  return {
    id: String(row.id),
    provider: String(row.provider),
    eventType: String(row.event_type),
    providerEventId: String(row.provider_event_id),
    providerReference: row.provider_reference ? String(row.provider_reference) : undefined,
    payload: row.payload_json,
    processed: Boolean(row.processed),
    processedAt: mysqlDatetimeToIso(row.processed_at),
    errorMessage: row.error_message ? String(row.error_message) : undefined,
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: mysqlDatetimeToIso(row.updated_at) ?? new Date().toISOString(),
  };
}

function key(provider: string, providerEventId: string) {
  return `${provider}:${providerEventId}`;
}

function isMysqlDuplicateEntry(error: unknown) {
  return Boolean(error && typeof error === 'object' && (error as { code?: string }).code === 'ER_DUP_ENTRY');
}

export async function registerProviderWebhookEvent(input: {
  provider: string;
  eventType: string;
  providerEventId: string;
  providerReference?: string;
  payload: unknown;
}) {
  const mysql = await getMysqlPool();
  const now = new Date().toISOString();
  if (mysql && shouldUseMysql()) {
    const [existingRows] = await mysql.execute<MysqlRow[]>(
      `SELECT * FROM provider_webhook_events WHERE provider = ? AND provider_event_id = ? LIMIT 1`,
      [input.provider, input.providerEventId]
    );
    if (existingRows[0]) {
      return { created: false, event: rowToRecord(existingRows[0]) };
    }
    const id = `PWE-${randomUUID()}`;
    try {
      await mysql.execute<MysqlResult>(
        `INSERT INTO provider_webhook_events
         (id, provider, event_type, provider_event_id, provider_reference, payload_json, processed, processed_at, error_message, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?, ?)`,
        [
          id,
          input.provider,
          input.eventType,
          input.providerEventId,
          input.providerReference ?? null,
          JSON.stringify(input.payload ?? {}),
          toMysqlDatetime(now),
          toMysqlDatetime(now),
        ]
      );
      const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM provider_webhook_events WHERE id = ? LIMIT 1`, [id]);
      return { created: true, event: rows[0] ? rowToRecord(rows[0]) : null };
    } catch (error) {
      if (!isMysqlDuplicateEntry(error)) throw error;
      const [concurrentRows] = await mysql.execute<MysqlRow[]>(
        `SELECT * FROM provider_webhook_events WHERE provider = ? AND provider_event_id = ? LIMIT 1`,
        [input.provider, input.providerEventId]
      );
      if (!concurrentRows[0]) throw error;
      return { created: false, event: rowToRecord(concurrentRows[0]) };
    }
  }

  const state = readState();
  const index = key(input.provider, input.providerEventId);
  const existing = state.byProviderEventId[index];
  if (existing) return { created: false, event: existing };
  const event: ProviderWebhookEventRecord = {
    id: `PWE-${randomUUID()}`,
    provider: input.provider,
    eventType: input.eventType,
    providerEventId: input.providerEventId,
    providerReference: input.providerReference,
    payload: input.payload,
    processed: false,
    createdAt: now,
    updatedAt: now,
  };
  state.byProviderEventId[index] = event;
  writeState(state);
  return { created: true, event };
}

export async function markProviderWebhookEventProcessed(input: {
  provider: string;
  providerEventId: string;
  processed: boolean;
  errorMessage?: string;
}) {
  const mysql = await getMysqlPool();
  const now = new Date().toISOString();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(
      `UPDATE provider_webhook_events
       SET processed = ?, processed_at = ?, error_message = ?, updated_at = ?
       WHERE provider = ? AND provider_event_id = ?`,
      [
        input.processed ? 1 : 0,
        input.processed ? toMysqlDatetime(now) : null,
        input.errorMessage ?? null,
        toMysqlDatetime(now),
        input.provider,
        input.providerEventId,
      ]
    );
    return;
  }

  const state = readState();
  const index = key(input.provider, input.providerEventId);
  const current = state.byProviderEventId[index];
  if (!current) return;
  state.byProviderEventId[index] = {
    ...current,
    processed: input.processed,
    processedAt: input.processed ? now : current.processedAt,
    errorMessage: input.errorMessage,
    updatedAt: now,
  };
  writeState(state);
}
