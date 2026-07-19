import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import mysql from 'mysql2/promise';

const root = process.cwd();
const tmpStore = join(root, '.tmp-store');

function envValue(name) {
  if (process.env[name]) return process.env[name];
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return undefined;
  const line = readFileSync(envPath, 'utf8').split(/\r?\n/).find((entry) => new RegExp(`^${name}\\s*=`).test(entry));
  return line?.replace(new RegExp(`^${name}\\s*=\\s*`), '').trim().replace(/^['"]|['"]$/g, '');
}

function readJson(name, fallback) {
  const path = join(tmpStore, name);
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback;
}

function parseMysqlUrl(raw) {
  if (!raw || !raw.startsWith('mysql://')) throw new Error('DATABASE_URL_mysql_required');
  const parsed = new URL(raw);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
  };
}

function valuesFrom(file, key) {
  return Object.values(readJson(file, { [key]: {} })[key] ?? {});
}

function classify(row, fields) {
  const haystack = fields.map((field) => String(row[field] ?? '')).join(' ');
  return /(^|[-_ ])(?:org-)?qa(?:[-_ ]|$)/i.test(haystack) ? 'qa_or_test' : 'unclassified_legacy';
}

function countBy(rows, fn) {
  return rows.reduce((result, row) => {
    const key = fn(row);
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});
}

function duplicates(rows, field) {
  return duplicateKeys(rows, (row) => row[field]);
}

function duplicateKeys(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const value = keyFn(row);
    const group = groups.get(value) ?? [];
    group.push(value);
    groups.set(value, group);
  }
  return [...groups.entries()].filter(([, group]) => group.length > 1).map(([value, group]) => ({ value, count: group.length }));
}

function normalize(value) {
  if (value instanceof Date) return value.toISOString().replace('T', ' ').replace('Z', '');
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const text = String(value);
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  return text.replace('T', ' ').replace('Z', '');
}

function fingerprint(row, fields) {
  return JSON.stringify(fields.map((field) => normalize(row[field])));
}

async function fetchExisting(db, table, idField, ids, fields) {
  if (ids.length === 0) return new Map();
  const placeholders = ids.map(() => '?').join(', ');
  const [rows] = await db.execute(
    `SELECT ${[idField, ...fields].join(', ')} FROM ${table} WHERE ${idField} IN (${placeholders})`,
    ids,
  );
  return new Map(rows.map((row) => [row[idField], row]));
}

function compare(sourceRows, existing, idField, fields) {
  let absent = 0;
  let equal = 0;
  let conflicts = 0;
  const conflictIds = [];
  for (const row of sourceRows) {
    const current = existing.get(row[idField]);
    if (!current) {
      absent += 1;
      continue;
    }
    if (fingerprint(row, fields) === fingerprint(current, fields)) equal += 1;
    else {
      conflicts += 1;
      conflictIds.push(row[idField]);
    }
  }
  return { source: sourceRows.length, existing: existing.size, absent, equal, conflicts, conflictIds: conflictIds.slice(0, 20) };
}

const campaigns = valuesFrom('campaigns.json', 'campaigns');
const campaignProducts = valuesFrom('campaign-products.json', 'links');
const referralState = readJson('referral-links.json', { links: {}, events: {} });
const referralLinks = Object.values(referralState.links ?? {});
const referralEvents = Object.values(referralState.events ?? {});

const campaignIds = new Set(campaigns.map((row) => row.campaignId));
const referralLinkIds = new Set(referralLinks.map((row) => row.referralLinkId));
const sourceIntegrity = {
  duplicateCampaignIds: duplicates(campaigns, 'campaignId'),
  duplicateCampaignProductIds: duplicates(campaignProducts, 'campaignProductId'),
  duplicateReferralLinkIds: duplicates(referralLinks, 'referralLinkId'),
  duplicateReferralEventIds: duplicates(referralEvents, 'referralEventId'),
  duplicateReferralSlugs: duplicates(referralLinks, 'slug'),
  orphanCampaignProducts: campaignProducts.filter((row) => !campaignIds.has(row.campaignId)).map((row) => row.campaignProductId),
  orphanReferralEvents: referralEvents.filter((row) => !referralLinkIds.has(row.referralLinkId)).map((row) => row.referralEventId),
  referralOwnerMismatches: referralEvents
    .filter((event) => referralLinks.find((link) => link.referralLinkId === event.referralLinkId)?.ownerId !== event.ownerId)
    .map((row) => row.referralEventId),
  duplicateConversionKeys: duplicateKeys(
    referralEvents.filter((row) => row.eventType === 'conversion' && row.orderId),
    (row) => `${row.referralLinkId}:${row.eventType}:${row.orderId}`,
  ),
};

const db = await mysql.createConnection(parseMysqlUrl(envValue('DATABASE_URL')));
try {
  const campaignFields = ['organization_id AS organizationId', 'name', 'description', 'budget', 'progressive_price_rule AS progressivePriceRule', 'starts_at AS startsAt', 'ends_at AS endsAt', 'status', 'created_by AS createdBy', 'created_at AS createdAt', 'updated_at AS updatedAt'];
  const campaignProductFields = ['campaign_id AS campaignId', 'catalog_item_id AS catalogItemId', 'linked_by AS linkedBy', 'created_at AS createdAt'];
  const referralLinkFields = ['owner_id AS ownerId', 'slug', 'label', 'channel', 'target_path AS targetPath', 'status', 'created_at AS createdAt', 'updated_at AS updatedAt'];
  const referralEventFields = ['referral_link_id AS referralLinkId', 'owner_id AS ownerId', 'event_type AS eventType', 'occurred_at AS occurredAt', 'order_id AS orderId', 'revenue_amount AS revenueAmount'];
  const existing = {
    campaigns: await fetchExisting(db, 'campaigns', 'campaign_id', campaigns.map((row) => row.campaignId), campaignFields),
    campaignProducts: await fetchExisting(db, 'campaign_products', 'campaign_product_id', campaignProducts.map((row) => row.campaignProductId), campaignProductFields),
    referralLinks: await fetchExisting(db, 'referral_links', 'referral_link_id', referralLinks.map((row) => row.referralLinkId), referralLinkFields),
    referralEvents: await fetchExisting(db, 'referral_events', 'referral_event_id', referralEvents.map((row) => row.referralEventId), referralEventFields),
  };
  const comparisons = {
    campaigns: compare(campaigns, existing.campaigns, 'campaignId', ['organizationId', 'name', 'description', 'budget', 'progressivePriceRule', 'startsAt', 'endsAt', 'status', 'createdBy', 'createdAt', 'updatedAt']),
    campaignProducts: compare(campaignProducts, existing.campaignProducts, 'campaignProductId', ['campaignId', 'catalogItemId', 'linkedBy', 'createdAt']),
    referralLinks: compare(referralLinks, existing.referralLinks, 'referralLinkId', ['ownerId', 'slug', 'label', 'channel', 'targetPath', 'status', 'createdAt', 'updatedAt']),
    referralEvents: compare(referralEvents, existing.referralEvents, 'referralEventId', ['referralLinkId', 'ownerId', 'eventType', 'occurredAt', 'orderId', 'revenueAmount']),
  };
  const qaRows = {
    campaigns: countBy(campaigns, (row) => classify(row, ['organizationId', 'createdBy'])),
    campaignProducts: countBy(campaignProducts, (row) => classify(row, ['linkedBy'])),
    referralLinks: countBy(referralLinks, (row) => classify(row, ['ownerId', 'slug'])),
    referralEvents: countBy(referralEvents, (row) => classify(row, ['ownerId'])),
  };
  const integrityIssueCount = Object.values(sourceIntegrity).reduce((total, value) => total + (Array.isArray(value) ? value.length : 0), 0);
  const conflictCount = Object.values(comparisons).reduce((total, value) => total + value.conflicts, 0);
  const unclassifiedCount = Object.values(qaRows).reduce((total, value) => total + Number(value.unclassified_legacy ?? 0), 0);
  console.log(JSON.stringify({
    status: integrityIssueCount === 0 && conflictCount === 0 ? 'PASS_WITH_REVIEW' : 'BLOCKED',
    decision: unclassifiedCount === 0 && integrityIssueCount === 0 && conflictCount === 0 ? 'NO_PROMOTION_CANDIDATES' : 'REVIEW_REQUIRED',
    sourceCounts: { campaigns: campaigns.length, campaignProducts: campaignProducts.length, referralLinks: referralLinks.length, referralEvents: referralEvents.length },
    classification: qaRows,
    sourceIntegrity,
    mysqlComparison: comparisons,
    nextAction: 'classify_source_environment_and_approve_prefixes_before_backfill',
  }, null, 2));
} finally {
  await db.end();
}
