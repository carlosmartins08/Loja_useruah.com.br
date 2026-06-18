import { withWebhookSignature } from '../lib/qa-webhook-signature.mjs';

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3330';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function round2(value) {
  return Math.round(value * 100) / 100;
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

function validCatalogPayload(artworkId, suffix) {
  return {
    artworkId,
    productBaseId: 'tee-regular-001',
    name: `Camiseta Runtime ${suffix}`,
    price: 139.9,
    image: '/assets/editorial/catalog/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-front.svg',
    colorImages: {
      offwhite: '/assets/editorial/catalog/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-front.svg',
      black: '/assets/editorial/catalog/camiseta-regular/preto-presenca/mockup-camiseta-regular-preto-presenca-front.svg',
    },
    fit: 'regular',
    fabric: '100% algodao fio 30.1',
    printTypeDescription: 'silk',
    washGuide: 'lavar do avesso, secagem a sombra',
    installmentCount: 4,
    detailImages: [{ label: 'Gola', src: '/assets/editorial/catalog/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-detail-gola.svg' }],
    modelMockups: [{ label: 'Modelo frontal', src: '/assets/editorial/catalog/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-right-3q.svg' }],
    variants: [
      {
        variantId: `TEE-OFFWHITE-M-${suffix}`,
        label: 'Off-white / M',
        price: 139.9,
        image: '/assets/editorial/catalog/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-front.svg',
        inStock: true,
      },
    ],
    category: 'Autoral',
    segment: 'Customizada',
    tags: ['qa', 'role-closure', suffix],
  };
}

async function listPendingReviews(adminHeaders) {
  const pending = await req('GET', '/api/admin/impact-reviews?status=pending_review', undefined, { headers: adminHeaders });
  assert(pending.status === 200, `impact review list expected 200, got ${pending.status}`);
  return Array.isArray(pending.data?.reviews) ? pending.data.reviews : [];
}

async function resolvePendingReviewId(entityType, entityId, adminHeaders) {
  const reviews = await listPendingReviews(adminHeaders);
  const review = reviews.find((row) => row.entityType === entityType && row.entityId === entityId);
  assert(review?.reviewId, `pending review missing for ${entityType}:${entityId}`);
  return review.reviewId;
}

async function run() {
  const suffix = String(Date.now());
  const report = [];
  const expectedDiscountedUnitPrice = round2(139.9 * 0.95);
  const expectedOrderAmount = round2(expectedDiscountedUnitPrice * 2);
  const expectedSavings = round2((139.9 - expectedDiscountedUnitPrice) * 2);
  const artistId = `qa-artist-closure-${suffix}`;
  const communityId = `qa-community-closure-${suffix}`;
  const affiliateId = `qa-affiliate-closure-${suffix}`;
  const customerId = `qa-customer-closure-${suffix}`;
  const adminId = `qa-admin-closure-${suffix}`;

  const artistHeaders = { 'x-actor-id': artistId, 'x-actor-role': 'artist' };
  const curatorHeaders = { 'x-actor-id': `qa-curator-${suffix}`, 'x-actor-role': 'curator' };
  const communityHeaders = { 'x-actor-id': communityId, 'x-actor-role': 'community_manager' };
  const affiliateHeaders = { 'x-actor-id': affiliateId, 'x-actor-role': 'affiliate' };
  const customerHeaders = { 'x-actor-id': customerId, 'x-actor-role': 'customer' };
  const adminHeaders = { 'x-actor-id': adminId, 'x-actor-role': 'platform_admin' };
  report.push('ROLE-CLOSE-01 role headers ready for artist/community/affiliate/customer/admin');

  const acceptArtistTerms = await req(
    'POST',
    '/api/terms/accept',
    {
      userId: artistId,
      entityType: 'artist',
      entityId: artistId,
      termType: 'artist_base',
      termVersion: 'v1',
    },
    { headers: artistHeaders }
  );
  assert(acceptArtistTerms.status === 200 || acceptArtistTerms.status === 201, `artist terms expected 200|201, got ${acceptArtistTerms.status}`);
  report.push('ROLE-CLOSE-02 artist term accepted');

  const createArtwork = await req(
    'POST',
    '/api/artworks',
    {
      sourceAsset: `qa://artist/closure-${suffix}`,
      metadata: {
        theme: `Colecao ${suffix}`,
        category: 'manifesto',
        tags: ['qa', 'artist', 'closure'],
      },
    },
    { headers: artistHeaders }
  );
  assert(createArtwork.status === 201, `artwork create expected 201, got ${createArtwork.status}`);
  const artworkId = createArtwork.data?.artwork?.artworkId;
  assert(typeof artworkId === 'string', 'artworkId missing');
  report.push('ROLE-CLOSE-03 artist submits artwork from own runtime');

  const startReview = await req('POST', `/api/artworks/${artworkId}/start-review`, {}, { headers: curatorHeaders });
  assert(startReview.status === 200, `artwork start-review expected 200, got ${startReview.status}`);
  const approveArtwork = await req('POST', `/api/artworks/${artworkId}/approve`, {}, { headers: curatorHeaders });
  assert(approveArtwork.status === 200, `artwork approve expected 200, got ${approveArtwork.status}`);
  report.push('ROLE-CLOSE-04 curator approves artist artwork');

  const createCatalog = await req('POST', '/api/catalog-items', validCatalogPayload(artworkId, suffix), { headers: curatorHeaders });
  assert(createCatalog.status === 201, `catalog create expected 201, got ${createCatalog.status}`);
  const catalogItemId = createCatalog.data?.item?.catalogItemId;
  const catalogReviewId = createCatalog.data?.governance?.reviewId;
  assert(typeof catalogItemId === 'string', 'catalogItemId missing');
  assert(typeof catalogReviewId === 'string', 'catalog review id missing');
  report.push('ROLE-CLOSE-05 catalog item created from approved artwork');

  const approveCatalogImpact = await req(
    'POST',
    `/api/admin/impact-reviews/${catalogReviewId}/approve`,
    { reason: 'qa role closure catalog impact' },
    { headers: adminHeaders }
  );
  assert(approveCatalogImpact.status === 200, `catalog impact approve expected 200, got ${approveCatalogImpact.status}`);
  const readyCatalog = await req('POST', `/api/catalog-items/${catalogItemId}/ready`, { reason: 'qa role closure ready' }, { headers: curatorHeaders });
  assert(readyCatalog.status === 200, `catalog ready expected 200, got ${readyCatalog.status}`);
  const publishCatalog = await req('POST', `/api/catalog-items/${catalogItemId}/publish`, { reason: 'qa role closure publish' }, { headers: curatorHeaders });
  assert(publishCatalog.status === 200, `catalog publish expected 200, got ${publishCatalog.status}`);
  report.push('ROLE-CLOSE-06 artist artwork reaches public catalog');

  const createCampaign = await req(
    'POST',
    '/api/campaigns',
    {
      organizationId: `org-community-${suffix}`,
      name: `Campanha ${suffix}`,
      description: 'QA closure campaign',
      budget: 3000,
      progressivePriceRule: '2-5=5%;6-10=10%',
    },
    { headers: communityHeaders }
  );
  assert(createCampaign.status === 201, `campaign create expected 201, got ${createCampaign.status}`);
  const campaignId = createCampaign.data?.campaign?.campaignId;
  assert(typeof campaignId === 'string', 'campaignId missing');
  report.push('ROLE-CLOSE-07 community manager creates campaign');

  const linkCampaignProduct = await req(
    'POST',
    `/api/campaigns/${campaignId}/products`,
    { catalogItemId },
    { headers: communityHeaders }
  );
  assert(linkCampaignProduct.status === 201, `campaign product link expected 201, got ${linkCampaignProduct.status}`);
  report.push('ROLE-CLOSE-08 community manager links published catalog item into campaign vitrine');

  const submitCampaign = await req('POST', `/api/campaigns/${campaignId}/submit`, {}, { headers: communityHeaders });
  assert(submitCampaign.status === 200, `campaign submit expected 200, got ${submitCampaign.status}`);
  const campaignReviewId = await resolvePendingReviewId('Campaign', campaignId, adminHeaders);
  const approveCampaignReview = await req(
    'POST',
    `/api/admin/impact-reviews/${campaignReviewId}/approve`,
    { reason: 'qa role closure campaign impact' },
    { headers: adminHeaders }
  );
  assert(approveCampaignReview.status === 200, `campaign impact approve expected 200, got ${approveCampaignReview.status}`);
  const approveCampaign = await req('POST', `/api/campaigns/${campaignId}/approve`, {}, { headers: curatorHeaders });
  assert(approveCampaign.status === 200, `campaign approve expected 200, got ${approveCampaign.status}`);
  report.push('ROLE-CLOSE-09 campaign becomes active after impact review and moderation');

  const createReferralLink = await req(
    'POST',
    '/api/affiliate/links',
    {
      label: `Link ${suffix}`,
      channel: 'instagram',
      targetPath: '/shop',
      slug: `role-close-${suffix}`,
    },
    { headers: affiliateHeaders }
  );
  assert(createReferralLink.status === 201, `affiliate link create expected 201, got ${createReferralLink.status}`);
  const referralLinkId = createReferralLink.data?.link?.referralLinkId;
  const referralSlug = createReferralLink.data?.link?.slug;
  assert(typeof referralLinkId === 'string', 'referralLinkId missing');
  assert(typeof referralSlug === 'string', 'referral slug missing');
  report.push('ROLE-CLOSE-10 affiliate creates tracked link');

  const bootstrapCatalog = await req('POST', '/api/catalog-items/bootstrap', {}, { headers: curatorHeaders });
  assert(bootstrapCatalog.status === 200, `catalog bootstrap expected 200, got ${bootstrapCatalog.status}`);
  const unlinkedCatalogItemId = bootstrapCatalog.data?.results?.[0]?.catalogItemId;
  assert(typeof unlinkedCatalogItemId === 'string', 'unlinked bootstrap catalog item missing');
  const publicCatalog = await req('GET', '/api/catalog-items');
  assert(publicCatalog.status === 200, `public catalog list expected 200, got ${publicCatalog.status}`);
  const unlinkedCatalogItem = Array.isArray(publicCatalog.data?.items)
    ? publicCatalog.data.items.find((item) => item.catalogItemId === unlinkedCatalogItemId)
    : null;
  const unlinkedVariant = Array.isArray(unlinkedCatalogItem?.variants) ? unlinkedCatalogItem.variants[0] : null;
  assert(unlinkedVariant?.variantId, 'unlinked campaign validation variant missing');
  assert(typeof unlinkedVariant?.price === 'number', 'unlinked campaign validation price missing');

  const blockedOrderBeforeLink = await req(
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
          catalogItemId: unlinkedCatalogItemId,
          variantId: unlinkedVariant.variantId,
          quantity: 1,
          unitPrice: unlinkedVariant.price,
        },
      ],
      customer: { id: customerId },
    },
    {
      headers: {
        ...customerHeaders,
        cookie: `ruah_campaign_id=${campaignId}`,
      },
    }
  );
  assert(blockedOrderBeforeLink.status === 409, `order without campaign product link expected 409, got ${blockedOrderBeforeLink.status}`);
  assert(
    blockedOrderBeforeLink.data?.error === 'catalog_item_not_in_campaign',
    `expected catalog_item_not_in_campaign, got ${String(blockedOrderBeforeLink.data?.error)}`
  );
  report.push('ROLE-CLOSE-11 active campaign rejects checkout for published item outside linked vitrine');

  const publicCampaign = await req('GET', `/c/${campaignId}`, undefined, { redirect: 'manual' });
  assert(publicCampaign.status === 307, `public campaign redirect expected 307, got ${publicCampaign.status}`);
  assert(publicCampaign.location === `${baseUrl}/shop?campaignId=${campaignId}`, `public campaign location mismatch: ${publicCampaign.location}`);
  assert(publicCampaign.setCookie.includes(`ruah_campaign_id=${campaignId}`), 'campaign cookie missing in public redirect');

  const publicReferral = await req('GET', `/af/${referralSlug}`, undefined, { redirect: 'manual' });
  assert(publicReferral.status === 307, `public referral redirect expected 307, got ${publicReferral.status}`);
  assert(publicReferral.location === `${baseUrl}/shop`, `public referral location mismatch: ${publicReferral.location}`);
  assert(publicReferral.setCookie.includes(`ruah_referral_link_id=${referralLinkId}`), 'referral cookie missing in public redirect');
  report.push('ROLE-CLOSE-12 public campaign and referral routes set attribution cookies and campaign storefront filter');

  const order = await req(
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
          catalogItemId,
          variantId: `TEE-OFFWHITE-M-${suffix}`,
          quantity: 2,
          unitPrice: expectedDiscountedUnitPrice,
        },
      ],
      customer: { id: customerId },
    },
    {
      headers: {
        ...customerHeaders,
        cookie: `ruah_campaign_id=${campaignId}; ruah_referral_link_id=${referralLinkId}`,
      },
    }
  );
  assert(order.status === 201, `order create expected 201, got ${order.status} -> ${JSON.stringify(order.data)}`);
  const orderId = order.data?.order?.orderId;
  assert(typeof orderId === 'string', 'orderId missing');
  const orderItem = order.data?.order?.items?.[0];
  assert(orderItem?.campaignId === campaignId, 'order snapshot missing campaignId');
  assert(orderItem?.campaignName === `Campanha ${suffix}`, 'order snapshot missing campaignName');
  assert(orderItem?.campaignProgressivePriceRule === '2-5=5%;6-10=10%', 'order snapshot missing campaign progressive rule');
  assert(orderItem?.priceCompositionVersion === 'phase2-campaign-pricing-v1', 'order snapshot missing price composition version');
  assert(orderItem?.movementMarkup?.tierLabel === '2-5=5%', 'order snapshot missing applied campaign tier');
  assert(orderItem?.movementMarkup?.totalAmount === expectedSavings, `order snapshot savings expected ${expectedSavings}, got ${orderItem?.movementMarkup?.totalAmount}`);
  assert(orderItem?.referralLinkId === referralLinkId, 'order snapshot missing referralLinkId');
  assert(orderItem?.artworkAuthorId === artistId, 'order snapshot missing artist ownership');
  report.push('ROLE-CLOSE-13 order snapshot freezes artist, campaign ids, campaign pricing composition and referral context');

  const checkout = await req(
    'POST',
    '/api/payments/checkout',
    {
      orderId,
      method: 'pix',
      provider: 'sandbox',
      amount: expectedOrderAmount,
      currency: 'BRL',
      items: [{ id: catalogItemId, name: `Camiseta Runtime ${suffix}`, quantity: 2, unitPrice: expectedDiscountedUnitPrice }],
    },
    { headers: { 'x-idempotency-key': `role-close-checkout-${suffix}` } }
  );
  assert(checkout.status === 200, `checkout expected 200, got ${checkout.status}`);
  const providerReference = checkout.data?.payment?.providerReference;
  assert(typeof providerReference === 'string', 'providerReference missing');

  const approvePayment = await req(
    'POST',
    '/api/payments/webhook',
    { eventId: `evt-role-close-${suffix}`, providerReference, event: 'payment.approved', provider: 'sandbox' },
    {
      headers: withWebhookSignature(
        { eventId: `evt-role-close-${suffix}`, providerReference, event: 'payment.approved', provider: 'sandbox' },
        { 'x-idempotency-key': `role-close-webhook-${suffix}`, 'x-provider': 'sandbox' }
      ),
    }
  );
  assert(approvePayment.status === 200, `payment webhook expected 200, got ${approvePayment.status}`);
  report.push('ROLE-CLOSE-14 payment approved with contextual order data');

  const createProduction = await req('POST', '/api/production-jobs', { orderId }, {
    headers: { 'x-actor-id': `qa-production-${suffix}`, 'x-actor-role': 'production_operator' },
  });
  assert(createProduction.status === 200 || createProduction.status === 201, `production create expected 200|201, got ${createProduction.status}`);

  const productionByOrder = await req('GET', `/api/production-jobs/by-order/${orderId}`, undefined, {
    headers: { 'x-actor-id': `qa-production-${suffix}`, 'x-actor-role': 'production_operator' },
  });
  assert(productionByOrder.status === 200, `production by order expected 200, got ${productionByOrder.status}`);
  const productionJobId = productionByOrder.data?.job?.productionJobId;
  assert(typeof productionJobId === 'string', 'productionJobId missing');

  const startProduction = await req('POST', `/api/production-jobs/${productionJobId}/start`, {}, {
    headers: { 'x-actor-id': `qa-production-${suffix}`, 'x-actor-role': 'production_operator' },
  });
  assert(startProduction.status === 200, `production start expected 200, got ${startProduction.status}`);

  const shipProduction = await req(
    'POST',
    `/api/production-jobs/${productionJobId}/ship`,
    { trackingCode: `BR-${suffix}`, carrier: 'Correios' },
    { headers: { 'x-actor-id': `qa-production-${suffix}`, 'x-actor-role': 'production_operator' } }
  );
  assert(shipProduction.status === 200, `production ship expected 200, got ${shipProduction.status}`);
  report.push('ROLE-CLOSE-15 shipped order releases downstream role ledgers');

  const artistLedger = await req('GET', '/api/commissions/me', undefined, { headers: artistHeaders });
  assert(artistLedger.status === 200, `artist ledger expected 200, got ${artistLedger.status}`);
  assert(artistLedger.data?.ownerId === artistId, 'artist ledger owner mismatch');
  assert(Number(artistLedger.data?.balances?.availableToWithdraw ?? 0) > 0, 'artist availableToWithdraw should be > 0');
  report.push('ROLE-CLOSE-16 artist ledger is now bound to real artwork authorship');

  const communityLedger = await req('GET', '/api/commissions/me', undefined, { headers: communityHeaders });
  assert(communityLedger.status === 200, `community ledger expected 200, got ${communityLedger.status}`);
  assert(communityLedger.data?.ownerId === communityId, 'community ledger owner mismatch');
  assert(Number(communityLedger.data?.balances?.availableToWithdraw ?? 0) > 0, 'community availableToWithdraw should be > 0');
  report.push('ROLE-CLOSE-17 community ledger is now bound to active campaign attribution');

  const artistPayout = await req(
    'POST',
    '/api/payouts',
    { amount: Number(artistLedger.data?.balances?.availableToWithdraw ?? 0), currency: 'BRL' },
    { headers: { ...artistHeaders, 'x-idempotency-key': `artist-payout-${suffix}` } }
  );
  assert(artistPayout.status === 200 || artistPayout.status === 201, `artist payout request expected 200|201, got ${artistPayout.status}`);

  const communityPayout = await req(
    'POST',
    '/api/payouts',
    { amount: Number(communityLedger.data?.balances?.availableToWithdraw ?? 0), currency: 'BRL' },
    { headers: { ...communityHeaders, 'x-idempotency-key': `community-payout-${suffix}` } }
  );
  assert(communityPayout.status === 200 || communityPayout.status === 201, `community payout request expected 200|201, got ${communityPayout.status}`);
  report.push('ROLE-CLOSE-18 artist and community can request payout from their own runtime ledger');

  const affiliateLinks = await req('GET', '/api/affiliate/links', undefined, { headers: affiliateHeaders });
  assert(affiliateLinks.status === 200, `affiliate links expected 200, got ${affiliateLinks.status}`);
  const affiliateLink = Array.isArray(affiliateLinks.data?.links)
    ? affiliateLinks.data.links.find((row) => row.referralLinkId === referralLinkId)
    : null;
  assert(affiliateLink, 'affiliate link missing after conversion');
  assert(affiliateLink.clickCount === 1, `affiliate clickCount expected 1, got ${affiliateLink?.clickCount}`);
  assert(affiliateLink.conversionCount === 1, `affiliate conversionCount expected 1, got ${affiliateLink?.conversionCount}`);
  assert(affiliateLink.revenueAmount === expectedOrderAmount, `affiliate revenue expected ${expectedOrderAmount}, got ${affiliateLink?.revenueAmount}`);
  report.push('ROLE-CLOSE-19 affiliate conversion is attributed automatically from payment approval with campaign-priced order amount');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, orderId, artworkId, campaignId, referralLinkId, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
