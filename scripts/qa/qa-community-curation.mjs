const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3325';

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

async function run() {
  const report = [];
  const adminHeaders = { 'x-actor-id': 'qa-admin-campaign', 'x-actor-role': 'platform_admin' };
  const rejectionReason = 'Ajuste a regra progressiva antes de reenviar.';

  const noAuthCampaigns = await req('GET', '/api/campaigns');
  assert(noAuthCampaigns.status === 401, `anonymous campaigns list expected 401, got ${noAuthCampaigns.status}`);
  report.push('CC-01 campaign list requires session');

  const createCampaign = await req(
    'POST',
    '/api/campaigns',
    {
      organizationId: 'org-community-a',
      name: 'Campanha QA Comunidade',
      description: 'Fluxo real de comunidade',
      budget: 1500,
      progressivePriceRule: 'baseline',
    },
    { 'x-actor-id': 'qa-community-a', 'x-actor-role': 'community_manager' }
  );
  assert(createCampaign.status === 201, `community create campaign expected 201, got ${createCampaign.status}`);
  const campaignId = createCampaign.data?.campaign?.campaignId;
  assert(typeof campaignId === 'string', 'campaignId missing');
  report.push('CC-02 community manager creates draft campaign');

  const ownCampaigns = await req('GET', '/api/campaigns', undefined, {
    'x-actor-id': 'qa-community-a',
    'x-actor-role': 'community_manager',
  });
  assert(ownCampaigns.status === 200, `community own campaigns expected 200, got ${ownCampaigns.status}`);
  assert(
    Array.isArray(ownCampaigns.data?.campaigns) && ownCampaigns.data.campaigns.some((campaign) => campaign.campaignId === campaignId),
    'community own list missing created campaign'
  );
  report.push('CC-03 campaign list is visible to its owner');

  const foreignCampaigns = await req('GET', '/api/campaigns', undefined, {
    'x-actor-id': 'qa-community-b',
    'x-actor-role': 'community_manager',
  });
  assert(foreignCampaigns.status === 200, `foreign community campaign list expected 200, got ${foreignCampaigns.status}`);
  assert(
    Array.isArray(foreignCampaigns.data?.campaigns) && !foreignCampaigns.data.campaigns.some((campaign) => campaign.campaignId === campaignId),
    'foreign community unexpectedly received campaign outside own scope'
  );
  report.push('CC-04 campaign list is filtered by ownership for community manager');

  const bootstrapCatalog = await req('POST', '/api/catalog-items/bootstrap', {}, {
    'x-actor-id': 'qa-curator',
    'x-actor-role': 'curator',
  });
  assert(bootstrapCatalog.status === 200, `catalog bootstrap expected 200, got ${bootstrapCatalog.status}`);
  const linkedCatalogItemId = bootstrapCatalog.data?.results?.[0]?.catalogItemId;
  assert(typeof linkedCatalogItemId === 'string', 'bootstrap catalog item missing');

  const foreignLinkProduct = await req('POST', `/api/campaigns/${campaignId}/products`, { catalogItemId: linkedCatalogItemId }, {
    'x-actor-id': 'qa-community-b',
    'x-actor-role': 'community_manager',
  });
  assert(foreignLinkProduct.status === 403, `foreign community product link expected 403, got ${foreignLinkProduct.status}`);
  report.push('CC-05 foreign community cannot link catalog into another owner campaign');

  const ownLinkProduct = await req('POST', `/api/campaigns/${campaignId}/products`, { catalogItemId: linkedCatalogItemId }, {
    'x-actor-id': 'qa-community-a',
    'x-actor-role': 'community_manager',
  });
  assert(ownLinkProduct.status === 201, `community own product link expected 201, got ${ownLinkProduct.status}`);

  const ownLinkedProducts = await req('GET', `/api/campaigns/${campaignId}/products`, undefined, {
    'x-actor-id': 'qa-community-a',
    'x-actor-role': 'community_manager',
  });
  assert(ownLinkedProducts.status === 200, `community campaign products expected 200, got ${ownLinkedProducts.status}`);
  assert(
    Array.isArray(ownLinkedProducts.data?.links) &&
      ownLinkedProducts.data.links.some((link) => link.catalogItemId === linkedCatalogItemId),
    'campaign products list missing linked catalog item'
  );
  report.push('CC-06 owner links a published CatalogItem into the campaign vitrine');

  const foreignSubmit = await req('POST', `/api/campaigns/${campaignId}/submit`, {}, {
    'x-actor-id': 'qa-community-b',
    'x-actor-role': 'community_manager',
  });
  assert(foreignSubmit.status === 403, `foreign community submit expected 403, got ${foreignSubmit.status}`);
  report.push('CC-07 foreign community cannot submit another owner campaign');

  const ownSubmit = await req('POST', `/api/campaigns/${campaignId}/submit`, {}, {
    'x-actor-id': 'qa-community-a',
    'x-actor-role': 'community_manager',
  });
  assert(ownSubmit.status === 200, `community own submit expected 200, got ${ownSubmit.status}`);
  report.push('CC-08 owner submits campaign to pending_review');

  const pendingReviews = await req('GET', '/api/admin/impact-reviews?status=pending_review', undefined, adminHeaders);
  assert(pendingReviews.status === 200, `admin pending impact reviews expected 200, got ${pendingReviews.status}`);
  const campaignReview = Array.isArray(pendingReviews.data?.reviews)
    ? pendingReviews.data.reviews.find((review) => review.entityType === 'Campaign' && review.entityId === campaignId)
    : null;
  assert(campaignReview?.reviewId, 'campaign impact review missing from pending queue');

  const rejectCampaignReview = await req(
    'POST',
    `/api/admin/impact-reviews/${campaignReview.reviewId}/reject`,
    { reason: rejectionReason },
    adminHeaders
  );
  assert(rejectCampaignReview.status === 200, `campaign impact review reject expected 200, got ${rejectCampaignReview.status}`);
  report.push('CC-08B platform admin rejection returns campaign to rejected with explicit reason');

  const ownerAfterReject = await req('GET', '/api/campaigns', undefined, {
    'x-actor-id': 'qa-community-a',
    'x-actor-role': 'community_manager',
  });
  assert(ownerAfterReject.status === 200, `community own campaigns after rejection expected 200, got ${ownerAfterReject.status}`);
  const rejectedCampaign = Array.isArray(ownerAfterReject.data?.campaigns)
    ? ownerAfterReject.data.campaigns.find((campaign) => campaign.campaignId === campaignId)
    : null;
  assert(rejectedCampaign?.status === 'rejected', `campaign should be rejected after impact review rejection, got ${String(rejectedCampaign?.status)}`);
  assert(rejectedCampaign?.governance?.status === 'rejected', `campaign governance should be rejected, got ${String(rejectedCampaign?.governance?.status)}`);
  assert(
    rejectedCampaign?.governance?.decisionReason === rejectionReason,
    `campaign governance reason mismatch: ${String(rejectedCampaign?.governance?.decisionReason)}`
  );
  report.push('CC-08C owner sees rejection status and reason in own campaign workspace');

  const resubmitAfterReject = await req('POST', `/api/campaigns/${campaignId}/submit`, {}, {
    'x-actor-id': 'qa-community-a',
    'x-actor-role': 'community_manager',
  });
  assert(resubmitAfterReject.status === 200, `community resubmit after rejection expected 200, got ${resubmitAfterReject.status}`);
  report.push('CC-08D owner can adjust and resubmit after governance rejection');

  const communityLedger = await req('GET', '/api/commissions/me', undefined, {
    'x-actor-id': 'qa-community-a',
    'x-actor-role': 'community_manager',
  });
  assert(communityLedger.status === 200, `community ledger expected 200, got ${communityLedger.status}`);
  report.push('CC-09 community manager can open financial ledger endpoint');

  const anonymousArtworkQueue = await req('GET', '/api/artworks');
  assert(anonymousArtworkQueue.status === 401, `anonymous artwork queue expected 401, got ${anonymousArtworkQueue.status}`);
  report.push('CC-09B artwork queue requires authenticated session');

  const customerArtworkQueue = await req('GET', '/api/artworks', undefined, {
    'x-actor-id': 'qa-customer-a',
    'x-actor-role': 'customer',
  });
  assert(customerArtworkQueue.status === 200, `customer artwork own queue expected 200, got ${customerArtworkQueue.status}`);
  assert(Array.isArray(customerArtworkQueue.data?.artworks) && customerArtworkQueue.data.artworks.length === 0, 'customer artwork queue should be empty and scoped');
  report.push('CC-09C non-review role cannot expand artwork queue beyond own scope');

  const acceptTerms = await req(
    'POST',
    '/api/terms/accept',
    {
      userId: 'qa-artist-a',
      entityType: 'artist',
      entityId: 'qa-artist-a',
      termType: 'artist_base',
      termVersion: 'qa-v1',
    },
    { 'x-actor-id': 'qa-artist-a', 'x-actor-role': 'artist' }
  );
  assert(acceptTerms.status === 201 || acceptTerms.status === 200, `artist terms accept expected 200|201, got ${acceptTerms.status}`);

  const createArtwork = await req(
    'POST',
    '/api/artworks',
    {
      sourceAsset: 'qa://artwork/community-curation',
      metadata: {
        theme: 'Esperanca urbana',
        category: 'manifesto',
        tags: ['qa', 'curation', 'community'],
      },
    },
    { 'x-actor-id': 'qa-artist-a', 'x-actor-role': 'artist' }
  );
  assert(createArtwork.status === 201, `artist create artwork expected 201, got ${createArtwork.status}`);
  const artworkId = createArtwork.data?.artwork?.artworkId;
  assert(typeof artworkId === 'string', 'artworkId missing');
  report.push('CC-10 artist submits artwork to real curation queue');

  const artistOwnQueue = await req('GET', '/api/artworks', undefined, {
    'x-actor-id': 'qa-artist-a',
    'x-actor-role': 'artist',
  });
  assert(artistOwnQueue.status === 200, `artist own artwork queue expected 200, got ${artistOwnQueue.status}`);
  assert(
    Array.isArray(artistOwnQueue.data?.artworks) && artistOwnQueue.data.artworks.some((artwork) => artwork.artworkId === artworkId),
    'artist own queue missing submitted artwork'
  );
  report.push('CC-10B artist reads only own submitted artwork scope');

  const artistForeignQueue = await req('GET', `/api/artworks?authorId=${encodeURIComponent('qa-artist-b')}`, undefined, {
    'x-actor-id': 'qa-artist-a',
    'x-actor-role': 'artist',
  });
  assert(artistForeignQueue.status === 403, `artist foreign artwork queue expected 403, got ${artistForeignQueue.status}`);
  report.push('CC-10C artist cannot query another author artwork scope');

  const curatorQueue = await req('GET', '/api/artworks', undefined, {
    'x-actor-id': 'qa-curator',
    'x-actor-role': 'curator',
  });
  assert(curatorQueue.status === 200, `curator artwork queue expected 200, got ${curatorQueue.status}`);
  assert(
    Array.isArray(curatorQueue.data?.artworks) && curatorQueue.data.artworks.some((artwork) => artwork.artworkId === artworkId),
    'curator queue missing submitted artwork'
  );
  report.push('CC-11 curator reads full artwork queue');

  const anonymousStartReview = await req('POST', `/api/artworks/${artworkId}/start-review`, {});
  assert(anonymousStartReview.status === 401, `anonymous artwork start-review expected 401, got ${anonymousStartReview.status}`);
  report.push('CC-11A artwork review start rejects anonymous actor');

  const artistStartReview = await req('POST', `/api/artworks/${artworkId}/start-review`, {}, {
    'x-actor-id': 'qa-artist-a',
    'x-actor-role': 'artist',
  });
  assert(artistStartReview.status === 403, `artist artwork start-review expected 403, got ${artistStartReview.status}`);
  report.push('CC-11AA artist cannot start own artwork review');

  const anonymousApprove = await req('POST', `/api/artworks/${artworkId}/approve`, {});
  assert(anonymousApprove.status === 401, `anonymous artwork approve expected 401, got ${anonymousApprove.status}`);
  report.push('CC-11B artwork approval rejects anonymous actor');

  const artistApprove = await req('POST', `/api/artworks/${artworkId}/approve`, {}, {
    'x-actor-id': 'qa-artist-a',
    'x-actor-role': 'artist',
  });
  assert(artistApprove.status === 403, `artist artwork approve expected 403, got ${artistApprove.status}`);
  report.push('CC-11C artist cannot approve own artwork');

  const prematureApprove = await req('POST', `/api/artworks/${artworkId}/approve`, {}, {
    'x-actor-id': 'qa-curator',
    'x-actor-role': 'curator',
  });
  assert(prematureApprove.status === 409, `curator approve without review expected 409, got ${prematureApprove.status}`);
  report.push('CC-11D curator cannot approve artwork before review starts');

  const startReview = await req('POST', `/api/artworks/${artworkId}/start-review`, {}, {
    'x-actor-id': 'qa-curator',
    'x-actor-role': 'curator',
  });
  assert(startReview.status === 200, `curator start-review expected 200, got ${startReview.status}`);
  assert(startReview.data?.artwork?.status === 'under_review', 'artwork should move to under_review');
  report.push('CC-11E curator moves artwork from submitted to under_review');

  const approveArtwork = await req('POST', `/api/artworks/${artworkId}/approve`, {}, {
    'x-actor-id': 'qa-curator',
    'x-actor-role': 'curator',
  });
  assert(approveArtwork.status === 200, `curator approve artwork expected 200, got ${approveArtwork.status}`);
  report.push('CC-12 curator approves artwork after review start');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
