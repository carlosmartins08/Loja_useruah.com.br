import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';

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

function makeUniqueSlug(base: string, state: ReferralState) {
  const normalized = slugify(base) || 'link';
  let candidate = normalized;
  let suffix = 2;
  const used = new Set(Object.values(state.links).map((row) => row.slug));
  while (used.has(candidate)) {
    candidate = `${normalized}-${suffix}`;
    suffix += 1;
  }
  return candidate;
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

export function createReferralLink(input: {
  ownerId: string;
  label: string;
  channel: string;
  targetPath: string;
  slug?: string;
}) {
  const state = readState();
  const now = new Date().toISOString();
  const slug = input.slug?.trim() ? makeUniqueSlug(input.slug.trim(), state) : makeUniqueSlug(input.label, state);
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

  state.links[referralLinkId] = link;
  writeState(state);
  return link;
}

export function listReferralLinksByOwner(ownerId: string) {
  const state = readState();
  const events = Object.values(state.events);
  return Object.values(state.links)
    .filter((row) => row.ownerId === ownerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((row) => derivePerformance(row, events));
}

export function getReferralLinkById(referralLinkId: string) {
  return readState().links[referralLinkId] ?? null;
}

export function getReferralLinkBySlug(slug: string) {
  return Object.values(readState().links).find((row) => row.slug === slug) ?? null;
}

export function recordReferralClick(input: { referralLinkId: string }) {
  const state = readState();
  const link = state.links[input.referralLinkId];
  if (!link) return { kind: 'not_found' as const };

  const event: ReferralEventRecord = {
    referralEventId: `RFE-${randomUUID()}`,
    referralLinkId: link.referralLinkId,
    ownerId: link.ownerId,
    eventType: 'click',
    occurredAt: new Date().toISOString(),
  };

  state.events[event.referralEventId] = event;
  writeState(state);
  return { kind: 'created' as const, event, link };
}

export function recordReferralConversion(input: {
  referralLinkId: string;
  orderId: string;
  revenueAmount: number;
}) {
  const state = readState();
  const link = state.links[input.referralLinkId];
  if (!link) return { kind: 'not_found' as const };

  const existing = Object.values(state.events).find(
    (row) => row.referralLinkId === input.referralLinkId && row.eventType === 'conversion' && row.orderId === input.orderId
  );
  if (existing) {
    return { kind: 'already_recorded' as const, event: existing, link };
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

  state.events[event.referralEventId] = event;
  writeState(state);
  return { kind: 'created' as const, event, link };
}
