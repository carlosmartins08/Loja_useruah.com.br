const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3328';
const qaIdentityPassword = String(process.env.QA_IDENTITY_PASSWORD ?? '');
const QA_USERS = {
  artist: { email: 'qa-artist@useruah.local', expectedRole: 'artist' },
  curator: { email: 'qa-curator@useruah.local', expectedRole: 'curator' },
  admin: { email: 'qa-platform-admin@useruah.local', expectedRole: 'platform_admin' },
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertGatePath(pathname) {
  const normalizedPath = pathname.toLowerCase();
  const forbiddenPath = FORBIDDEN_PATH_TOKENS.find((token) => normalizedPath.includes(token));
  assert(!forbiddenPath, `QA_CATALOG_CURATION_FORBIDDEN_ENDPOINT:${forbiddenPath}`);

  const isAllowed =
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/session' ||
    pathname === '/api/terms/accept' ||
    pathname === '/api/artworks' ||
    /^\/api\/artworks\/[^/]+\/(start-review|approve|reject)$/.test(pathname) ||
    pathname === '/api/catalog-items' ||
    pathname === '/api/catalog-items/bootstrap' ||
    /^\/api\/catalog-items\/[^/]+\/(ready|publish|unpublish|reopen)$/.test(pathname) ||
    pathname === '/api/admin/impact-reviews' ||
    /^\/api\/admin\/impact-reviews\/[^/]+\/(approve|reject)$/.test(pathname) ||
    pathname === '/shop' ||
    /^\/product\/[^/]+$/.test(pathname) ||
    /^\/category\/[^/]+$/.test(pathname);

  assert(isAllowed, `QA_CATALOG_CURATION_ENDPOINT_NOT_ALLOWED:${pathname}`);
}

async function req(method, pathname, body, options = {}) {
  assertGatePath(pathname);
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }
  return { status: response.status, data, setCookie: response.headers.get('set-cookie') ?? '' };
}

async function loginQaUser(user) {
  assert(qaIdentityPassword, 'QA_IDENTITY_PASSWORD_REQUIRED');
  const response = await req('POST', '/api/auth/login', { email: user.email, password: qaIdentityPassword });
  assert(response.status === 200, `${user.expectedRole} login expected 200, got ${response.status}`);
  const match = response.setCookie.match(/ruah_session=([^;]+)/);
  assert(match?.[1], `${user.expectedRole} ruah_session cookie missing after login`);
  assert(response.data?.session?.activeRole === user.expectedRole, `${user.expectedRole} activeRole mismatch`);

  const cookie = `ruah_session=${match[1]}`;
  const session = await req('GET', '/api/auth/session', undefined, { headers: { cookie } });
  assert(session.status === 200, `${user.expectedRole} session expected 200, got ${session.status}`);
  assert(session.data?.authenticated === true, `${user.expectedRole} session should be authenticated`);
  assert(session.data?.session?.activeRole === user.expectedRole, `${user.expectedRole} session role mismatch`);
  assert(typeof session.data?.session?.userId === 'string', `${user.expectedRole} session userId missing`);
  return { cookie, userId: session.data.session.userId };
}

async function acceptTerms(session, entityType, termType) {
  const response = await req(
    'POST',
    '/api/terms/accept',
    {
      userId: session.userId,
      entityType,
      entityId: session.userId,
      termType,
      termVersion: 'qa-v1',
    },
    { headers: { cookie: session.cookie } }
  );
  assert(response.status === 200 || response.status === 201, `${entityType} terms expected 200|201, got ${response.status}`);
}

function validCatalogPayload(artworkId) {
  return {
    artworkId,
    productBaseId: 'tee-regular-001',
    name: 'Camiseta Curadoria QA',
    price: 129.9,
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
        variantId: 'TEE-OFFWHITE-M',
        label: 'Off-white / M',
        price: 129.9,
        image: '/assets/editorial/catalog/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-front.svg',
        inStock: true,
      },
      {
        variantId: 'TEE-BLACK-G',
        label: 'Preta / G',
        price: 134.9,
        image: '/assets/editorial/catalog/camiseta-regular/preto-presenca/mockup-camiseta-regular-preto-presenca-front.svg',
        inStock: true,
      },
    ],
    category: 'Autoral',
    segment: 'Customizada',
    tags: ['qa', 'catalogo', 'curadoria'],
  };
}

async function run() {
  const report = [];
  const artistSession = await loginQaUser(QA_USERS.artist);
  const curatorSession = await loginQaUser(QA_USERS.curator);
  const adminSession = await loginQaUser(QA_USERS.admin);
  const artistHeaders = { cookie: artistSession.cookie };
  const curatorHeaders = { cookie: curatorSession.cookie };
  const adminHeaders = { cookie: adminSession.cookie };

  await acceptTerms(artistSession, 'artist', 'artist_base');
  await acceptTerms(curatorSession, 'industry', 'industry_base');
  report.push('CAT-CUR-01 QA identities authenticated by ruah_session and required terms accepted');

  const createArtwork = await req(
    'POST',
    '/api/artworks',
    {
      sourceAsset: 'qa://artwork/catalog-integration',
      metadata: {
        theme: 'Catalogo integrado',
        category: 'manifesto',
        tags: ['qa', 'catalogo', 'integracao'],
      },
    },
    { headers: artistHeaders }
  );
  assert(createArtwork.status === 201, `artwork create expected 201, got ${createArtwork.status}`);
  const artworkId = createArtwork.data?.artwork?.artworkId;
  assert(typeof artworkId === 'string', 'artworkId missing');
  report.push('CAT-CUR-02 artist submits artwork');

  const artistCatalogAttempt = await req('POST', '/api/catalog-items', validCatalogPayload(artworkId), { headers: artistHeaders });
  assert(artistCatalogAttempt.status === 403, `artist catalog create expected 403, got ${artistCatalogAttempt.status}`);
  report.push('CAT-CUR-03 artist cannot manage catalog transitions');

  const createBeforeApproval = await req('POST', '/api/catalog-items', validCatalogPayload(artworkId), { headers: curatorHeaders });
  assert(createBeforeApproval.status === 409, `catalog create before artwork approval expected 409, got ${createBeforeApproval.status}`);
  assert(createBeforeApproval.data?.detail === 'artwork_must_be_approved', 'catalog create before approval should require approved artwork');
  report.push('CAT-CUR-04 catalog item blocked until artwork approval');

  const startReview = await req('POST', `/api/artworks/${artworkId}/start-review`, {}, { headers: curatorHeaders });
  assert(startReview.status === 200, `artwork start-review expected 200, got ${startReview.status}`);
  report.push('CAT-CUR-05 curator starts artwork review');

  const approveArtwork = await req('POST', `/api/artworks/${artworkId}/approve`, {}, { headers: curatorHeaders });
  assert(approveArtwork.status === 200, `artwork approve expected 200, got ${approveArtwork.status}`);
  report.push('CAT-CUR-06 curator approves artwork');

  const invalidVariantPayload = validCatalogPayload(artworkId);
  invalidVariantPayload.variants = [
    {
      variantId: 'TEE-DUP',
      label: 'Off-white / M',
      price: 0,
      image: '/assets/editorial/catalog/camiseta-regular/offwhite-oracao/mockup-camiseta-regular-offwhite-oracao-front.svg',
      inStock: false,
    },
    {
      variantId: 'TEE-DUP',
      label: 'Preta / G',
      price: 134.9,
      image: '/assets/editorial/catalog/non-mapped.jpg',
      inStock: false,
    },
  ];
  const invalidCatalog = await req('POST', '/api/catalog-items', invalidVariantPayload, { headers: curatorHeaders });
  assert(invalidCatalog.status === 422, `invalid catalog item expected 422, got ${invalidCatalog.status}`);
  assert(invalidCatalog.data?.detail === 'catalog_business_rules_failed', 'invalid catalog should fail business rules');
  const issues = Array.isArray(invalidCatalog.data?.issues) ? invalidCatalog.data.issues : [];
  assert(issues.includes('variant_price_invalid'), 'expected variant_price_invalid');
  assert(issues.includes('duplicate_variant_id'), 'expected duplicate_variant_id');
  assert(issues.includes('no_sellable_variant'), 'expected no_sellable_variant');
  report.push('CAT-CUR-07 invalid variant payload blocked by business rules');

  const createCatalog = await req('POST', '/api/catalog-items', validCatalogPayload(artworkId), { headers: curatorHeaders });
  assert(createCatalog.status === 201, `catalog create expected 201, got ${createCatalog.status}`);
  const catalogItemId = createCatalog.data?.item?.catalogItemId;
  const reviewId = createCatalog.data?.governance?.reviewId;
  assert(typeof catalogItemId === 'string', 'catalogItemId missing');
  assert(createCatalog.data?.item?.publicationStatus === 'pending_review', 'catalog item should start pending_review');
  assert(typeof reviewId === 'string', 'impact review id missing');
  report.push('CAT-CUR-08 approved artwork creates catalog item with pending impact review');

  const readyWhilePending = await req('POST', `/api/catalog-items/${catalogItemId}/ready`, { reason: 'qa_ready_before_impact' }, { headers: curatorHeaders });
  assert(readyWhilePending.status === 409, `ready before impact approval expected 409, got ${readyWhilePending.status}`);
  assert(readyWhilePending.data?.detail === 'impact_review_pending', 'ready should be blocked by pending impact review');
  report.push('CAT-CUR-09 ready blocked until impact review approval');

  const approveImpact = await req(
    'POST',
    `/api/admin/impact-reviews/${reviewId}/approve`,
    { reason: 'qa catalog release' },
    { headers: adminHeaders }
  );
  assert(approveImpact.status === 200, `impact review approve expected 200, got ${approveImpact.status}`);
  report.push('CAT-CUR-10 platform admin approves catalog impact review');

  const readyCatalog = await req('POST', `/api/catalog-items/${catalogItemId}/ready`, { reason: 'qa_ready_after_impact' }, { headers: curatorHeaders });
  assert(readyCatalog.status === 200, `ready after impact approval expected 200, got ${readyCatalog.status}`);
  assert(readyCatalog.data?.item?.publicationStatus === 'ready', 'catalog item should move to ready');
  report.push('CAT-CUR-11 catalog item moves to ready after impact approval');

  const publishCatalog = await req('POST', `/api/catalog-items/${catalogItemId}/publish`, { reason: 'qa_publish' }, { headers: curatorHeaders });
  assert(publishCatalog.status === 200, `catalog publish expected 200, got ${publishCatalog.status}`);
  assert(publishCatalog.data?.item?.publicationStatus === 'published', 'catalog item should move to published');
  report.push('CAT-CUR-12 catalog item publishes after ready');

  const publicCatalog = await req('GET', '/api/catalog-items');
  assert(publicCatalog.status === 200, `public catalog expected 200, got ${publicCatalog.status}`);
  assert(
    Array.isArray(publicCatalog.data?.items) && publicCatalog.data.items.some((item) => item.catalogItemId === catalogItemId),
    'published catalog item missing from public catalog'
  );
  report.push('CAT-CUR-13 published item becomes visible in public catalog listing');

  const publicShop = await req('GET', '/shop');
  assert(publicShop.status === 200, `public shop expected 200, got ${publicShop.status}`);
  assert(typeof publicShop.data === 'string' && publicShop.data.includes(createCatalog.data.item.name), 'published catalog item missing from shop');

  const publicProduct = await req('GET', `/product/${catalogItemId}`);
  assert(publicProduct.status === 200, `public product expected 200, got ${publicProduct.status}`);
  assert(typeof publicProduct.data === 'string' && publicProduct.data.includes(createCatalog.data.item.name), 'published catalog item missing from product page');

  const publicCategory = await req('GET', '/category/autoral');
  assert(publicCategory.status === 200, `public category expected 200, got ${publicCategory.status}`);
  assert(typeof publicCategory.data === 'string' && publicCategory.data.includes(createCatalog.data.item.name), 'published catalog item missing from category page');
  report.push('CAT-CUR-14 published item is visible in allowed public shop, product and category reads');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, catalogItemId, artworkId, reviewId, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
