import { withWebhookSignature } from '../lib/qa-webhook-signature.mjs';
import { ensureQaEnvLoaded } from '../lib/qa-env.mjs';
import { postBootstrap, resolveSeededCatalogVariant } from '../lib/catalog-seed-helpers.mjs';

ensureQaEnvLoaded();

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3338';
const provider = process.env.QA_PAYMENT_PROVIDER ?? process.env.PAYMENT_PROVIDER ?? 'sandbox';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function resolveCheckoutMethod(currentProvider) {
  if (currentProvider === 'stripe' || currentProvider === 'cielo') return 'card';
  return 'pix';
}

async function get(pathname, headers = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, { headers });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // ignore
  }
  return { status: response.status, data };
}

async function post(pathname, body, headers = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body ?? {}),
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // ignore
  }
  return { status: response.status, data };
}

async function shipOrder(orderId) {
  const createProd = await post(
    '/api/production-jobs',
    { orderId },
    { 'x-actor-id': 'qa-production-campaign-revenue', 'x-actor-role': 'production_operator' }
  );
  assert(createProd.status === 200 || createProd.status === 201, `production create expected 200|201, got ${createProd.status}`);

  const byOrder = await get(`/api/production-jobs/by-order/${orderId}`, {
    'x-actor-id': 'qa-production-campaign-revenue',
    'x-actor-role': 'production_operator',
  });
  assert(byOrder.status === 200, `production by order expected 200, got ${byOrder.status}`);
  const jobId = byOrder.data?.job?.productionJobId;
  assert(typeof jobId === 'string', 'productionJobId missing');

  const start = await post(
    `/api/production-jobs/${jobId}/start`,
    {},
    { 'x-actor-id': 'qa-production-campaign-revenue', 'x-actor-role': 'production_operator' }
  );
  assert(start.status === 200, `production start expected 200, got ${start.status}`);

  const ship = await post(
    `/api/production-jobs/${jobId}/ship`,
    { trackingCode: `BR-CMP-${Date.now()}`, carrier: 'Correios' },
    { 'x-actor-id': 'qa-production-campaign-revenue', 'x-actor-role': 'production_operator' }
  );
  assert(ship.status === 200, `production ship expected 200, got ${ship.status}`);
}

async function run() {
  const report = [];
  const ownerHeaders = { 'x-actor-id': 'qa-community-revenue-owner', 'x-actor-role': 'community_manager' };
  const artistHeaders = { 'x-actor-id': 'qa-artist-revenue-foreign', 'x-actor-role': 'artist' };
  const adminHeaders = { 'x-actor-id': 'qa-admin-revenue', 'x-actor-role': 'platform_admin' };
  const customerHeaders = { 'x-actor-id': 'qa-customer-campaign-revenue', 'x-actor-role': 'customer' };

  const seed = await postBootstrap(baseUrl);
  assert(seed.status === 200 || seed.status === 201, `catalog bootstrap expected 200|201, got ${seed.status}`);
  const seeded = await resolveSeededCatalogVariant(baseUrl);
  report.push(`QA-COMMUNITY-REVENUE-00 catalog item resolved (${seeded.item.catalogItemId})`);

  const create = await post(
    '/api/campaigns',
    {
      organizationId: 'ORG-QA-CAMPAIGN-REVENUE',
      name: `Campanha receita ${Date.now()}`,
      description: 'Campanha usada para reconciliar receita por atribuicao real.',
      budget: 1800,
      progressivePriceRule: 'baseline',
    },
    ownerHeaders
  );
  assert(create.status === 201, `campaign create expected 201, got ${create.status}`);
  const campaignId = create.data?.campaign?.campaignId;
  assert(typeof campaignId === 'string', 'campaignId missing');

  const linkProduct = await post(`/api/campaigns/${campaignId}/products`, { catalogItemId: seeded.item.catalogItemId }, ownerHeaders);
  assert(linkProduct.status === 201 || linkProduct.status === 200, `campaign product link expected 200|201, got ${linkProduct.status}`);

  const submit = await post(`/api/campaigns/${campaignId}/submit`, {}, ownerHeaders);
  assert(submit.status === 200, `campaign submit expected 200, got ${submit.status}`);

  const queue = await get('/api/admin/impact-reviews?status=pending_review&entityType=Campaign', adminHeaders);
  assert(queue.status === 200, `impact queue expected 200, got ${queue.status}`);
  const pendingRows = Array.isArray(queue.data?.reviews) ? queue.data.reviews : [];
  const review = pendingRows.find((row) => row.entityId === campaignId);
  assert(review?.reviewId, 'campaign impact review not found');

  const approveReview = await post(
    `/api/admin/impact-reviews/${review.reviewId}/approve`,
    { reason: 'qa approve campaign revenue path' },
    adminHeaders
  );
  assert(approveReview.status === 200, `impact review approve expected 200, got ${approveReview.status}`);

  const activate = await post(`/api/campaigns/${campaignId}/approve`, {}, adminHeaders);
  assert(activate.status === 200, `campaign activate expected 200, got ${activate.status}`);
  report.push('QA-COMMUNITY-REVENUE-01 campaign approved and active');

  const order = await post(
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
      campaignId,
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
    customerHeaders
  );
  assert(order.status === 201, `campaign order expected 201, got ${order.status}`);
  const orderId = order.data?.order?.orderId;
  assert(typeof orderId === 'string', 'orderId missing');

  const checkout = await post(
    '/api/payments/checkout',
    {
      orderId,
      method: resolveCheckoutMethod(provider),
      provider,
      amount: seeded.variant.price,
      currency: 'BRL',
      items: [{ id: seeded.item.catalogItemId, name: seeded.item.name, quantity: 1, unitPrice: seeded.variant.price }],
    },
    { 'x-idempotency-key': `qa-campaign-revenue-checkout-${Date.now()}-${Math.random()}` }
  );
  assert(checkout.status === 200, `checkout expected 200, got ${checkout.status}`);
  const providerReference = checkout.data?.payment?.providerReference;
  assert(typeof providerReference === 'string', 'providerReference missing');

  const webhookPayload = {
    eventId: `evt-campaign-revenue-${Date.now()}-${Math.random()}`,
    providerReference,
    event: 'payment.approved',
    ...(provider ? { provider } : {}),
  };
  const webhook = await post(
    '/api/payments/webhook',
    webhookPayload,
    withWebhookSignature(webhookPayload, {
      'x-idempotency-key': `qa-campaign-revenue-wh-${Date.now()}-${Math.random()}`,
      ...(provider ? { 'x-provider': provider } : {}),
    })
  );
  assert(webhook.status === 200, `webhook expected 200, got ${webhook.status}`);

  await shipOrder(orderId);
  report.push('QA-COMMUNITY-REVENUE-02 paid and shipped order generated community commission');

  const byCampaign = await get('/api/commissions/me/campaigns?includeOrders=true', ownerHeaders);
  assert(byCampaign.status === 200, `community revenue by campaign expected 200, got ${byCampaign.status}`);
  const campaignRows = Array.isArray(byCampaign.data?.campaigns) ? byCampaign.data.campaigns : [];
  const campaignRow = campaignRows.find((row) => row.campaignId === campaignId);
  assert(campaignRow, 'campaign revenue row not found');
  assert(campaignRow.orderCount >= 1, `campaign orderCount expected >= 1, got ${String(campaignRow?.orderCount)}`);
  assert(campaignRow.commissionCount >= 1, `campaign commissionCount expected >= 1, got ${String(campaignRow?.commissionCount)}`);
  assert(Number(campaignRow.availableGross) > 0, `campaign availableGross expected > 0, got ${String(campaignRow?.availableGross)}`);
  const orderRows = Array.isArray(byCampaign.data?.orders) ? byCampaign.data.orders : [];
  assert(orderRows.some((row) => row.campaignId === campaignId && row.orderId === orderId), 'campaign order drilldown missing');
  report.push('QA-COMMUNITY-REVENUE-03 owner sees campaign breakdown with real attributed commission');

  const aggregatedLedger = await get('/api/commissions/me', ownerHeaders);
  assert(aggregatedLedger.status === 200, `community aggregated ledger expected 200, got ${aggregatedLedger.status}`);
  const availableGross = Number(aggregatedLedger.data?.balances?.availableGross ?? 0);
  assert(availableGross >= Number(campaignRow.availableGross), 'aggregated ledger should stay coherent with campaign breakdown');
  report.push('QA-COMMUNITY-REVENUE-04 aggregate community ledger remains coherent');

  const detail = await get(`/api/campaigns/${campaignId}`, ownerHeaders);
  assert(detail.status === 200, `campaign detail expected 200, got ${detail.status}`);
  assert(Number(detail.data?.attributionSummary?.availableGross ?? 0) >= Number(campaignRow.availableGross), 'campaign detail attribution should reflect campaign breakdown');

  const artistForbidden = await get('/api/commissions/me/campaigns', artistHeaders);
  assert(artistForbidden.status === 403, `artist community breakdown expected 403, got ${artistForbidden.status}`);
  report.push('QA-COMMUNITY-REVENUE-05 artist cannot access community campaign revenue endpoint');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, campaignId, orderId, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
