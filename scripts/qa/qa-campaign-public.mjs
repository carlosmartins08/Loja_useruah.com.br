import { ensureQaEnvLoaded } from '../lib/qa-env.mjs';
import { resolveSeededCatalogVariant } from '../lib/catalog-seed-helpers.mjs';

ensureQaEnvLoaded();

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3340';
const qaIdentityPassword = String(process.env.QA_IDENTITY_PASSWORD ?? '');
const QA_USERS = {
  curator: { email: 'qa-curator@useruah.local', expectedRole: 'curator' },
  community: { email: 'qa-community-manager@useruah.local', expectedRole: 'community_manager' },
  admin: { email: 'qa-platform-admin@useruah.local', expectedRole: 'platform_admin' },
};
const FORBIDDEN_PATH_PREFIXES = [
  '/api/orders',
  '/api/payments',
  '/api/webhooks',
  '/api/affiliate',
  '/api/terms/accept',
  '/af/',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertPublicGatePath(pathname) {
  const forbiddenPath = FORBIDDEN_PATH_PREFIXES.find((prefix) => pathname.startsWith(prefix));
  assert(!forbiddenPath, `QA_CAMPAIGN_PUBLIC_FORBIDDEN_ENDPOINT:${forbiddenPath}`);
}

async function req(method, pathname, body, options = {}) {
  assertPublicGatePath(pathname);
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    redirect: options.redirect ?? 'follow',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data = null;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  return {
    status: response.status,
    data,
    location: response.headers.get('location'),
    setCookie: response.headers.get('set-cookie') ?? '',
  };
}

async function loginQaUser(user) {
  assert(qaIdentityPassword, 'QA_IDENTITY_PASSWORD_REQUIRED');
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: qaIdentityPassword }),
  });
  const data = await response.json().catch(() => null);
  assert(response.status === 200, `${user.expectedRole} login expected 200, got ${response.status}`);
  const match = (response.headers.get('set-cookie') ?? '').match(/ruah_session=([^;]+)/);
  assert(match?.[1], `${user.expectedRole} ruah_session cookie missing after login`);
  assert(data?.session?.activeRole === user.expectedRole, `${user.expectedRole} activeRole mismatch`);
  return { cookie: `ruah_session=${match[1]}` };
}

async function createCampaign(ownerHeaders, suffix, options = {}) {
  const create = await req(
    'POST',
    '/api/campaigns',
    {
      organizationId: `ORG-QA-CAMPAIGN-PUBLIC-${suffix}`,
      name: options.name ?? `Campanha publica ${suffix}`,
      description: options.description ?? 'Campanha usada para validar superficie publica e vitrine contextual.',
      budget: options.budget ?? 2400,
      progressivePriceRule: options.progressivePriceRule ?? '2-5=5%;6-10=10%',
    },
    { headers: ownerHeaders }
  );
  assert(create.status === 201, `campaign create expected 201, got ${create.status}`);
  const campaignId = create.data?.campaign?.campaignId;
  assert(typeof campaignId === 'string', 'campaignId missing');
  return campaignId;
}

async function activateCampaign(campaignId, ownerHeaders, adminHeaders) {
  const submit = await req('POST', `/api/campaigns/${campaignId}/submit`, {}, { headers: ownerHeaders });
  assert(submit.status === 200, `campaign submit expected 200, got ${submit.status}`);

  const queue = await req('GET', '/api/admin/impact-reviews?status=pending_review&entityType=Campaign', undefined, {
    headers: adminHeaders,
  });
  assert(queue.status === 200, `impact queue expected 200, got ${queue.status}`);
  const review = (Array.isArray(queue.data?.reviews) ? queue.data.reviews : []).find((row) => row.entityId === campaignId);
  assert(review?.reviewId, `campaign impact review not found for ${campaignId}`);

  const approveReview = await req(
    'POST',
    `/api/admin/impact-reviews/${review.reviewId}/approve`,
    { reason: 'qa public campaign approval' },
    { headers: adminHeaders }
  );
  assert(approveReview.status === 200, `impact review approve expected 200, got ${approveReview.status}`);

  const activate = await req('POST', `/api/campaigns/${campaignId}/approve`, {}, { headers: adminHeaders });
  assert(activate.status === 200, `campaign activate expected 200, got ${activate.status}`);
}

async function run() {
  const report = [];
  const curatorSession = await loginQaUser(QA_USERS.curator);
  const communitySession = await loginQaUser(QA_USERS.community);
  const adminSession = await loginQaUser(QA_USERS.admin);
  const curatorHeaders = { cookie: curatorSession.cookie };
  const ownerHeaders = { cookie: communitySession.cookie };
  const adminHeaders = { cookie: adminSession.cookie };
  const suffix = Date.now();

  const seed = await req('POST', '/api/catalog-items/bootstrap', {}, { headers: curatorHeaders });
  assert(seed.status === 200 || seed.status === 201, `catalog bootstrap expected 200|201, got ${seed.status}`);
  const seeded = await resolveSeededCatalogVariant(baseUrl);
  const catalogList = await req('GET', '/api/catalog-items');
  assert(catalogList.status === 200, `catalog list expected 200, got ${catalogList.status}`);
  const catalogItems = Array.isArray(catalogList.data?.items) ? catalogList.data.items : [];
  const unlinkedCatalogItem = catalogItems.find((item) => item.catalogItemId !== seeded.item.catalogItemId);
  assert(unlinkedCatalogItem?.catalogItemId, 'expected another published catalog item for campaign edge case');
  report.push(`QA-CAMPAIGN-PUBLIC-00 catalog prepared with linked=${seeded.item.catalogItemId} and unlinked=${unlinkedCatalogItem.catalogItemId}`);

  const activeCampaignId = await createCampaign(ownerHeaders, `${suffix}-active`);
  const link = await req(
    'POST',
    `/api/campaigns/${activeCampaignId}/products`,
    { catalogItemId: seeded.item.catalogItemId },
    { headers: ownerHeaders }
  );
  assert(link.status === 200 || link.status === 201, `campaign product link expected 200|201, got ${link.status}`);
  await activateCampaign(activeCampaignId, ownerHeaders, adminHeaders);
  report.push('QA-CAMPAIGN-PUBLIC-01 active campaign created with linked published product');

  const inactiveCampaignId = await createCampaign(ownerHeaders, `${suffix}-inactive`, {
    name: `Campanha inativa ${suffix}`,
    description: 'Campanha mantida como rascunho para validar indisponibilidade publica.',
  });
  const emptyCampaignId = await createCampaign(ownerHeaders, `${suffix}-empty`, {
    name: `Campanha vazia ${suffix}`,
    description: 'Campanha ativa sem produtos publicados vinculados.',
  });
  await activateCampaign(emptyCampaignId, ownerHeaders, adminHeaders);
  report.push('QA-CAMPAIGN-PUBLIC-02 inactive and empty campaigns prepared');

  const publicApi = await req('GET', `/api/campaigns/${activeCampaignId}/public`);
  assert(publicApi.status === 200, `public campaign api expected 200, got ${publicApi.status}`);
  assert(publicApi.data?.state === 'active', `public api state expected active, got ${String(publicApi.data?.state)}`);
  assert(publicApi.data?.storefront?.isActive === true, 'public api storefront should be active');
  assert(Array.isArray(publicApi.data?.products) && publicApi.data.products.some((row) => row.catalogItemId === seeded.item.catalogItemId), 'public api preview should include linked product');
  report.push('QA-CAMPAIGN-PUBLIC-03 anonymous public API exposes active context and preview');

  const activePage = await req('GET', `/c/${activeCampaignId}`);
  assert(activePage.status === 200, `public campaign page expected 200, got ${activePage.status}`);
  assert(typeof activePage.data === 'string' && activePage.data.includes(`Campanha publica ${suffix}-active`), 'public campaign page missing campaign name');
  assert(activePage.data.includes(seeded.item.name), 'public campaign page missing linked product preview');

  const openStorefront = await req('GET', `/c/${activeCampaignId}/shop`, undefined, { redirect: 'manual' });
  assert(openStorefront.status === 307, `campaign storefront route expected 307, got ${openStorefront.status}`);
  assert(openStorefront.location === `${baseUrl}/shop?campaignId=${activeCampaignId}`, `campaign storefront location mismatch: ${openStorefront.location}`);
  assert(openStorefront.setCookie.includes(`ruah_campaign_id=${activeCampaignId}`), 'campaign storefront cookie missing');
  report.push('QA-CAMPAIGN-PUBLIC-04 anonymous storefront route sets contextual cookie and redirects');

  const notFoundApi = await req('GET', '/api/campaigns/CMP-NOT-FOUND/public');
  assert(notFoundApi.status === 404, `public campaign api not_found expected 404, got ${notFoundApi.status}`);
  assert(notFoundApi.data?.state === 'not_found', `public api not_found state expected not_found, got ${String(notFoundApi.data?.state)}`);
  const notFoundPage = await req('GET', '/c/CMP-NOT-FOUND', undefined, { redirect: 'manual' });
  assert(notFoundPage.status === 404, `public campaign page not_found expected 404, got ${notFoundPage.status}`);

  const inactiveApi = await req('GET', `/api/campaigns/${inactiveCampaignId}/public`);
  assert(inactiveApi.status === 200, `inactive public api expected 200, got ${inactiveApi.status}`);
  assert(inactiveApi.data?.state === 'inactive', `inactive public api state expected inactive, got ${String(inactiveApi.data?.state)}`);
  assert(Array.isArray(inactiveApi.data?.products) && inactiveApi.data.products.length === 0, 'inactive public api should not expose product preview');
  const inactivePage = await req('GET', `/c/${inactiveCampaignId}`);
  assert(inactivePage.status === 200, `inactive campaign page expected 200, got ${inactivePage.status}`);
  assert(typeof inactivePage.data === 'string' && inactivePage.data.includes('Campanha fora do ar.'), 'inactive campaign page missing unavailable state');
  const inactiveStorefront = await req('GET', `/c/${inactiveCampaignId}/shop`, undefined, { redirect: 'manual' });
  assert(inactiveStorefront.status === 307, `inactive storefront route expected 307, got ${inactiveStorefront.status}`);
  assert(inactiveStorefront.location === `${baseUrl}/shop`, `inactive storefront should fallback to shop, got ${inactiveStorefront.location}`);
  assert(inactiveStorefront.setCookie.includes('ruah_campaign_id='), 'inactive storefront should clear campaign cookie');
  report.push('QA-CAMPAIGN-PUBLIC-05 anonymous routes preserve unavailable campaign states');

  const invalidShop = await req('GET', '/shop?campaignId=CMP-NOT-FOUND');
  assert(invalidShop.status === 200, `invalid campaign shop expected 200, got ${invalidShop.status}`);
  assert(typeof invalidShop.data === 'string' && invalidShop.data.includes('Campanha não encontrada.'), 'invalid campaign shop should show unavailable state');
  assert(!invalidShop.data.includes(seeded.item.name), 'invalid campaign shop should not fall back silently to catalog preview');
  const inactiveShop = await req('GET', `/shop?campaignId=${inactiveCampaignId}`);
  assert(inactiveShop.status === 200, `inactive campaign shop expected 200, got ${inactiveShop.status}`);
  assert(typeof inactiveShop.data === 'string' && inactiveShop.data.includes('Campanha indisponível.'), 'inactive campaign shop should show inactive state');
  const emptyShop = await req('GET', `/shop?campaignId=${emptyCampaignId}`);
  assert(emptyShop.status === 200, `empty campaign shop expected 200, got ${emptyShop.status}`);
  assert(typeof emptyShop.data === 'string' && emptyShop.data.includes('Nenhum produto encontrado.'), 'empty campaign shop should show empty state');
  assert(!emptyShop.data.includes(seeded.item.name), 'empty campaign shop should not fall back to general catalog');
  report.push('QA-CAMPAIGN-PUBLIC-06 anonymous shop distinguishes invalid, inactive and empty storefronts');

  const explicitMismatchProduct = await req('GET', `/product/${unlinkedCatalogItem.catalogItemId}?campaignId=${activeCampaignId}`, undefined, {
    redirect: 'manual',
  });
  assert(explicitMismatchProduct.status === 307, `explicit mismatched product expected 307, got ${explicitMismatchProduct.status}`);
  assert(
    explicitMismatchProduct.location === `${baseUrl}/shop?campaignId=${activeCampaignId}` ||
      explicitMismatchProduct.location === `/shop?campaignId=${activeCampaignId}`,
    `mismatched product should redirect to contextual shop, got ${explicitMismatchProduct.location}`
  );
  const invalidCookieProduct = await req('GET', `/product/${seeded.item.catalogItemId}`, undefined, {
    headers: { cookie: 'ruah_campaign_id=CMP-NOT-FOUND' },
  });
  assert(invalidCookieProduct.status === 200, `cookie-invalid product expected 200, got ${invalidCookieProduct.status}`);
  assert(typeof invalidCookieProduct.data === 'string' && invalidCookieProduct.data.includes(seeded.item.name), 'product page should remain generic when campaign cookie is invalid');
  report.push('QA-CAMPAIGN-PUBLIC-07 anonymous PDP distinguishes explicit mismatch from stale context');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, activeCampaignId, inactiveCampaignId, emptyCampaignId, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
