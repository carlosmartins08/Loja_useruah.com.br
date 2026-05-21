import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

interface WebhookEventRecord {
  eventId: string;
  processedAt: string;
}

function parseRetentionDays() {
  const value = Number(process.env.WEBHOOK_IDEMPOTENCY_RETENTION_DAYS ?? '30');
  if (!Number.isFinite(value) || value <= 0) return 30;
  return value;
}

function normalizeEvents(raw: unknown): WebhookEventRecord[] {
  if (!Array.isArray(raw)) return [];
  const now = new Date().toISOString();
  return raw
    .map((entry) => {
      if (typeof entry === 'string') {
        return { eventId: entry, processedAt: now };
      }
      if (!entry || typeof entry !== 'object') return null;
      const record = entry as Partial<WebhookEventRecord>;
      if (typeof record.eventId !== 'string' || record.eventId.length === 0) return null;
      return {
        eventId: record.eventId,
        processedAt: typeof record.processedAt === 'string' ? record.processedAt : now,
      };
    })
    .filter((entry): entry is WebhookEventRecord => entry !== null);
}

function pruneExpired(events: WebhookEventRecord[]) {
  const cutoff = Date.now() - parseRetentionDays() * 24 * 60 * 60 * 1000;
  return events.filter((entry) => {
    const ts = Date.parse(entry.processedAt);
    return Number.isNaN(ts) || ts >= cutoff;
  });
}

function readEvents() {
  const raw = readStoreFile<unknown>('webhook-events', []);
  return pruneExpired(normalizeEvents(raw));
}

function writeEvents(value: WebhookEventRecord[]) {
  writeStoreFile('webhook-events', value);
}

export async function markWebhookEventProcessed(eventId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const retentionDays = parseRetentionDays();
    await mysql.execute<MysqlResult>(
      `INSERT INTO webhook_events (event_id, processed_at)
       VALUES (?, UTC_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE processed_at = processed_at`,
      [eventId]
    );
    await mysql.execute<MysqlResult>(`DELETE FROM webhook_events WHERE processed_at < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL ? DAY)`, [
      retentionDays,
    ]);
    return;
  }

  const events = readEvents();
  if (!events.some((entry) => entry.eventId === eventId)) {
    events.push({ eventId, processedAt: new Date().toISOString() });
  }
  writeEvents(events);
}

export async function isWebhookEventProcessed(eventId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const retentionDays = parseRetentionDays();
    await mysql.execute<MysqlResult>(`DELETE FROM webhook_events WHERE processed_at < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL ? DAY)`, [
      retentionDays,
    ]);
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT event_id FROM webhook_events WHERE event_id = ? LIMIT 1`, [eventId]);
    return rows.length > 0;
  }

  const events = readEvents();
  return events.some((entry) => entry.eventId === eventId);
}
