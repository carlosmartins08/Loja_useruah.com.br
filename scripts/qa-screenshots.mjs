import { chromium, devices } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3100';
const outDir = path.resolve('artifacts', 'qa-screens');

const routes = [
  { name: 'home', path: '/' },
  { name: 'shop', path: '/shop' },
  { name: 'product', path: '/product/1' },
  { name: 'category', path: '/category/autoral' },
  { name: 'cart', path: '/cart' },
  { name: 'account', path: '/account' },
  { name: 'journal', path: '/journal' },
  { name: 'about', path: '/quem-somos' },
  { name: 'success', path: '/success' },
];

async function captureSet(context, suffix) {
  for (const route of routes) {
    const page = await context.newPage();
    await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(outDir, `${route.name}-${suffix}.png`),
      fullPage: true,
    });
    await page.close();
  }
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 2200 } });
  await captureSet(desktop, 'desktop');
  await desktop.close();

  const mobile = await browser.newContext({ ...devices['iPhone 14'] });
  await captureSet(mobile, 'mobile');
  await mobile.close();

  await browser.close();
  console.log(`Screenshots generated in: ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
