import { withWebhookSignature } from '../lib/qa-webhook-signature.mjs';
import { ensureQaEnvLoaded } from '../lib/qa-env.mjs';
import { postBootstrap, resolveSeededCatalogVariant } from '../lib/catalog-seed-helpers.mjs';

ensureQaEnvLoaded();

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3212';
const provider = process.env.QA_PAYMENT_PROVIDER ?? process.env.PAYMENT_PROVIDER ?? 'sandbox';
const QA_USERS = {
  finance: { email: 'finance@useruah.com.br', password: 'finance123', expectedRole: 'finance_admin' },
  admin: { email: 'admin@useruah.com.br', password: 'admin123', expectedRole: 'platform_admin' },
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function resolveCheckoutMethod(currentProvider) {
  if (currentProvider === 'stripe' || currentProvider === 'cielo') return 'card';
  return 'pix';
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

async function postWithRetry(pathname, body, headers = {}, retries = 2) {
  let last = null;
  for (let i = 0; i < retries; i += 1) {
    last = await post(pathname, body, headers);
    if (last.status < 500) return last;
  }
  return last;
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

async function getWithRetry(pathname, headers = {}, retries = 3) {
  let last = null;
  for (let i = 0; i < retries; i += 1) {
    last = await get(pathname, headers);
    if (last.status !== 500) return last;
  }
  return last;
}

async function loginLocalUser(user) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // ignore
  }
  assert(response.status === 200, `${user.expectedRole} login expected 200, got ${response.status}`);
  const setCookie = response.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/ruah_session=([^;]+)/);
  assert(match?.[1], `${user.expectedRole} ruah_session cookie missing after login`);
  assert(data?.session?.activeRole === user.expectedRole, `${user.expectedRole} activeRole mismatch`);
  return {
    cookieValue: match[1],
    cookieHeader: `ruah_session=${match[1]}`,
    session: data.session,
  };
}

async function createPaidOrder(customerId, seeded) {
  const order = await post('/api/orders', {
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
    customer: { id: customerId },
  }, {
    'x-actor-id': customerId,
    'x-actor-role': 'customer',
  });
  assert(order.status === 201, `order expected 201, got ${order.status}`);
  const orderId = order.data?.order?.orderId;
  const artistOwnerId = order.data?.order?.items?.[0]?.artworkAuthorId;
  assert(typeof orderId === 'string', 'orderId missing');
  assert(typeof artistOwnerId === 'string' && artistOwnerId.length > 0, 'artistOwnerId missing from order snapshot');

  const checkoutMethod = resolveCheckoutMethod(provider);
  const checkout = await postWithRetry(
    '/api/payments/checkout',
    {
      orderId,
      method: checkoutMethod,
      provider,
      amount: seeded.variant.price,
      currency: 'BRL',
      items: [{ id: seeded.item.catalogItemId, name: seeded.item.name, quantity: 1, unitPrice: seeded.variant.price }],
    },
    { 'x-idempotency-key': `qa-payout-checkout-${Date.now()}-${Math.random()}` }
  );
  assert(checkout.status === 200, `checkout expected 200, got ${checkout.status}`);
  const providerReference = checkout.data?.payment?.providerReference;
  assert(typeof providerReference === 'string', 'providerReference missing');

  const webhookPayload = {
    eventId: `evt-payout-${Date.now()}-${Math.random()}`,
    providerReference,
    event: 'payment.approved',
    ...(provider ? { provider } : {}),
  };
  const webhook = await postWithRetry(
    '/api/payments/webhook',
    webhookPayload,
    withWebhookSignature(webhookPayload, {
      'x-idempotency-key': `qa-payout-wh-${Date.now()}-${Math.random()}`,
      ...(provider ? { 'x-provider': provider } : {}),
    })
  );
  assert(webhook.status === 200, `webhook expected 200, got ${webhook.status}`);
  return { orderId, artistOwnerId };
}

async function shipOrder(orderId) {
  const createProd = await post(
    '/api/production-jobs',
    { orderId },
    { 'x-actor-id': 'qa-production', 'x-actor-role': 'production_operator' }
  );
  assert(createProd.status === 200 || createProd.status === 201, `production create expected 200|201, got ${createProd.status}`);

  const byOrder = await getWithRetry(`/api/production-jobs/by-order/${orderId}`, {
    'x-actor-id': 'qa-production',
    'x-actor-role': 'production_operator',
  });
  assert(byOrder.status === 200, `production by order expected 200, got ${byOrder.status}`);
  const jobId = byOrder.data?.job?.productionJobId;
  assert(typeof jobId === 'string', 'productionJobId missing');

  const start = await post(
    `/api/production-jobs/${jobId}/start`,
    {},
    { 'x-actor-id': 'qa-production', 'x-actor-role': 'production_operator' }
  );
  assert(start.status === 200, `production start expected 200, got ${start.status}`);

  const ship = await post(
    `/api/production-jobs/${jobId}/ship`,
    { trackingCode: `BR-${Date.now()}`, carrier: 'Correios' },
    { 'x-actor-id': 'qa-production', 'x-actor-role': 'production_operator' }
  );
  assert(ship.status === 200, `production ship expected 200, got ${ship.status}`);
}

async function run() {
  const report = [];
  const financeSession = await loginLocalUser(QA_USERS.finance);
  const adminSession = await loginLocalUser(QA_USERS.admin);
  const adminHeaders = { cookie: adminSession.cookieHeader };
  const financeHeaders = { cookie: financeSession.cookieHeader };
  report.push('QA-PAYOUT-LEDGER-00A authenticated finance/admin sessions ready');

  const seed = await postBootstrap(baseUrl);
  if (seed.status === 200) {
    report.push('QA-PAYOUT-LEDGER-00 bootstrap catalog ready');
  } else {
    report.push(`QA-PAYOUT-LEDGER-00 bootstrap skipped (status ${seed.status})`);
  }
  const seeded = await resolveSeededCatalogVariant(baseUrl);
  report.push(`QA-PAYOUT-LEDGER-00B catalog item resolved (${seeded.variant.variantId})`);
  const checkoutMethod = resolveCheckoutMethod(provider);
  report.push(`QA-PAYOUT-LEDGER-00C checkout method resolved (${checkoutMethod})`);

  const { orderId, artistOwnerId } = await createPaidOrder('customer-payout-ledger', seeded);
  const artistHeaders = { 'x-actor-id': artistOwnerId, 'x-actor-role': 'artist' };
  await shipOrder(orderId);
  report.push('QA-PAYOUT-LEDGER-01 paid+shipped order generated commission availability');

  const ledger = await get('/api/commissions/me', artistHeaders);
  assert(ledger.status === 200, `commissions/me expected 200, got ${ledger.status}`);
  const availableToWithdraw = Number(ledger.data?.balances?.availableToWithdraw ?? 0);
  assert(availableToWithdraw > 0, `availableToWithdraw expected > 0, got ${availableToWithdraw}`);
  report.push('QA-PAYOUT-LEDGER-02 artist has withdrawable balance');

  const payoutReq = await post(
    '/api/payouts',
    { amount: availableToWithdraw, currency: 'BRL' },
    { ...artistHeaders, 'x-idempotency-key': `qa-payout-req-${Date.now()}-${Math.random()}` }
  );
  assert(payoutReq.status === 200 || payoutReq.status === 201, `payout request expected 200|201, got ${payoutReq.status}`);
  const payoutId = payoutReq.data?.payout?.payoutId;
  assert(typeof payoutId === 'string', 'payoutId missing');
  report.push('QA-PAYOUT-LEDGER-03 payout requested');

  const reviewList = await get('/api/admin/impact-reviews?status=pending_review', adminHeaders);
  assert(reviewList.status === 200, `impact review list expected 200, got ${reviewList.status}`);
  const pending = Array.isArray(reviewList.data?.reviews) ? reviewList.data.reviews : [];
  const payoutReview = pending.find((row) => row.entityType === 'Payout' && row.entityId === payoutId);
  assert(payoutReview?.reviewId, 'payout impact review not found');

  const approveReview = await post(`/api/admin/impact-reviews/${payoutReview.reviewId}/approve`, { reason: 'qa payout review approval' }, adminHeaders);
  assert(approveReview.status === 200, `impact review approve expected 200, got ${approveReview.status}`);

  const startReview = await post(`/api/payouts/${payoutId}/start-review`, {}, financeHeaders);
  assert(startReview.status === 200, `start-review expected 200, got ${startReview.status}`);

  const approvePayout = await post(`/api/payouts/${payoutId}/approve`, {}, financeHeaders);
  assert(approvePayout.status === 200, `payout approve expected 200, got ${approvePayout.status}`);

  const markPaid = await post(`/api/payouts/${payoutId}/mark-paid`, {}, financeHeaders);
  assert(markPaid.status === 200, `mark-paid expected 200, got ${markPaid.status}`);
  assert(markPaid.data?.reconciliation?.commissionStatusApplied === 'paid', 'commissionStatusApplied should be paid');
  report.push('QA-PAYOUT-LEDGER-04 payout approved->paid with ledger reconciliation');

  const ledgerAfter = await get('/api/commissions/me', artistHeaders);
  assert(ledgerAfter.status === 200, `commissions/me after expected 200, got ${ledgerAfter.status}`);
  const hasPaidCommission = Array.isArray(ledgerAfter.data?.commissions) && ledgerAfter.data.commissions.some((row) => row.status === 'paid');
  assert(hasPaidCommission, 'expected at least one commission with status paid');
  report.push('QA-PAYOUT-LEDGER-05 linked commissions moved to paid');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, payoutId, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
