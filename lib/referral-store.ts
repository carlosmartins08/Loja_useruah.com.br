import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export type ReferralLinkStatus = 'active' | 'paused';
export type ReferralEventType = 'click' | 'conversion';

export interface ReferralLinkRecord {
  referralLinkId: string;
  ownerId: string;
  slug: string;
  label: string;
  channel: string;
  targetPath: string;
  status: ReferralLinkStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralEventRecord {
  referralEventId: string;
  referralLinkId: string;
  ownerId: string;
  eventType: ReferralEventType;
  occurredAt: string;
  orderId?: string;
  revenueAmount?: number;
}

interface ReferralState {
  links: Record<string, ReferralLinkRecord>;
  events: Record<string, ReferralEventRecord>;
}

export interface ReferralLinkPerformance extends ReferralLinkRecord {
  clickCount: number;
  conversionCount: number;
  conversionRate: number;
  revenueAmount: number;
}

function readState(): ReferralState {
  return readStoreFile<ReferralState>('referral-links', { links: {}, events: {} });
}

function writeState(state: ReferralState) {
  writeStoreFile('referral-links', state);
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function makeUniqueSlug(base: string, usedSlugs: Set<string>) {
  const normalized = slugify(base) || 'link';
  let candidate = normalized;
  let suffix = 2;
  while (usedSlugs.has(candidate)) {
    candidate = `${normalized}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToLink(row: MysqlRow): ReferralLinkRecord {
  return {
    referralLinkId: String(row.referral_link_id),
    ownerId: String(row.owner_id),
    slug: String(row.slug),
    label: String(row.label),
    channel: String(row.channel),
    targetPath: String(row.target_path),
    status: row.status as ReferralLinkStatus,
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: mysqlDatetimeToIso(row.updated_at) ?? new Date().toISOString(),
  };
}

function rowToEvent(row: MysqlRow): ReferralEventRecord {
  return {
    referralEventId: String(row.referral_event_id),
    referralLinkId: String(row.referral_link_id),
    ownerId: String(row.owner_id),
    eventType: row.event_type as ReferralEventType,
    occurredAt: mysqlDatetimeToIso(row.occurred_at) ?? new Date().toISOString(),
    orderId: row.order_id ? String(row.order_id) : undefined,
    revenueAmount: row.revenue_amount === null || row.revenue_amount === undefined ? undefined : Number(row.revenue_amount),
  };
}

function derivePerformance(link: ReferralLinkRecord, events: ReferralEventRecord[]): ReferralLinkPerformance {
  const linkEvents = events.filter((row) => row.referralLinkId === link.referralLinkId);
  const clickCount = linkEvents.filter((row) => row.eventType === 'click').length;
  const conversions = linkEvents.filter((row) => row.eventType === 'conversion');
  const conversionCount = conversions.length;
  const revenueAmount = Number(conversions.reduce((acc, row) => acc + (row.revenueAmount ?? 0), 0).toFixed(2));
  const conversionRate = clickCount > 0 ? Number(((conversionCount / clickCount) * 100).toFixed(1)) : 0;

  return {
    ...link,
    clickCount,
    conversionCount,
    conversionRate,
    revenueAmount,
  };
}

export async function createReferralLink(input: {
  ownerId: string;
  label: string;
  channel: string;
  targetPath: string;
  slug?: string;
}) {
  const now = new Date().toISOString();
  const mysql = await getMysqlPool();
  let slug: string;
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>('SELECT slug FROM referral_links');
    slug = input.slug?.trim()
      ? makeUniqueSlug(input.slug.trim(), new Set(rows.map((row) => String(row.slug))))
      : makeUniqueSlug(input.label, new Set(rows.map((row) => String(row.slug))));
  } else {
    const state = readState();
    slug = input.slug?.trim() ? makeUniqueSlug(input.slug.trim(), new Set(Object.values(state.links).map((row) => row.slug))) : makeUniqueSlug(input.label, new Set(Object.values(state.links).map((row) => row.slug)));
  }
  const referralLinkId = `REF-${randomUUID()}`;

  const link: ReferralLinkRecord = {
    referralLinkId,
    ownerId: input.ownerId,
    slug,
    label: input.label.trim(),
    channel: input.channel.trim(),
    targetPath: input.targetPath.trim(),
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(
      `INSERT INTO referral_links (
        referral_link_id, owner_id, slug, label, channel, target_path, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        link.referralLinkId,
        link.ownerId,
        link.slug,
        link.label,
        link.channel,
        link.targetPath,
        link.status,
        toMysqlDatetime(link.createdAt),
        toMysqlDatetime(link.updatedAt),
      ]
    );
    return link;
  }

  const state = readState();
  state.links[referralLinkId] = link;
  writeState(state);
  return link;
}

export async function listReferralLinksByOwner(ownerId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [linkRows] = await mysql.execute<MysqlRow[]>(
      'SELECT * FROM referral_links WHERE owner_id = ? ORDER BY created_at DESC',
      [ownerId]
    );
    if (linkRows.length === 0) return [];
    const ids = linkRows.map((row) => String(row.referral_link_id));
    const placeholders = ids.map(() => '?').join(', ');
    const [eventRows] = await mysql.execute<MysqlRow[]>(
      `SELECT * FROM referral_events WHERE referral_link_id IN (${placeholders}) ORDER BY occurred_at ASC`,
      ids
    );
    const events = eventRows.map(rowToEvent);
    return linkRows.map((row) => derivePerformance(rowToLink(row), events));
  }

  const state = readState();
  const events = Object.values(state.events);
  return Object.values(state.links)
    .filter((row) => row.ownerId === ownerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((row) => derivePerformance(row, events));
}

export async function getReferralLinkById(referralLinkId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>('SELECT * FROM referral_links WHERE referral_link_id = ?', [referralLinkId]);
    return rows[0] ? rowToLink(rows[0]) : null;
  }

  return readState().links[referralLinkId] ?? null;
}

export async function getReferralLinkBySlug(slug: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>('SELECT * FROM referral_links WHERE slug = ?', [slug]);
    return rows[0] ? rowToLink(rows[0]) : null;
  }

  return Object.values(readState().links).find((row) => row.slug === slug) ?? null;
}

export async function updateReferralLinkStatus(input: {
  referralLinkId: string;
  from: ReferralLinkStatus[];
  to: ReferralLinkStatus;
}) {
  const current = await getReferralLinkById(input.referralLinkId);
  if (!current) return { kind: 'not_found' as const };
  if (current.status === input.to) {
    return { kind: 'unchanged' as const, link: current };
  }
  if (!input.from.includes(current.status)) {
    return { kind: 'invalid_transition' as const, link: current };
  }

  const updated: ReferralLinkRecord = {
    ...current,
    status: input.to,
    updatedAt: new Date().toISOString(),
  };
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>('UPDATE referral_links SET status = ?, updated_at = ? WHERE referral_link_id = ?', [
      updated.status,
      toMysqlDatetime(updated.updatedAt),
      updated.referralLinkId,
    ]);
  } else {
    const state = readState();
    state.links[input.referralLinkId] = updated;
    writeState(state);
  }
  return { kind: 'updated' as const, previous: current, link: updated };
}

export async function recordReferralClick(input: { referralLinkId: string }) {
  const link = await getReferralLinkById(input.referralLinkId);
  if (!link) return { kind: 'not_found' as const };

  const event: ReferralEventRecord = {
    referralEventId: `RFE-${randomUUID()}`,
    referralLinkId: link.referralLinkId,
    ownerId: link.ownerId,
    eventType: 'click',
    occurredAt: new Date().toISOString(),
  };
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(
      `INSERT INTO referral_events (
        referral_event_id, referral_link_id, owner_id, event_type, occurred_at, order_id, revenue_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [event.referralEventId, event.referralLinkId, event.ownerId, event.eventType, toMysqlDatetime(event.occurredAt), null, null]
    );
  } else {
    const state = readState();
    state.events[event.referralEventId] = event;
    writeState(state);
  }
  return { kind: 'created' as const, event, link };
}

export async function recordReferralConversion(input: {
  referralLinkId: string;
  orderId: string;
  revenueAmount: number;
}) {
  const link = await getReferralLinkById(input.referralLinkId);
  if (!link) return { kind: 'not_found' as const };

  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [existingRows] = await mysql.execute<MysqlRow[]>(
      `SELECT * FROM referral_events
       WHERE referral_link_id = ? AND event_type = 'conversion' AND order_id = ? LIMIT 1`,
      [input.referralLinkId, input.orderId]
    );
    if (existingRows[0]) return { kind: 'already_recorded' as const, event: rowToEvent(existingRows[0]), link };
  } else {
    const state = readState();
    const existing = Object.values(state.events).find(
      (row) => row.referralLinkId === input.referralLinkId && row.eventType === 'conversion' && row.orderId === input.orderId
    );
    if (existing) return { kind: 'already_recorded' as const, event: existing, link };
  }

  const event: ReferralEventRecord = {
    referralEventId: `RFE-${randomUUID()}`,
    referralLinkId: link.referralLinkId,
    ownerId: link.ownerId,
    eventType: 'conversion',
    occurredAt: new Date().toISOString(),
    orderId: input.orderId,
    revenueAmount: Number(input.revenueAmount.toFixed(2)),
  };

  if (mysql && shouldUseMysql()) {
    try {
      await mysql.query<MysqlResult>(
        `INSERT INTO referral_events (
          referral_event_id, referral_link_id, owner_id, event_type, occurred_at, order_id, revenue_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          event.referralEventId,
          event.referralLinkId,
          event.ownerId,
          event.eventType,
          toMysqlDatetime(event.occurredAt),
          event.orderId,
          event.revenueAmount,
        ]
      );
    } catch (error) {
      const code = error && typeof error === 'object' ? (error as { code?: string }).code : undefined;
      if (code !== 'ER_DUP_ENTRY') throw error;
      const [existingRows] = await mysql.execute<MysqlRow[]>(
        `SELECT * FROM referral_events
         WHERE referral_link_id = ? AND event_type = 'conversion' AND order_id = ? LIMIT 1`,
        [input.referralLinkId, input.orderId]
      );
      if (existingRows[0]) return { kind: 'already_recorded' as const, event: rowToEvent(existingRows[0]), link };
      throw error;
    }
  } else {
    const state = readState();
    state.events[event.referralEventId] = event;
    writeState(state);
  }
  return { kind: 'created' as const, event, link };
}
