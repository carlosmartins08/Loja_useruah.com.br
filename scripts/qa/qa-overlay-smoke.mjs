import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3100';
const artifactDir = path.resolve('artifacts', 'qa-overlays');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function saveScreenshot(page, name) {
  await fs.mkdir(artifactDir, { recursive: true });
  await page.screenshot({ path: path.join(artifactDir, `${name}.png`), fullPage: false });
}

async function desktopSearchOverlay(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.locator('#btn-search').click();

    const dialog = page.locator('[aria-label="Busca guiada"]');
    await dialog.waitFor({ state: 'visible' });

    const box = await dialog.boundingBox();
    assert(box && Math.abs(box.y) <= 1, `search overlay expected y=0, got ${box?.y ?? 'null'}`);
    assert(box && Math.abs(box.height - 900) <= 1, `search overlay expected full viewport height, got ${box?.height ?? 'null'}`);

    await saveScreenshot(page, 'search-overlay-open');

    await dialog.getByRole('button', { name: /Camiseta/i }).first().click();
    await page.waitForURL('**/product/*', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    assert((await page.locator('[aria-label="Busca guiada"]').count()) === 0, 'search overlay should be closed after navigation');
  } finally {
    await context.close();
  }
}

async function desktopStyleGuide(browser) {
  const context = await browser.newContext({ viewport: { width: 1651, height: 946 } });
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.locator('[data-guide-trigger="true"]').click();

    const dialog = page.locator('[aria-label="Guia de estilo UseRuah"]');
    await dialog.waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Cotidiano' }).click();
    await page.getByRole('button', { name: 'Respiro' }).click();
    await page.getByRole('button', { name: 'Ver detalhes do produto' }).waitFor({ state: 'visible' });

    const box = await dialog.boundingBox();
    assert(box && box.y >= 0, `style guide expected modal within viewport, got y=${box?.y ?? 'null'}`);

    await saveScreenshot(page, 'style-guide-open');

    await page.getByRole('button', { name: 'Ver detalhes do produto' }).click();
    await page.waitForURL('**/product/5', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    assert((await page.locator('[aria-label="Guia de estilo UseRuah"]').count()) === 0, 'style guide should be closed after navigation');
  } finally {
    await context.close();
  }
}

async function mobileMenu(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.locator('#btn-mobile-menu').click();

    const dialog = page.locator('[aria-label="Menu principal mobile"]');
    await dialog.waitFor({ state: 'visible' });
    await page.waitForTimeout(1200);

    const box = await dialog.boundingBox();
    assert(box && Math.abs(box.x) <= 1, `mobile menu expected x=0 after animation, got ${box?.x ?? 'null'}`);

    await saveScreenshot(page, 'mobile-menu-open');

    await dialog.getByRole('button', { name: /Catalogo completo/i }).click();
    await page.waitForURL('**/shop', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    assert((await page.locator('[aria-label="Menu principal mobile"]').count()) === 0, 'mobile menu should be closed after navigation');
  } finally {
    await context.close();
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const report = { passed: [], failed: [] };

  const suites = [
    ['desktop_search_overlay', desktopSearchOverlay],
    ['desktop_style_guide', desktopStyleGuide],
    ['mobile_menu', mobileMenu],
  ];

  for (const [name, suite] of suites) {
    try {
      await suite(browser);
      report.passed.push(name);
    } catch (error) {
      report.failed.push({ suite: name, error: String(error) });
    }
  }

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
  if (report.failed.length > 0) process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
