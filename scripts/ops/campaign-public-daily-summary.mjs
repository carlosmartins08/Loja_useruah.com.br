#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

const auditLogs = readJson(path.join(root, '.tmp-store', 'audit-logs.json'), []);
const ordersState = readJson(path.join(root, '.tmp-store', 'orders.json'), {});

const campaignActions = new Set([
  'campaign.public_viewed',
  'campaign.storefront_opened',
  'campaign.storefront_unavailable',
  'campaign.context_redirected',
  'campaign.context_ignored',
  'referral.context_ignored',
  'referral_click_recorded',
]);

const relevantLogs = auditLogs.filter((row) => campaignActions.has(String(row.action)));
const campaignPublicViewed = relevantLogs.filter((row) => row.action === 'campaign.public_viewed');
const storefrontOpened = relevantLogs.filter((row) => row.action === 'campaign.storefront_opened');
const storefrontUnavailable = relevantLogs.filter((row) => row.action === 'campaign.storefront_unavailable');
const contextRedirected = relevantLogs.filter((row) => row.action === 'campaign.context_redirected');
const campaignContextIgnored = relevantLogs.filter((row) => row.action === 'campaign.context_ignored');
const referralContextIgnored = relevantLogs.filter((row) => row.action === 'referral.context_ignored');
const referralClicks = relevantLogs.filter((row) => row.action === 'referral_click_recorded');

const orders = Object.values(ordersState ?? {});
const allItems = orders.flatMap((order) => (Array.isArray(order.items) ? order.items : []));
const campaignOrders = allItems.filter((item) => item.campaignId);
const referralOrders = allItems.filter((item) => item.referralLinkId);
const combinedOrders = allItems.filter((item) => item.campaignId && item.referralLinkId);
const staleSignals = campaignContextIgnored.length + referralContextIgnored.length;

const recentEvents = relevantLogs
  .slice()
  .sort((left, right) => String(right.created_at).localeCompare(String(left.created_at)))
  .slice(0, 15);

const generatedAt = new Date().toISOString();
const report = `# Campaign Public Daily Summary

Generated at: ${generatedAt}

## KPI Snapshot
- Public campaign views: ${campaignPublicViewed.length}
- Storefront opens: ${storefrontOpened.length}
- Storefront unavailable redirects: ${storefrontUnavailable.length}
- Context redirects: ${contextRedirected.length}
- Referral clicks into campaign/public flow: ${referralClicks.length}
- Ignored stale campaign contexts: ${campaignContextIgnored.length}
- Ignored stale referral contexts: ${referralContextIgnored.length}
- Attributed order items with campaign: ${campaignOrders.length}
- Attributed order items with referral: ${referralOrders.length}
- Attributed order items with campaign + referral: ${combinedOrders.length}

## Operational Risk
- Overall status: ${staleSignals > 0 || storefrontUnavailable.length > 0 ? 'ATTENTION' : 'STABLE'}
- Cookie staleness signal: ${staleSignals > 0 ? 'YES' : 'NO'}
- Empty/unavailable storefront pressure: ${storefrontUnavailable.length > storefrontOpened.length ? 'ELEVATED' : 'CONTROLLED'}

## Recent Events (Top 15)
${recentEvents.length === 0 ? '- none' : recentEvents.map((row) => `- ${row.created_at} | ${row.action} | ${row.entity_type}:${row.entity_id} | ${row.reason ?? 'n/a'}`).join('\n')}
`;

const outDir = path.join(root, 'docs', 'ops');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'CAMPAIGN_PUBLIC_DAILY_SUMMARY.md');
fs.writeFileSync(outPath, report, 'utf8');

console.log(
  JSON.stringify(
    {
      status: 'PASS',
      output: 'docs/ops/CAMPAIGN_PUBLIC_DAILY_SUMMARY.md',
      kpi: {
        publicViews: campaignPublicViewed.length,
        storefrontOpened: storefrontOpened.length,
        storefrontUnavailable: storefrontUnavailable.length,
        contextRedirected: contextRedirected.length,
        campaignContextIgnored: campaignContextIgnored.length,
        referralContextIgnored: referralContextIgnored.length,
        campaignOrders: campaignOrders.length,
        referralOrders: referralOrders.length,
        combinedOrders: combinedOrders.length,
      },
    },
    null,
    2
  )
);
