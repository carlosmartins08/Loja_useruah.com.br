import { chromium } from 'playwright';

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3327';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const ROLE_SUITES = [
  {
    id: 'customer',
    email: 'customer@useruah.com.br',
    password: 'customer123',
    home: '/account',
    dashboardCta: '/account/support',
    secondary: '/account/orders',
    negative: '/admin',
    negativeResolved: '/account',
  },
  {
    id: 'artist',
    email: 'artist@useruah.com.br',
    password: 'artist123',
    home: '/artist',
    dashboardCta: '/artist/orders',
    secondary: '/artist/portfolio',
    negative: '/account',
    negativeResolved: '/artist',
  },
  {
    id: 'community_manager',
    email: 'community@useruah.com.br',
    password: 'community123',
    home: '/community',
    dashboardCta: '/community/campaigns',
    secondary: '/community/revenue',
    negative: '/account/orders',
    negativeResolved: '/community',
  },
  {
    id: 'affiliate',
    email: 'affiliate@useruah.com.br',
    password: 'affiliate123',
    home: '/affiliate',
    dashboardCta: '/affiliate/links',
    secondary: '/policies',
    negative: '/finance',
    negativeResolved: '/affiliate',
  },
  {
    id: 'supplier',
    email: 'supplier@useruah.com.br',
    password: 'supplier123',
    home: '/supplier',
    dashboardCta: '/supplier/production',
    secondary: '/supplier/orders',
    negative: '/production',
    negativeResolved: '/supplier',
  },
  {
    id: 'curator',
    email: 'curator@useruah.com.br',
    password: 'curator123',
    home: '/curation',
    dashboardCta: '/admin/impact-reviews',
    secondary: '/curation/artworks',
    negative: '/admin',
    negativeResolved: '/curation',
  },
  {
    id: 'support_agent',
    email: 'support@useruah.com.br',
    password: 'support123',
    home: '/support',
    dashboardCta: '/support/tickets',
    secondary: '/support/escalations',
    negative: '/admin/orders',
    negativeResolved: '/support',
  },
  {
    id: 'production_operator',
    email: 'production@useruah.com.br',
    password: 'production123',
    home: '/production',
    dashboardCta: '/production/jobs',
    secondary: '/production/jobs',
    negative: '/finance',
    negativeResolved: '/production',
  },
  {
    id: 'finance_admin',
    email: 'finance@useruah.com.br',
    password: 'finance123',
    home: '/finance',
    dashboardCta: '/finance/payouts',
    secondary: '/admin/impact-reviews',
    negative: '/production',
    negativeResolved: '/finance',
  },
  {
    id: 'platform_admin',
    email: 'admin@useruah.com.br',
    password: 'admin123',
    home: '/admin',
    dashboardCta: '/support',
    secondary: '/admin/orders',
    negative: '/account',
    negativeResolved: '/admin',
    extraAllowed: ['/production/jobs', '/finance/payouts', '/admin/impact-reviews'],
  },
];

async function getSessionCookie(roleSuite) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: roleSuite.email, password: roleSuite.password }),
  });
  assert(response.status === 200, `${roleSuite.id}: login expected 200, got ${response.status}`);
  const setCookie = response.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/ruah_session=([^;]+)/);
  assert(match?.[1], `${roleSuite.id}: ruah_session cookie missing after login`);
  return match[1];
}

async function assertSessionRole(roleSuite, cookieValue) {
  const response = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { cookie: `ruah_session=${cookieValue}` },
  });
  assert(response.status === 200, `${roleSuite.id}: session probe expected 200, got ${response.status}`);
  const payload = await response.json();
  assert(payload?.authenticated === true, `${roleSuite.id}: session not authenticated`);
  assert(payload?.session?.activeRole === roleSuite.id, `${roleSuite.id}: activeRole mismatch (${String(payload?.session?.activeRole)})`);
}

function currentPath(page) {
  return new URL(page.url()).pathname;
}

async function waitForPath(page, expectedPath, label) {
  await page.waitForURL((url) => new URL(url).pathname === expectedPath, { timeout: 15000 });
  assert(currentPath(page) === expectedPath, `${label}: expected ${expectedPath}, got ${currentPath(page)}`);
}

async function assertSurfaceReady(page, label) {
  await page.locator('main, h1').first().waitFor({ state: 'visible', timeout: 15000 });
  assert(!currentPath(page).startsWith('/login'), `${label}: unexpectedly redirected to /login`);
}

async function gotoAndAssert(page, targetPath, expectedPath, label) {
  await page.goto(`${baseUrl}${targetPath}`, { waitUntil: 'domcontentloaded' });
  await waitForPath(page, expectedPath, label);
  await assertSurfaceReady(page, label);
}

async function clickAndAssert(page, href, expectedPath, label) {
  const link = page.locator(`a[href="${href}"]`).first();
  await link.waitFor({ state: 'visible', timeout: 15000 });
  await link.click();
  await waitForPath(page, expectedPath, label);
  await assertSurfaceReady(page, label);
}

async function runRoleSuite(browser, roleSuite) {
  const cookieValue = await getSessionCookie(roleSuite);
  await assertSessionRole(roleSuite, cookieValue);

  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  await context.addCookies([{ name: 'ruah_session', value: cookieValue, url: baseUrl }]);
  const page = await context.newPage();
  const diagnostics = [];

  page.on('pageerror', (error) => {
    diagnostics.push(`pageerror: ${String(error)} @ ${page.url()}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      diagnostics.push(`console.error: ${msg.text()}`);
    }
  });
  page.on('requestfailed', (request) => {
    const errorText = request.failure()?.errorText ?? 'unknown_error';
    if (!errorText.includes('ERR_ABORTED')) {
      diagnostics.push(`request.failed: ${request.method()} ${request.url()} -> ${errorText}`);
    }
  });

  const steps = [];
  try {
    await gotoAndAssert(page, roleSuite.home, roleSuite.home, `${roleSuite.id}: home`);
    steps.push(`home ${roleSuite.home}`);

    await clickAndAssert(page, roleSuite.dashboardCta, roleSuite.dashboardCta, `${roleSuite.id}: dashboard cta`);
    steps.push(`cta ${roleSuite.dashboardCta}`);

    await gotoAndAssert(page, roleSuite.secondary, roleSuite.secondary, `${roleSuite.id}: secondary`);
    steps.push(`secondary ${roleSuite.secondary}`);

    for (const route of roleSuite.extraAllowed ?? []) {
      await gotoAndAssert(page, route, route, `${roleSuite.id}: allowed route`);
      steps.push(`allowed ${route}`);
    }

    await gotoAndAssert(page, roleSuite.negative, roleSuite.negativeResolved, `${roleSuite.id}: blocked route`);
    steps.push(`blocked ${roleSuite.negative} -> ${roleSuite.negativeResolved}`);

    return { suite: roleSuite.id, steps, diagnostics };
  } finally {
    await context.close();
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const report = { passed: [], failed: [] };
  const diagnostics = [];

  for (const roleSuite of ROLE_SUITES) {
    try {
      const result = await runRoleSuite(browser, roleSuite);
      report.passed.push({ suite: result.suite, steps: result.steps });
      diagnostics.push(...result.diagnostics.map((item) => `${roleSuite.id}: ${item}`));
    } catch (error) {
      report.failed.push({ suite: roleSuite.id, error: String(error) });
    }
  }

  await browser.close();

  if (diagnostics.length > 0) {
    report.diagnostics = diagnostics;
  }

  console.log(JSON.stringify(report, null, 2));
  if (report.failed.length > 0) process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
