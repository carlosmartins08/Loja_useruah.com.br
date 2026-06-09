import { chromium } from 'playwright';

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3100';

async function assertVisible(page, locator, label) {
  const el = page.locator(locator).first();
  await el.waitFor({ state: 'visible', timeout: 15000 });
  return label;
}

async function testGuestNavigation(page) {
  const results = [];
  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  results.push(await assertVisible(page, '#main-header', 'Header renderizado'));
  await page.click('a[href="/shop"]:has-text("Transformar")');
  await page.waitForURL('**/shop', { timeout: 15000 });
  results.push('Navegação Home -> Shop');

  await page.click('a[href="/account"]');
  await page.waitForURL((url) => url.pathname === '/account' || url.pathname === '/login', { timeout: 15000 });
  results.push('Navegação Shop -> Account/Login');
  return results;
}

async function testShopActions(page) {
  const results = [];
  await page.goto(`${baseUrl}/shop`, { waitUntil: 'domcontentloaded' });
  await page.click('button:has-text("Autoral"), button:has-text("AUTORAL")');
  results.push('Filtro categoria autoral clicável');

  const segmentButtons = page.locator('button:has-text("COLEÇÃO"), button:has-text("AUTORAL")');
  const segmentCount = await segmentButtons.count();
  if (segmentCount > 0) {
    await segmentButtons.first().click();
    results.push('Segmento de coleção clicável');
  }

  const addBtn = page.locator('button:has-text("Adicionar à sacola"), button:has-text("Adicionar"), button:has-text("ADICIONAR")').first();
  await addBtn.click();
  await page.goto(`${baseUrl}/cart`, { waitUntil: 'domcontentloaded' });
  results.push(await assertVisible(page, 'a[href="/checkout"]', 'Carrinho renderiza CTA de checkout'));
  return results;
}

async function testAccountFlows(page) {
  const results = [];
  await page.goto(`${baseUrl}/account`, { waitUntil: 'domcontentloaded' });
  if (page.url().includes('/login')) {
    results.push('Conta sem sessão redireciona para login (comportamento esperado)');
    return results;
  }
  results.push(await assertVisible(page, 'main h1, h1', 'Dashboard de conta renderiza'));

  const ordersLink = page.locator('a[href="/account/orders"]').first();
  if ((await ordersLink.count()) > 0) {
    await ordersLink.click();
    await page.waitForURL('**/account/orders', { timeout: 15000 });
    results.push('Menu conta -> Pedidos');
  } else {
    results.push('Menu conta -> Pedidos (não aplicável neste layout)');
  }

  const addressesLink = page.locator('a[href="/account/addresses"]').first();
  if ((await addressesLink.count()) > 0) {
    await addressesLink.click();
    await page.waitForURL('**/account/addresses', { timeout: 15000 });
    results.push('Menu conta -> Endereços');
  } else {
    results.push('Menu conta -> Endereços (não aplicável neste layout)');
  }
  return results;
}

async function testCategoryToProduct(page) {
  const results = [];
  await page.goto(`${baseUrl}/category/autoral`, { waitUntil: 'domcontentloaded' });
  results.push(await assertVisible(page, 'h1', 'Categoria renderizada'));

  await page.locator('a[href^="/product/"]').first().click();
  await page.waitForURL('**/product/*', { timeout: 15000 });
  results.push(await assertVisible(page, 'h1:has-text("Respiro"), h1', 'Produto abriu a partir da categoria'));
  return results;
}

async function testCheckoutFlow(page) {
  const results = [];
  await page.goto(`${baseUrl}/checkout`, { waitUntil: 'domcontentloaded' });
  results.push(
    await assertVisible(
      page,
      'h2:has-text("Handover de Entrega"), h1:has-text("Seu carrinho está vazio"), h1:has-text("Seu carrinho esta vazio")',
      'Página de checkout renderiza'
    )
  );
  return results;
}

async function testMobileNavFlows(browser) {
  const results = [];
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  results.push(await assertVisible(page, '#main-header', 'Home mobile renderiza header'));
  await page.goto(`${baseUrl}/shop`, { waitUntil: 'domcontentloaded' });
  results.push(await assertVisible(page, 'h1', 'Shop mobile renderiza'));
  await page.goto(`${baseUrl}/account`, { waitUntil: 'domcontentloaded' });
  results.push('Mobile alcança rota de conta');

  await context.close();
  return results;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const report = { passed: [], failed: [] };
  const diagnostics = [];

  page.on('pageerror', (error) => {
    diagnostics.push(`pageerror: ${String(error)} @ ${page.url()}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const location = msg.location();
      const at = location?.url ? ` @ ${location.url}:${location.lineNumber ?? 0}:${location.columnNumber ?? 0}` : '';
      diagnostics.push(`console.error: ${msg.text()}${at}`);
    }
  });
  page.on('requestfailed', (request) => {
    const errorText = request.failure()?.errorText ?? 'unknown_error';
    if (errorText.includes('ERR_ABORTED')) return;
    diagnostics.push(`request.failed: ${request.method()} ${request.url()} -> ${errorText}`);
  });

  const suites = [
    ['guest_navigation', testGuestNavigation],
    ['shop_actions', testShopActions],
    ['account_flows', testAccountFlows],
    ['category_to_product', testCategoryToProduct],
    ['checkout_flow', testCheckoutFlow],
  ];

  for (const [name, suite] of suites) {
    try {
      const steps = await suite(page);
      report.passed.push({ suite: name, steps });
    } catch (error) {
      report.failed.push({ suite: name, error: String(error) });
    }
  }

  try {
    const steps = await testMobileNavFlows(browser);
    report.passed.push({ suite: 'mobile_nav_flows', steps });
  } catch (error) {
    report.failed.push({ suite: 'mobile_nav_flows', error: String(error) });
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

