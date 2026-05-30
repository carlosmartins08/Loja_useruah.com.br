const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3212';

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

async function createPaidOrder(customerId) {
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
    items: [{ catalogItemId: '1', variantId: 'VAR-1-OFFWHITE', quantity: 1, unitPrice: 89.9 }],
    customer: { id: customerId },
  });
  assert(order.status === 201, `order expected 201, got ${order.status}`);
  const orderId = order.data?.order?.orderId;
  assert(typeof orderId === 'string', 'orderId missing');

  const checkout = await postWithRetry(
    '/api/payments/checkout',
    {
      orderId,
      method: 'pix',
      provider: 'sandbox',
      amount: 89.9,
      currency: 'BRL',
      items: [{ id: '1', name: 'Camiseta QA payout', quantity: 1, unitPrice: 89.9 }],
    },
    { 'x-idempotency-key': `qa-payout-checkout-${Date.now()}-${Math.random()}` }
  );
  assert(checkout.status === 200, `checkout expected 200, got ${checkout.status}`);
  const providerReference = checkout.data?.payment?.providerReference;
  assert(typeof providerReference === 'string', 'providerReference missing');

  const webhook = await postWithRetry(
    '/api/payments/webhook',
    { eventId: `evt-payout-${Date.now()}-${Math.random()}`, providerReference, event: 'payment.approved' },
    { 'x-idempotency-key': `qa-payout-wh-${Date.now()}-${Math.random()}` }
  );
  assert(webhook.status === 200, `webhook expected 200, got ${webhook.status}`);
  return orderId;
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
  const artistHeaders = { 'x-actor-id': 'artist-default', 'x-actor-role': 'artist' };
  const adminHeaders = { 'x-actor-id': 'qa-admin', 'x-actor-role': 'platform_admin' };

  await post('/api/catalog-items/bootstrap', {}, { 'x-actor-id': 'qa-curator', 'x-actor-role': 'curator' });
  const orderId = await createPaidOrder('customer-payout-ledger');
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

  const startReview = await post(`/api/payouts/${payoutId}/start-review`, {}, adminHeaders);
  assert(startReview.status === 200, `start-review expected 200, got ${startReview.status}`);

  const approvePayout = await post(`/api/payouts/${payoutId}/approve`, {}, adminHeaders);
  assert(approvePayout.status === 200, `payout approve expected 200, got ${approvePayout.status}`);

  const markPaid = await post(`/api/payouts/${payoutId}/mark-paid`, {}, adminHeaders);
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
