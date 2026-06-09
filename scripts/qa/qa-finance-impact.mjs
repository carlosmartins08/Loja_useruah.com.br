const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3211';

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

async function resolveImpactReviewId(entityType, entityId, headers) {
  const pending = await get('/api/admin/impact-reviews?status=pending_review', headers);
  assert(pending.status === 200, `impact list expected 200, got ${pending.status}`);
  const reviews = Array.isArray(pending.data?.reviews) ? pending.data.reviews : [];
  const row = reviews.find((item) => item.entityType === entityType && item.entityId === entityId);
  assert(row?.reviewId, `${entityType} impact review not found`);
  return row.reviewId;
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

  const checkout = await post(
    '/api/payments/checkout',
    {
      orderId,
      method: 'pix',
      provider: 'sandbox',
      amount: 89.9,
      currency: 'BRL',
      items: [{ id: '1', name: 'Camiseta QA', quantity: 1, unitPrice: 89.9 }],
    },
    { 'x-idempotency-key': `qa-fin-checkout-${Date.now()}-${Math.random()}` }
  );
  assert(checkout.status === 200, `checkout expected 200, got ${checkout.status}`);
  const providerReference = checkout.data?.payment?.providerReference;
  assert(typeof providerReference === 'string', 'providerReference missing');

  const webhook = await post(
    '/api/payments/webhook',
    { eventId: `evt-fin-${Date.now()}-${Math.random()}`, providerReference, event: 'payment.approved' },
    { 'x-idempotency-key': `qa-fin-wh-${Date.now()}-${Math.random()}` }
  );
  assert(webhook.status === 200, `webhook expected 200, got ${webhook.status}`);
  return { orderId, providerReference };
}

async function run() {
  const report = [];
  const adminHeaders = { 'x-actor-id': 'qa-admin', 'x-actor-role': 'platform_admin' };
  const supportHeaders = { 'x-actor-id': 'qa-support', 'x-actor-role': 'support_agent' };
  const financeHeaders = { 'x-actor-id': 'qa-finance', 'x-actor-role': 'finance_admin' };

  await post('/api/catalog-items/bootstrap', {}, { 'x-actor-id': 'qa-curator', 'x-actor-role': 'curator' });

  const paidA = await createPaidOrder('customer-fin-a');
  report.push('QA-FIN-IMPACT-01 paid order created');

  const refundReq = await post(
    '/api/refunds',
    { orderId: paidA.orderId, reason: 'solicitacao QA de estorno' },
    { ...supportHeaders, 'x-idempotency-key': `qa-refund-${Date.now()}-${Math.random()}` }
  );
  assert(refundReq.status === 201 || refundReq.status === 200, `refund request expected 201|200, got ${refundReq.status}`);
  const refundId = refundReq.data?.refund?.refundId;
  assert(typeof refundId === 'string', 'refundId missing');
  report.push('QA-FIN-IMPACT-02 refund requested + impact review created');

  const blockedApprove = await post(`/api/refunds/${refundId}/approve`, {}, financeHeaders);
  assert(blockedApprove.status === 409, `refund approve while pending review expected 409, got ${blockedApprove.status}`);
  assert(blockedApprove.data?.detail === 'impact_review_pending', `expected impact_review_pending, got ${String(blockedApprove.data?.detail)}`);
  report.push('QA-FIN-IMPACT-03 refund approve blocked by pending impact review');

  let refundReviewId = await resolveImpactReviewId('Refund', refundId, adminHeaders);
  let approveReview = await post(`/api/admin/impact-reviews/${refundReviewId}/approve`, { reason: 'qa approve refund review' }, adminHeaders);
  if (approveReview.status === 404) {
    refundReviewId = await resolveImpactReviewId('Refund', refundId, adminHeaders);
    approveReview = await post(`/api/admin/impact-reviews/${refundReviewId}/approve`, { reason: 'qa approve refund review retry' }, adminHeaders);
  }
  assert(approveReview.status === 200, `impact review approve expected 200, got ${approveReview.status}`);

  const approveRefund = await post(`/api/refunds/${refundId}/approve`, {}, financeHeaders);
  assert(approveRefund.status === 200, `refund approve after review expected 200, got ${approveRefund.status}`);
  report.push('QA-FIN-IMPACT-04 refund approved after impact review approval');

  const paidB = await createPaidOrder('customer-fin-b');
  const chargebackEventId = `evt-chb-${Date.now()}-${Math.random()}`;
  const chb = await post(
    '/api/chargebacks/webhook',
    { eventId: chargebackEventId, providerReference: paidB.providerReference, reason: 'qa chargeback event' },
    { 'x-idempotency-key': `qa-chb-${Date.now()}-${Math.random()}` }
  );
  assert(chb.status === 200, `chargeback webhook expected 200, got ${chb.status}`);

  const chbReviewId = await resolveImpactReviewId('Chargeback', chargebackEventId, adminHeaders).catch(async () => {
    const pending2 = await get('/api/admin/impact-reviews?status=pending_review', adminHeaders);
    assert(pending2.status === 200, `impact list 2 expected 200, got ${pending2.status}`);
    const reviews2 = Array.isArray(pending2.data?.reviews) ? pending2.data.reviews : [];
    const chbReview = reviews2.find((row) => row.entityType === 'Chargeback' && String(row.entityId).startsWith('evt-chb-'));
    assert(chbReview?.reviewId, 'chargeback impact review not found');
    return chbReview.reviewId;
  });
  assert(typeof chbReviewId === 'string' && chbReviewId.length > 0, 'chargeback impact review id missing');
  report.push('QA-FIN-IMPACT-05 chargeback webhook creates pending impact review');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, report, refundId }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
