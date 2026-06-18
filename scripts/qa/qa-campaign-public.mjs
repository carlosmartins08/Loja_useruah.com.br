import { ensureQaEnvLoaded } from '../lib/qa-env.mjs';
import { postBootstrap, resolveSeededCatalogVariant } from '../lib/catalog-seed-helpers.mjs';

ensureQaEnvLoaded();

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3340';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function req(method, pathname, body, options = {}) {
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
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  return {
    status: response.status,
    data,
    location: response.headers.get('location'),
    setCookie: response.headers.get('set-cookie') ?? '',
  };
}

async function acceptConsumerTerms(customerHeaders) {
  const response = await req(
    'POST',
    '/api/terms/accept',
    {
      userId: customerHeaders['x-actor-id'],
      entityType: 'consumer',
      entityId: customerHeaders['x-actor-id'],
      termType: 'consumer_base',
      termVersion: 'v1',
    },
    { headers: customerHeaders }
  );
  assert(response.status === 200 || response.status === 201, `customer terms expected 200|201, got ${response.status}`);
}

async function resolvePendingReviewId(entityId, adminHeaders) {
  const queue = await req('GET', '/api/admin/impact-reviews?status=pending_review&entityType=Campaign', undefined, {
    headers: adminHeaders,
  });
  assert(queue.status === 200, `impact queue expected 200, got ${queue.status}`);
  const rows = Array.isArray(queue.data?.reviews) ? queue.data.reviews : [];
  const review = rows.find((row) => row.entityId === entityId);
  assert(review?.reviewId, `campaign impact review not found for ${entityId}`);
  return review.reviewId;
}

async function createCampaign(ownerHeaders, suffix, options = {}) {
  const create = await req(
    'POST',
    '/api/campaigns',
    {
      organizationId: `ORG-QA-CAMPAIGN-PUBLIC-${suffix}`,
      name: options.name ?? `Campanha pública ${suffix}`,
      description: options.description ?? 'Campanha usada para validar superfície pública, contexto e atribuição.',
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
  const reviewId = await resolvePendingReviewId(campaignId, adminHeaders);
  const approveReview = await req(
    'POST',
    `/api/admin/impact-reviews/${reviewId}/approve`,
    { reason: 'qa public campaign approval' },
    { headers: adminHeaders }
  );
  assert(approveReview.status === 200, `impact review approve expected 200, got ${approveReview.status}`);
  const activate = await req('POST', `/api/campaigns/${campaignId}/approve`, {}, { headers: adminHeaders });
  assert(activate.status === 200, `campaign activate expected 200, got ${activate.status}`);
}

async function createReferralLink(affiliateHeaders, suffix, targetPath) {
  const response = await req(
    'POST',
    '/api/affiliate/links',
    {
      label: `Campanha pública ${suffix}`,
      channel: 'instagram',
      targetPath,
      slug: `qa-campaign-public-${suffix}`,
    },
    { headers: affiliateHeaders }
  );
  assert(response.status === 201, `referral link create expected 201, got ${response.status}`);
  const link = response.data?.link;
  assert(typeof link?.referralLinkId === 'string', 'referralLinkId missing');
  assert(typeof link?.slug === 'string', 'referral slug missing');
  return link;
}

async function run() {
  const report = [];
  const suffix = Date.now();
  const ownerHeaders = { 'x-actor-id': `qa-community-public-${suffix}`, 'x-actor-role': 'community_manager' };
  const adminHeaders = { 'x-actor-id': `qa-admin-public-${suffix}`, 'x-actor-role': 'platform_admin' };
  const customerHeaders = { 'x-actor-id': `qa-customer-public-${suffix}`, 'x-actor-role': 'customer' };
  const affiliateHeaders = { 'x-actor-id': `qa-affiliate-public-${suffix}`, 'x-actor-role': 'affiliate' };

  await acceptConsumerTerms(customerHeaders);
  const seed = await postBootstrap(baseUrl);
  assert(seed.status === 200 || seed.status === 201, `catalog bootstrap expected 200|201, got ${seed.status}`);
  const seeded = await resolveSeededCatalogVariant(baseUrl);
  const catalogList = await req('GET', '/api/catalog-items');
  assert(catalogList.status === 200, `catalog list expected 200, got ${catalogList.status}`);
  const catalogItems = Array.isArray(catalogList.data?.items) ? catalogList.data.items : [];
  const unlinkedCatalogItem = catalogItems.find((item) => item.catalogItemId !== seeded.item.catalogItemId);
  assert(unlinkedCatalogItem?.catalogItemId, 'expected another published catalog item for campaign edge case');
  const unlinkedVariant = Array.isArray(unlinkedCatalogItem.variants) ? unlinkedCatalogItem.variants[0] : null;
  assert(unlinkedVariant?.variantId, 'unlinked catalog variant missing');
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
    description: 'Campanha mantida como rascunho para validar indisponibilidade pública.',
  });
  report.push('QA-CAMPAIGN-PUBLIC-02 inactive campaign created');

  const emptyCampaignId = await createCampaign(ownerHeaders, `${suffix}-empty`, {
    name: `Campanha vazia ${suffix}`,
    description: 'Campanha ativa sem produtos publicados vinculados.',
  });
  await activateCampaign(emptyCampaignId, ownerHeaders, adminHeaders);
  report.push('QA-CAMPAIGN-PUBLIC-03 active campaign without linked products created');

  const publicApi = await req('GET', `/api/campaigns/${activeCampaignId}/public`);
  assert(publicApi.status === 200, `public campaign api expected 200, got ${publicApi.status}`);
  assert(publicApi.data?.state === 'active', `public api state expected active, got ${String(publicApi.data?.state)}`);
  assert(publicApi.data?.storefront?.isActive === true, 'public api storefront should be active');
  assert(Array.isArray(publicApi.data?.products) && publicApi.data.products.some((row) => row.catalogItemId === seeded.item.catalogItemId), 'public api preview should include linked product');
  report.push('QA-CAMPAIGN-PUBLIC-04 public campaign api exposes active context and real preview');

  const activePage = await req('GET', `/c/${activeCampaignId}`);
  assert(activePage.status === 200, `public campaign page expected 200, got ${activePage.status}`);
  assert(typeof activePage.data === 'string' && activePage.data.includes(`Campanha pública ${suffix}-active`), 'public campaign page missing campaign name');
  assert(activePage.data.includes(seeded.item.name), 'public campaign page missing linked product preview');
  report.push('QA-CAMPAIGN-PUBLIC-05 public campaign page renders context and preview');

  const openStorefront = await req('GET', `/c/${activeCampaignId}/shop`, undefined, { redirect: 'manual' });
  assert(openStorefront.status === 307, `campaign storefront route expected 307, got ${openStorefront.status}`);
  assert(openStorefront.location === `${baseUrl}/shop?campaignId=${activeCampaignId}`, `campaign storefront location mismatch: ${openStorefront.location}`);
  assert(openStorefront.setCookie.includes(`ruah_campaign_id=${activeCampaignId}`), 'campaign storefront cookie missing');
  report.push('QA-CAMPAIGN-PUBLIC-06 storefront activation route sets cookie and redirects to contextual shop');

  const notFoundApi = await req('GET', '/api/campaigns/CMP-NOT-FOUND/public');
  assert(notFoundApi.status === 404, `public campaign api not_found expected 404, got ${notFoundApi.status}`);
  assert(notFoundApi.data?.state === 'not_found', `public api not_found state expected not_found, got ${String(notFoundApi.data?.state)}`);
  const notFoundPage = await req('GET', '/c/CMP-NOT-FOUND', undefined, { redirect: 'manual' });
  assert(notFoundPage.status === 404, `public campaign page not_found expected 404, got ${notFoundPage.status}`);
  report.push('QA-CAMPAIGN-PUBLIC-07 nonexistent campaign returns not_found coherently');

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
  report.push('QA-CAMPAIGN-PUBLIC-08 inactive campaign stays public-safe and does not open contextual storefront');

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
  assert(emptyShop.data.includes('ainda não tem itens publicados'), 'empty campaign shop should explain missing linked products');
  assert(!emptyShop.data.includes(seeded.item.name), 'empty campaign shop should not fall back to general catalog');
  report.push('QA-CAMPAIGN-PUBLIC-09 shop distinguishes invalid, inactive and empty campaign storefronts');

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
  report.push('QA-CAMPAIGN-PUBLIC-10 PDP distinguishes explicit campaign mismatch from stale cookie context');

  const blockedOrder = await req(
    'POST',
    '/api/orders',
    {
      supplierId: 'supplier-default',
      shippingAddressMode: 'same_as_account',
      shippingAddress: {
        recipientName: 'QA Customer',
        cep: '01000-000',
        street: 'Rua QA',
        number: '100',
        city: 'Sao Paulo',
        state: 'SP',
        country: 'BR',
      },
      campaignId: activeCampaignId,
      items: [
        {
          catalogItemId: unlinkedCatalogItem.catalogItemId,
          variantId: unlinkedVariant.variantId,
          quantity: 1,
          unitPrice: unlinkedVariant.price,
        },
      ],
      customer: { id: customerHeaders['x-actor-id'] },
    },
    { headers: customerHeaders }
  );
  assert(blockedOrder.status === 409, `checkout outside campaign expected 409, got ${blockedOrder.status}`);
  assert(blockedOrder.data?.error === 'catalog_item_not_in_campaign', `expected catalog_item_not_in_campaign, got ${String(blockedOrder.data?.error)}`);
  report.push('QA-CAMPAIGN-PUBLIC-11 checkout remains the final barrier against item outside campaign recorte');

  const referralLink = await createReferralLink(affiliateHeaders, suffix, `/c/${activeCampaignId}/shop`);
  const referralRedirect = await req('GET', `/af/${referralLink.slug}`, undefined, { redirect: 'manual' });
  assert(referralRedirect.status === 307, `campaign referral redirect expected 307, got ${referralRedirect.status}`);
  assert(referralRedirect.location === `${baseUrl}/c/${activeCampaignId}/shop`, `campaign referral target mismatch: ${referralRedirect.location}`);

  const combinedAttributionOrder = await req(
    'POST',
    '/api/orders',
    {
      supplierId: 'supplier-default',
      shippingAddressMode: 'same_as_account',
      shippingAddress: {
        recipientName: 'QA Customer',
        cep: '01000-000',
        street: 'Rua QA',
        number: '100',
        city: 'Sao Paulo',
        state: 'SP',
        country: 'BR',
      },
      items: [
        {
          catalogItemId: seeded.item.catalogItemId,
          variantId: seeded.variant.variantId,
          quantity: 1,
          unitPrice: seeded.variant.price,
        },
      ],
      customer: { id: customerHeaders['x-actor-id'] },
    },
    {
      headers: {
        ...customerHeaders,
        cookie: `ruah_campaign_id=${activeCampaignId}; ruah_referral_link_id=${referralLink.referralLinkId}`,
      },
    }
  );
  assert(combinedAttributionOrder.status === 201, `combined attribution order expected 201, got ${combinedAttributionOrder.status}`);
  const combinedItem = combinedAttributionOrder.data?.order?.items?.[0];
  assert(combinedItem?.campaignId === activeCampaignId, 'combined attribution order missing campaignId');
  assert(combinedItem?.referralLinkId === referralLink.referralLinkId, 'combined attribution order missing referralLinkId');
  report.push('QA-CAMPAIGN-PUBLIC-12 referral and campaign cookies coexist and persist combined attribution');

  const closeCampaign = await req('POST', `/api/campaigns/${activeCampaignId}/close`, {}, { headers: ownerHeaders });
  assert(closeCampaign.status === 200, `campaign close expected 200, got ${closeCampaign.status}`);

  const staleCampaignCookieOrder = await req(
    'POST',
    '/api/orders',
    {
      supplierId: 'supplier-default',
      shippingAddressMode: 'same_as_account',
      shippingAddress: {
        recipientName: 'QA Customer',
        cep: '01000-000',
        street: 'Rua QA',
        number: '100',
        city: 'Sao Paulo',
        state: 'SP',
        country: 'BR',
      },
      items: [
        {
          catalogItemId: seeded.item.catalogItemId,
          variantId: seeded.variant.variantId,
          quantity: 1,
          unitPrice: seeded.variant.price,
        },
      ],
      customer: { id: customerHeaders['x-actor-id'] },
    },
    {
      headers: {
        ...customerHeaders,
        cookie: `ruah_campaign_id=${activeCampaignId}; ruah_referral_link_id=${referralLink.referralLinkId}`,
      },
    }
  );
  assert(staleCampaignCookieOrder.status === 201, `stale campaign cookie order expected 201, got ${staleCampaignCookieOrder.status}`);
  const staleItem = staleCampaignCookieOrder.data?.order?.items?.[0];
  assert(!staleItem?.campaignId, 'stale campaign cookie should not persist campaignId after close');
  assert(staleItem?.referralLinkId === referralLink.referralLinkId, 'active referral should survive stale campaign cookie');
  report.push('QA-CAMPAIGN-PUBLIC-13 stale campaign cookie is ignored while active referral attribution survives');

  const logs = await req(
    'GET',
    `/api/audit-logs?entityType=Campaign&actions=${encodeURIComponent(
      [
        'campaign.public_viewed',
        'campaign.storefront_opened',
        'campaign.storefront_unavailable',
        'campaign.context_redirected',
        'campaign.context_ignored',
      ].join(',')
    )}`,
    undefined,
    { headers: adminHeaders }
  );
  assert(logs.status === 200, `audit logs expected 200, got ${logs.status}`);
  const campaignLogs = Array.isArray(logs.data?.logs)
    ? logs.data.logs.filter((row) => row.entity_id === activeCampaignId || row.entity_id === inactiveCampaignId)
    : [];
  const campaignActions = new Set(campaignLogs.map((row) => row.action));
  assert(campaignActions.has('campaign.public_viewed'), 'audit logs missing campaign.public_viewed');
  assert(campaignActions.has('campaign.storefront_opened'), 'audit logs missing campaign.storefront_opened');
  assert(campaignActions.has('campaign.storefront_unavailable'), 'audit logs missing campaign.storefront_unavailable');
  assert(campaignActions.has('campaign.context_redirected'), 'audit logs missing campaign.context_redirected');
  assert(campaignActions.has('campaign.context_ignored'), 'audit logs missing campaign.context_ignored');

  const referralLogs = await req(
    'GET',
    `/api/audit-logs?entityType=ReferralLink&entityId=${referralLink.referralLinkId}&actions=referral_click_recorded`,
    undefined,
    { headers: adminHeaders }
  );
  assert(referralLogs.status === 200, `referral audit logs expected 200, got ${referralLogs.status}`);
  const referralActions = new Set(Array.isArray(referralLogs.data?.logs) ? referralLogs.data.logs.map((row) => row.action) : []);
  assert(referralActions.has('referral_click_recorded'), 'audit logs missing referral_click_recorded');
  report.push('QA-CAMPAIGN-PUBLIC-14 public campaign observability captures stale context and referral interplay');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, activeCampaignId, inactiveCampaignId, emptyCampaignId, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
