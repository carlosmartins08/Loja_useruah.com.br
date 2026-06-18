const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3328';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function req(method, pathname, body, headers = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return { status: response.status, data };
}

async function acceptArtistTerms(userId) {
  const response = await req(
    'POST',
    '/api/terms/accept',
    {
      userId,
      entityType: 'artist',
      entityId: userId,
      termType: 'artist_base',
      termVersion: 'qa-v1',
    },
    { 'x-actor-id': userId, 'x-actor-role': 'artist' }
  );
  assert(response.status === 200 || response.status === 201, `artist terms expected 200|201, got ${response.status}`);
}

function validCatalogPayload(artworkId) {
  return {
    artworkId,
    productBaseId: 'tee-regular-001',
    name: 'Camiseta Curadoria QA',
    price: 129.9,
    image: '/assets/editorial/catalog/tee-off-white/main.jpg',
    colorImages: {
      offwhite: '/assets/editorial/catalog/tee-off-white/main.jpg',
      black: '/assets/editorial/catalog/tee-black/main.jpg',
    },
    fit: 'regular',
    fabric: '100% algodao fio 30.1',
    printTypeDescription: 'silk',
    washGuide: 'lavar do avesso, secagem a sombra',
    installmentCount: 4,
    detailImages: [{ label: 'Gola', src: '/assets/editorial/catalog/tee-off-white/detail-collar.jpg' }],
    modelMockups: [{ label: 'Modelo frontal', src: '/assets/editorial/catalog/tee-off-white/model-front.jpg' }],
    variants: [
      {
        variantId: 'TEE-OFFWHITE-M',
        label: 'Off-white / M',
        price: 129.9,
        image: '/assets/editorial/catalog/tee-off-white/main.jpg',
        inStock: true,
      },
      {
        variantId: 'TEE-BLACK-G',
        label: 'Preta / G',
        price: 134.9,
        image: '/assets/editorial/catalog/tee-black/main.jpg',
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
  const artistHeaders = { 'x-actor-id': 'qa-artist-catalog', 'x-actor-role': 'artist' };
  const curatorHeaders = { 'x-actor-id': 'qa-curator', 'x-actor-role': 'curator' };
  const adminHeaders = { 'x-actor-id': 'qa-admin', 'x-actor-role': 'platform_admin' };

  await acceptArtistTerms('qa-artist-catalog');
  report.push('CAT-CUR-01 artist terms accepted');

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
    artistHeaders
  );
  assert(createArtwork.status === 201, `artwork create expected 201, got ${createArtwork.status}`);
  const artworkId = createArtwork.data?.artwork?.artworkId;
  assert(typeof artworkId === 'string', 'artworkId missing');
  report.push('CAT-CUR-02 artist submits artwork');

  const createBeforeApproval = await req('POST', '/api/catalog-items', validCatalogPayload(artworkId), curatorHeaders);
  assert(createBeforeApproval.status === 409, `catalog create before artwork approval expected 409, got ${createBeforeApproval.status}`);
  assert(createBeforeApproval.data?.detail === 'artwork_must_be_approved', 'catalog create before approval should require approved artwork');
  report.push('CAT-CUR-03 catalog item blocked until artwork approval');

  const startReview = await req('POST', `/api/artworks/${artworkId}/start-review`, {}, curatorHeaders);
  assert(startReview.status === 200, `artwork start-review expected 200, got ${startReview.status}`);
  report.push('CAT-CUR-04 curator starts artwork review');

  const approveArtwork = await req('POST', `/api/artworks/${artworkId}/approve`, {}, curatorHeaders);
  assert(approveArtwork.status === 200, `artwork approve expected 200, got ${approveArtwork.status}`);
  report.push('CAT-CUR-05 curator approves artwork');

  const invalidVariantPayload = validCatalogPayload(artworkId);
  invalidVariantPayload.variants = [
    {
      variantId: 'TEE-DUP',
      label: 'Off-white / M',
      price: 0,
      image: '/assets/editorial/catalog/tee-off-white/main.jpg',
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
  const invalidCatalog = await req('POST', '/api/catalog-items', invalidVariantPayload, curatorHeaders);
  assert(invalidCatalog.status === 422, `invalid catalog item expected 422, got ${invalidCatalog.status}`);
  assert(invalidCatalog.data?.detail === 'catalog_business_rules_failed', 'invalid catalog should fail business rules');
  const issues = Array.isArray(invalidCatalog.data?.issues) ? invalidCatalog.data.issues : [];
  assert(issues.includes('variant_price_invalid'), 'expected variant_price_invalid');
  assert(issues.includes('duplicate_variant_id'), 'expected duplicate_variant_id');
  assert(issues.includes('no_sellable_variant'), 'expected no_sellable_variant');
  report.push('CAT-CUR-06 invalid variant payload blocked by business rules');

  const createCatalog = await req('POST', '/api/catalog-items', validCatalogPayload(artworkId), curatorHeaders);
  assert(createCatalog.status === 201, `catalog create expected 201, got ${createCatalog.status}`);
  const catalogItemId = createCatalog.data?.item?.catalogItemId;
  const reviewId = createCatalog.data?.governance?.reviewId;
  assert(typeof catalogItemId === 'string', 'catalogItemId missing');
  assert(createCatalog.data?.item?.publicationStatus === 'pending_review', 'catalog item should start pending_review');
  assert(typeof reviewId === 'string', 'impact review id missing');
  report.push('CAT-CUR-07 approved artwork creates catalog item with pending impact review');

  const readyWhilePending = await req('POST', `/api/catalog-items/${catalogItemId}/ready`, { reason: 'qa_ready_before_impact' }, curatorHeaders);
  assert(readyWhilePending.status === 409, `ready before impact approval expected 409, got ${readyWhilePending.status}`);
  assert(readyWhilePending.data?.detail === 'impact_review_pending', 'ready should be blocked by pending impact review');
  report.push('CAT-CUR-08 ready blocked until impact review approval');

  const approveImpact = await req(
    'POST',
    `/api/admin/impact-reviews/${reviewId}/approve`,
    { reason: 'qa catalog release' },
    adminHeaders
  );
  assert(approveImpact.status === 200, `impact review approve expected 200, got ${approveImpact.status}`);
  report.push('CAT-CUR-09 platform admin approves catalog impact review');

  const readyCatalog = await req('POST', `/api/catalog-items/${catalogItemId}/ready`, { reason: 'qa_ready_after_impact' }, curatorHeaders);
  assert(readyCatalog.status === 200, `ready after impact approval expected 200, got ${readyCatalog.status}`);
  assert(readyCatalog.data?.item?.publicationStatus === 'ready', 'catalog item should move to ready');
  report.push('CAT-CUR-10 catalog item moves to ready after impact approval');

  const publishCatalog = await req('POST', `/api/catalog-items/${catalogItemId}/publish`, { reason: 'qa_publish' }, curatorHeaders);
  assert(publishCatalog.status === 200, `catalog publish expected 200, got ${publishCatalog.status}`);
  assert(publishCatalog.data?.item?.publicationStatus === 'published', 'catalog item should move to published');
  report.push('CAT-CUR-11 catalog item publishes after ready');

  const publicCatalog = await req('GET', '/api/catalog-items');
  assert(publicCatalog.status === 200, `public catalog expected 200, got ${publicCatalog.status}`);
  assert(
    Array.isArray(publicCatalog.data?.items) && publicCatalog.data.items.some((item) => item.catalogItemId === catalogItemId),
    'published catalog item missing from public catalog'
  );
  report.push('CAT-CUR-12 published item becomes visible in public catalog listing');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, catalogItemId, artworkId, reviewId, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
