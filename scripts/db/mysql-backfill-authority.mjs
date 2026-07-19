import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import mysql from 'mysql2/promise';

const root = process.cwd();
const tmpStore = join(root, '.tmp-store');
const execute = process.argv.includes('--execute');
const prefixes = process.argv
  .filter((arg) => arg.startsWith('--allow-prefix='))
  .map((arg) => arg.slice('--allow-prefix='.length))
  .filter(Boolean);

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

function mysqlDate(value) {
  return value ? String(value).replace('T', ' ').replace('Z', '') : null;
}

function hasAllowedPrefix(value) {
  return prefixes.length === 0 || prefixes.some((prefix) => String(value ?? '').startsWith(prefix));
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

function collectSource() {
  const campaigns = Object.values(readJson('campaigns.json', { campaigns: {} }).campaigns ?? {});
  const links = Object.values(readJson('campaign-products.json', { links: {} }).links ?? {});
  const referralState = readJson('referral-links.json', { links: {}, events: {} });
  const referralLinks = Object.values(referralState.links ?? {});
  const referralEvents = Object.values(referralState.events ?? {});
  const eligibleCampaigns = campaigns.filter((row) => hasAllowedPrefix(row.organizationId));
  const eligibleCampaignIds = new Set(eligibleCampaigns.map((row) => row.campaignId));
  const eligibleLinks = links.filter((row) => eligibleCampaignIds.has(row.campaignId));
  const eligibleReferralLinks = referralLinks.filter((row) => hasAllowedPrefix(row.ownerId));
  const eligibleReferralIds = new Set(eligibleReferralLinks.map((row) => row.referralLinkId));
  const eligibleReferralEvents = referralEvents.filter((row) => eligibleReferralIds.has(row.referralLinkId));

  return {
    campaigns: eligibleCampaigns,
    campaignProducts: eligibleLinks,
    referralLinks: eligibleReferralLinks,
    referralEvents: eligibleReferralEvents,
    sourceCounts: { campaigns: campaigns.length, campaignProducts: links.length, referralLinks: referralLinks.length, referralEvents: referralEvents.length },
  };
}

async function run() {
  const source = collectSource();
  const report = {
    mode: execute ? 'execute' : 'plan',
    prefixes: prefixes.length > 0 ? prefixes : ['ALL_LOCAL_JSON_REQUIRES_EXPLICIT_SCOPE_FOR_EXECUTION'],
    sourceCounts: source.sourceCounts,
    eligibleCounts: {
      campaigns: source.campaigns.length,
      campaignProducts: source.campaignProducts.length,
      referralLinks: source.referralLinks.length,
      referralEvents: source.referralEvents.length,
    },
  };

  if (!execute) {
    console.log(JSON.stringify({ status: 'PLAN', ...report }, null, 2));
    return;
  }
  if (prefixes.length === 0) throw new Error('backfill_scope_required:use_one_or_more_allow_prefix_flags');

  const db = await mysql.createConnection(parseMysqlUrl(envValue('DATABASE_URL')));
  try {
    let inserted = { campaigns: 0, campaignProducts: 0, referralLinks: 0, referralEvents: 0 };
    for (const row of source.campaigns) {
      const [result] = await db.execute(
        `INSERT IGNORE INTO campaigns (
          campaign_id, organization_id, name, description, budget, progressive_price_rule,
          starts_at, ends_at, status, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.campaignId, row.organizationId, row.name, row.description, row.budget, row.progressivePriceRule, mysqlDate(row.startsAt), mysqlDate(row.endsAt), row.status, row.createdBy, mysqlDate(row.createdAt), mysqlDate(row.updatedAt)]
      );
      inserted.campaigns += Number(result.affectedRows ?? 0);
    }
    for (const row of source.campaignProducts) {
      const [result] = await db.execute(
        `INSERT IGNORE INTO campaign_products (campaign_product_id, campaign_id, catalog_item_id, linked_by, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [row.campaignProductId, row.campaignId, row.catalogItemId, row.linkedBy, mysqlDate(row.createdAt)]
      );
      inserted.campaignProducts += Number(result.affectedRows ?? 0);
    }
    for (const row of source.referralLinks) {
      const [result] = await db.execute(
        `INSERT IGNORE INTO referral_links (
          referral_link_id, owner_id, slug, label, channel, target_path, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.referralLinkId, row.ownerId, row.slug, row.label, row.channel, row.targetPath, row.status, mysqlDate(row.createdAt), mysqlDate(row.updatedAt)]
      );
      inserted.referralLinks += Number(result.affectedRows ?? 0);
    }
    for (const row of source.referralEvents) {
      const [result] = await db.execute(
        `INSERT IGNORE INTO referral_events (
          referral_event_id, referral_link_id, owner_id, event_type, occurred_at, order_id, revenue_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [row.referralEventId, row.referralLinkId, row.ownerId, row.eventType, mysqlDate(row.occurredAt), row.orderId ?? null, row.revenueAmount ?? null]
      );
      inserted.referralEvents += Number(result.affectedRows ?? 0);
    }
    console.log(JSON.stringify({ status: 'PASS', ...report, inserted }, null, 2));
  } finally {
    await db.end();
  }
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', error: String(error) }, null, 2));
  process.exit(1);
});
