import { existsSync } from 'node:fs';
import { join } from 'node:path';

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3349';
const qaIdentityPassword = String(process.env.QA_IDENTITY_PASSWORD ?? '');
const activeAgentPlanPath = join(process.cwd(), '.tmp-store', 'active-agent-plan.json');

const QA_USERS = {
  curator: { email: 'qa-curator@useruah.local', expectedRole: 'curator' },
  artist: { email: 'qa-artist@useruah.local', expectedRole: 'artist' },
};

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

const CATEGORY_SLUGS = {
  Autoral: 'autoral',
  Campanhas: 'campanhas',
  Fardamento: 'fardamento',
  'Acess\u00f3rios': 'acessorios',
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertGatePath(pathname) {
  const normalizedPath = pathname.toLowerCase();
  const forbiddenPath = FORBIDDEN_PATH_TOKENS.find((token) => normalizedPath.includes(token));
  assert(!forbiddenPath, `QA_CATALOG_LIFECYCLE_FORBIDDEN_ENDPOINT:${forbiddenPath}`);

  const isAllowed =
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/session' ||
    pathname === '/api/catalog-items' ||
    pathname === '/api/catalog-items/bootstrap' ||
    /^\/api\/catalog-items\/[^/]+\/(ready|publish|unpublish|reopen)$/.test(pathname) ||
    pathname === '/shop' ||
    /^\/product\/[^/]+$/.test(pathname) ||
    /^\/category\/[^/]+$/.test(pathname);

  assert(isAllowed, `QA_CATALOG_LIFECYCLE_ENDPOINT_NOT_ALLOWED:${pathname}`);
}

async function req(method, pathname, body, options = {}) {
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

async function loginQaUser(user) {
  assert(qaIdentityPassword, 'QA_IDENTITY_PASSWORD_REQUIRED');
  const login = await req('POST', '/api/auth/login', { email: user.email, password: qaIdentityPassword });
  assert(login.status === 200, `${user.expectedRole} login expected 200, got ${login.status}`);
  assert(login.data?.session?.activeRole === user.expectedRole, `${user.expectedRole} activeRole mismatch`);

  const match = login.setCookie.match(/ruah_session=([^;]+)/);
  assert(match?.[1], `${user.expectedRole} ruah_session cookie missing after login`);
  const cookie = `ruah_session=${match[1]}`;
  const session = await req('GET', '/api/auth/session', undefined, { headers: { cookie } });
  assert(session.status === 200, `${user.expectedRole} session expected 200, got ${session.status}`);
  assert(session.data?.authenticated === true, `${user.expectedRole} session should be authenticated`);
  assert(session.data?.session?.activeRole === user.expectedRole, `${user.expectedRole} session role mismatch`);
  return { cookie };
}

function resolveCategorySlug(category) {
  const slug = CATEGORY_SLUGS[category];
  assert(slug, `QA_CATALOG_LIFECYCLE_UNSUPPORTED_CATEGORY:${String(category)}`);
  return slug;
}

function assertRuntimeIsolation() {
  assert(process.env.QA_REQUIRE_ISOLATED_DATABASE === 'true', 'QA_CATALOG_LIFECYCLE_ISOLATED_DATABASE_REQUIRED');
  assert(process.env.PAYMENT_PERSISTENCE === 'mysql', 'QA_CATALOG_LIFECYCLE_MYSQL_REQUIRED');
  assert(process.env.QA_NEXT_DIST_DIR === '.tmp-store/qa-next-catalog-lifecycle', 'QA_CATALOG_LIFECYCLE_ISOLATED_NEXT_REQUIRED');
  assert(process.env.ALLOW_HEADER_ACTOR_FALLBACK !== 'true', 'QA_CATALOG_LIFECYCLE_HEADER_FALLBACK_FORBIDDEN');
  assert(!existsSync(activeAgentPlanPath), 'QA_CATALOG_LIFECYCLE_ACTIVE_AGENT_PLAN_MUST_BE_ABSENT');
}

async function assertPublicVisibility(item, shouldBeVisible, phase) {
  const categorySlug = resolveCategorySlug(item.category);
  const catalog = await req('GET', '/api/catalog-items');
  assert(catalog.status === 200, `${phase} public catalog expected 200, got ${catalog.status}`);
  const inCatalog = Array.isArray(catalog.data?.items) && catalog.data.items.some((row) => row.catalogItemId === item.catalogItemId);
  assert(inCatalog === shouldBeVisible, `${phase} public catalog visibility mismatch`);

  const shop = await req('GET', '/shop');
  assert(shop.status === 200, `${phase} shop expected 200, got ${shop.status}`);
  const inShop = typeof shop.data === 'string' && shop.data.includes(item.name);
  assert(inShop === shouldBeVisible, `${phase} shop visibility mismatch`);

  const product = await req('GET', `/product/${item.catalogItemId}`);
  if (shouldBeVisible) {
    assert(product.status === 200, `${phase} product expected 200, got ${product.status}`);
    assert(typeof product.data === 'string' && product.data.includes(item.name), `${phase} product missing catalog item`);
  } else {
    assert(product.status === 404, `${phase} product expected 404, got ${product.status}`);
  }

  const category = await req('GET', `/category/${categorySlug}`);
  assert(category.status === 200, `${phase} category expected 200, got ${category.status}`);
  const inCategory = typeof category.data === 'string' && category.data.includes(item.name);
  assert(inCategory === shouldBeVisible, `${phase} category visibility mismatch`);
}

async function run() {
  const report = [];
  assertRuntimeIsolation();

  const curator = await loginQaUser(QA_USERS.curator);
  const artist = await loginQaUser(QA_USERS.artist);
  const curatorHeaders = { cookie: curator.cookie };
  const artistHeaders = { cookie: artist.cookie };
  report.push('CAT-LIFE-01 curator authenticated by ruah_session');

  const unauthorizedBootstrap = await req('POST', '/api/catalog-items/bootstrap', {}, { headers: artistHeaders });
  assert(unauthorizedBootstrap.status === 403, `unauthorized actor bootstrap expected 403, got ${unauthorizedBootstrap.status}`);
  report.push('CAT-LIFE-02 unauthorized artist cannot manage catalog lifecycle');

  const anonymousBootstrap = await req('POST', '/api/catalog-items/bootstrap', {});
  assert(anonymousBootstrap.status === 403, `anonymous bootstrap expected 403 under current catalog contract, got ${anonymousBootstrap.status}`);
  report.push('CAT-LIFE-03 anonymous actor cannot manage catalog lifecycle (403 by current contract)');

  const bootstrap = await req('POST', '/api/catalog-items/bootstrap', {}, { headers: curatorHeaders });
  assert(bootstrap.status === 200, `bootstrap expected 200, got ${bootstrap.status}`);
  const catalogItemId = bootstrap.data?.results?.[0]?.catalogItemId;
  assert(typeof catalogItemId === 'string' && catalogItemId.length > 0, 'bootstrap catalogItemId missing');

  const publishedCatalog = await req('GET', '/api/catalog-items');
  assert(publishedCatalog.status === 200, `published catalog expected 200, got ${publishedCatalog.status}`);
  const item = Array.isArray(publishedCatalog.data?.items)
    ? publishedCatalog.data.items.find((row) => row.catalogItemId === catalogItemId)
    : null;
  assert(item?.name && item?.category, 'bootstrap item missing from public catalog');
  await assertPublicVisibility(item, true, 'published');
  report.push('CAT-LIFE-04 item published and visible in public catalog, shop, product and category surfaces');

  const unpublish = await req('POST', `/api/catalog-items/${catalogItemId}/unpublish`, { reason: 'qa_lifecycle_archive' }, { headers: curatorHeaders });
  assert(unpublish.status === 200, `unpublish expected 200, got ${unpublish.status}`);
  assert(unpublish.data?.item?.publicationStatus === 'archived', 'unpublish should archive catalog item');
  await assertPublicVisibility(item, false, 'archived');
  report.push('CAT-LIFE-05 unpublish archives item and removes it from public catalog surfaces');

  const reopen = await req('POST', `/api/catalog-items/${catalogItemId}/reopen`, { reason: 'qa_lifecycle_reopen' }, { headers: curatorHeaders });
  assert(reopen.status === 200, `reopen expected 200, got ${reopen.status}`);
  assert(reopen.data?.item?.publicationStatus === 'draft', 'reopen should return catalog item to draft');
  await assertPublicVisibility(item, false, 'draft');
  report.push('CAT-LIFE-06 reopen returns item to draft without public visibility');

  const ready = await req('POST', `/api/catalog-items/${catalogItemId}/ready`, { reason: 'qa_lifecycle_ready' }, { headers: curatorHeaders });
  assert(ready.status === 200, `ready expected 200, got ${ready.status}`);
  assert(ready.data?.item?.publicationStatus === 'ready', 'ready should set catalog item to ready');
  await assertPublicVisibility(item, false, 'ready');
  report.push('CAT-LIFE-07 ready transition succeeds without public overexposure');

  const publish = await req('POST', `/api/catalog-items/${catalogItemId}/publish`, { reason: 'qa_lifecycle_republish' }, { headers: curatorHeaders });
  assert(publish.status === 200, `republish expected 200, got ${publish.status}`);
  assert(publish.data?.item?.publicationStatus === 'published', 'republish should set catalog item to published');
  await assertPublicVisibility(item, true, 'republished');
  report.push('CAT-LIFE-08 publish restores item to public catalog surfaces');

  assert(!existsSync(activeAgentPlanPath), 'QA_CATALOG_LIFECYCLE_ACTIVE_AGENT_PLAN_CREATED');
  report.push('CAT-LIFE-09 lifecycle required isolated MySQL QA and isolated Next artifact');
  report.push('CAT-LIFE-10 allowlist enforced and no forbidden financial/referral/attribution route was called');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, catalogItemId, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
