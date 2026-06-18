#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  const routeConfig = read('lib/role-routing/role-dashboard-config.ts');
  const nextConfig = read('next.config.ts');
  const adminNav = read('components/admin/navigation-config.tsx');
  const adminHub = read('components/admin/hub/AdminHubPage.tsx');
  const adminOrders = read('components/admin/orders/AdminOrdersPage.tsx');
  const accessRouting = read('lib/role-routing/access-routing.ts');
  const communityCampaigns = read('app/community/campaigns/page.tsx');
  const affiliateLinks = read('app/affiliate/links/page.tsx');
  const routesDoc = read('docs/ROUTES.md');
  const phaseOneDoc = read('docs/FASE_1_VENDA_DE_PRODUTO.md');
  const freezeDoc = read('docs/FASE_1_FREEZE_CHECKLIST.md');
  const phaseOneFrontendDoc = read('docs/FRONTEND_FASE_1_VENDA_DE_PRODUTO.md');
  const executionTracking = read('docs/EXECUTION_TRACKING.md');
  const changelog = read('docs/CHANGELOG_GOVERNANCE.md');
  const deletedLegacyPages = [
    'app/admin/support/page.tsx',
    'app/admin/support/[orderId]/page.tsx',
    'app/admin/production/page.tsx',
    'app/admin/shipments/page.tsx',
    'app/admin/finance/payouts/page.tsx',
    'app/finance/dashboard/page.tsx',
  ];

  assert(!routeConfig.includes("href: '/account/orders'"), 'dashboard config still points non-customer role to /account/orders');
  assert(!routeConfig.includes("href: '/account/wallet'"), 'dashboard config still points non-customer role to /account/wallet');
  assert(!routeConfig.includes("href: '/finance/dashboard'"), 'dashboard config still points finance role to /finance/dashboard');
  assert(!nextConfig.includes("{ source: '/admin/impact-reviews', destination: '/curation'"), 'legacy redirect for /admin/impact-reviews still active');
  assert(nextConfig.includes("{ source: '/finance/dashboard', destination: '/finance'"), 'finance dashboard alias redirect missing');

  const forbiddenInternalRefs = ['/admin/support', '/admin/production', '/admin/shipments', '/admin/finance/payouts', '/finance/dashboard'];
  for (const ref of forbiddenInternalRefs) {
    assert(!adminNav.includes(ref), `admin navigation still references legacy route ${ref}`);
    assert(!adminHub.includes(ref), `admin hub still references legacy route ${ref}`);
    assert(!adminOrders.includes(ref), `admin orders still references legacy route ${ref}`);
  }

  const activeDocsWithoutLegacyAliases = [phaseOneDoc, freezeDoc, phaseOneFrontendDoc];
  for (const ref of forbiddenInternalRefs) {
    for (const doc of activeDocsWithoutLegacyAliases) {
      assert(!doc.includes(ref), `active phase document still references legacy route ${ref}`);
    }
  }

  assert(!communityCampaigns.includes('/account/orders'), 'community page still links to blocked customer order route');
  assert(!affiliateLinks.includes('/account/wallet'), 'affiliate page still links to blocked customer wallet route');
  assert(routesDoc.includes('/admin/impact-reviews'), 'routes document missing cross-role canonical surface');
  assert(!accessRouting.includes("pathname.startsWith('/admin/production')"), 'admin guard still authorizes removed /admin/production shell');
  assert(!accessRouting.includes("pathname.startsWith('/admin/support')"), 'admin guard still authorizes removed /admin/support shell');
  assert(!accessRouting.includes("pathname.startsWith('/admin/finance')"), 'admin guard still authorizes removed /admin/finance shell');
  assert(
    /mencoes historicas a `\/admin\/support`, `\/admin\/production`, `\/admin\/finance\/payouts` e `\/finance\/dashboard`/i.test(executionTracking),
    'execution tracking missing legacy route disclaimer'
  );
  assert(changelog.includes('Entradas historicas podem citar rotas legadas'), 'changelog missing historical route disclaimer');
  for (const relativePath of deletedLegacyPages) {
    assert(!fs.existsSync(path.join(root, relativePath)), `legacy mounted page still exists: ${relativePath}`);
  }

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        report: [
          'ROUTES-01 dashboards do not point non-customer roles to /account/*',
          'ROUTES-02 legacy internal links removed from admin navigation surfaces',
          'ROUTES-03 /admin/impact-reviews remains canonical in documentation and config',
          'ROUTES-04 legacy admin route shells removed from app tree',
          'ROUTES-05 active phase docs no longer teach dead aliases',
          'ROUTES-06 admin guard does not authorize removed legacy shells',
        ],
      },
      null,
      2
    )
  );
}

try {
  run();
} catch (error) {
  console.error(
    JSON.stringify(
      {
        status: 'FAIL',
        error: String(error),
      },
      null,
      2
    )
  );
  process.exit(1);
}
