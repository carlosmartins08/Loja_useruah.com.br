import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3345';
const qaIdentityPassword = String(process.env.QA_IDENTITY_PASSWORD ?? '');
const restartUrl = String(process.env.QA_CONTROLLED_RESTART_URL ?? '');
const restartToken = String(process.env.QA_CONTROLLED_RESTART_TOKEN ?? '');
const catalogStorePath = join(process.cwd(), '.tmp-store', 'catalog-items.json');
const QA_CURATOR = { email: 'qa-curator@useruah.local', expectedRole: 'curator' };
const FORBIDDEN_PATH_TOKENS = [
  '/api/orders',
  '/api/payments',
  '/api/payment',
  '/api/webhook',
  '/webhook',
  '/api/production-jobs',
  '/production',
  '/ship',
  '/shipment',
  '/api/affiliate',
  '/api/referral',
  '/af/',
  'attribution',
  'payout',
  'dimona',
  'checkout',
  'cart',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertGatePath(pathname) {
  const normalizedPath = pathname.toLowerCase();
  const forbiddenPath = FORBIDDEN_PATH_TOKENS.find((token) => normalizedPath.includes(token));
  assert(!forbiddenPath, `QA_CATALOG_AUTHORITY_FORBIDDEN_ENDPOINT:${forbiddenPath}`);

  const isAllowed =
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/session' ||
    pathname === '/api/catalog-items' ||
    pathname === '/api/catalog-items/bootstrap' ||
    /^\/api\/catalog-items\/[^/]+\/(ready|publish|unpublish|reopen)$/.test(pathname) ||
    pathname === '/shop' ||
    /^\/product\/[^/]+$/.test(pathname) ||
    /^\/category\/[^/]+$/.test(pathname);

  assert(isAllowed, `QA_CATALOG_AUTHORITY_ENDPOINT_NOT_ALLOWED:${pathname}`);
}

async function request(method, pathname, body, options = {}) {
  assertGatePath(pathname);
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await response.json().catch(() => null) : await response.text().catch(() => null);
  return { status: response.status, data, setCookie: response.headers.get('set-cookie') ?? '' };
}

async function loginQaCurator() {
  assert(qaIdentityPassword, 'QA_IDENTITY_PASSWORD_REQUIRED');
  const login = await request('POST', '/api/auth/login', { email: QA_CURATOR.email, password: qaIdentityPassword });
  assert(login.status === 200, `curator login expected 200, got ${login.status}`);
  assert(login.data?.session?.activeRole === QA_CURATOR.expectedRole, 'curator activeRole mismatch');
  const match = login.setCookie.match(/ruah_session=([^;]+)/);
  assert(match?.[1], 'curator ruah_session cookie missing after login');

  const cookie = `ruah_session=${match[1]}`;
  const session = await request('GET', '/api/auth/session', undefined, { headers: { cookie } });
  assert(session.status === 200 && session.data?.authenticated === true, 'curator session expected authenticated response');
  assert(session.data?.session?.activeRole === QA_CURATOR.expectedRole, 'curator session role mismatch');
  return { cookie };
}

function readLocalCatalogSnapshot() {
  return existsSync(catalogStorePath) ? readFileSync(catalogStorePath) : null;
}

function writeStaleLocalCatalog() {
  mkdirSync(join(process.cwd(), '.tmp-store'), { recursive: true });
  writeFileSync(
    catalogStorePath,
    JSON.stringify({ '1': { catalogItemId: '1', name: 'STALE_LOCAL_ONLY_CATALOG' } }, null, 2),
    'utf8'
  );
}

function restoreLocalCatalog(snapshot) {
  if (snapshot === null) {
    if (existsSync(catalogStorePath)) unlinkSync(catalogStorePath);
    return;
  }
  writeFileSync(catalogStorePath, snapshot);
}

async function requestControlledRestart() {
  assert(restartUrl && restartToken, 'QA_CONTROLLED_RESTART_NOT_AVAILABLE');
  const parsedRestartUrl = new URL(restartUrl);
  assert(parsedRestartUrl.protocol === 'http:' && parsedRestartUrl.hostname === '127.0.0.1', 'QA_CONTROLLED_RESTART_MUST_BE_LOCAL');
  const response = await fetch(restartUrl, {
    method: 'POST',
    headers: { 'x-qa-controlled-restart-token': restartToken },
  });
  assert(response.status === 200, `controlled restart expected 200, got ${response.status}`);
  const data = await response.json().catch(() => null);
  assert(data?.ok === true, 'controlled restart did not confirm success');
}

async function run() {
  const report = [];
  let localSnapshot = null;

  try {
    const curator = await loginQaCurator();
    report.push('CAT-AUTH-01 curator authenticated by ruah_session');

    const bootstrap = await request('POST', '/api/catalog-items/bootstrap', {}, { headers: { cookie: curator.cookie } });
    assert(bootstrap.status === 200, `bootstrap expected 200, got ${bootstrap.status}`);
    const catalogItemId = bootstrap.data?.results?.[0]?.catalogItemId;
    assert(typeof catalogItemId === 'string', 'bootstrap catalogItemId missing');

    const catalogBeforeRestart = await request('GET', '/api/catalog-items');
    assert(catalogBeforeRestart.status === 200, `catalog before restart expected 200, got ${catalogBeforeRestart.status}`);
    const canonicalItem = catalogBeforeRestart.data?.items?.find((item) => item.catalogItemId === catalogItemId);
    assert(canonicalItem?.name, 'canonical catalog item missing before restart');
    report.push('CAT-AUTH-02 MySQL QA catalog bootstrap and public read completed before restart');

    localSnapshot = readLocalCatalogSnapshot();
    writeStaleLocalCatalog();
    await requestControlledRestart();
    report.push('CAT-AUTH-03 runner completed controlled Next restart over the same isolated build');

    const catalogAfterRestart = await request('GET', '/api/catalog-items');
    assert(catalogAfterRestart.status === 200, `catalog after restart expected 200, got ${catalogAfterRestart.status}`);
    const itemAfterRestart = catalogAfterRestart.data?.items?.find((item) => item.catalogItemId === catalogItemId);
    assert(itemAfterRestart?.name === canonicalItem.name, 'catalog item changed after restart');
    assert(itemAfterRestart.name !== 'STALE_LOCAL_ONLY_CATALOG', 'MySQL catalog read fell back to stale local cache');
    report.push('CAT-AUTH-04 MySQL QA catalog persisted across restart and defeated stale local cache');

    console.log(JSON.stringify({ status: 'PASS', baseUrl, catalogItemId, report }, null, 2));
  } finally {
    restoreLocalCatalog(localSnapshot);
  }
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
