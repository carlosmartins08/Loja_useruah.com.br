import { withWebhookSignature } from '../lib/qa-webhook-signature.mjs';
import { ensureQaEnvLoaded } from '../lib/qa-env.mjs';
import { postBootstrap, resolveSeededCatalogVariant } from '../lib/catalog-seed-helpers.mjs';

ensureQaEnvLoaded();

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3211';
const provider = process.env.QA_PAYMENT_PROVIDER ?? process.env.PAYMENT_PROVIDER ?? 'sandbox';
const QA_USERS = {
  customer: { email: 'customer@useruah.com.br', password: 'customer123', expectedRole: 'customer' },
  support: { email: 'support@useruah.com.br', password: 'support123', expectedRole: 'support_agent' },
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

async function resolveImpactReviewId(entityType, entityId, headers) {
  const pending = await get('/api/admin/impact-reviews?status=pending_review', headers);
  assert(pending.status === 200, `impact list expected 200, got ${pending.status}`);
  const reviews = Array.isArray(pending.data?.reviews) ? pending.data.reviews : [];
  const row = reviews.find((item) => item.entityType === entityType && item.entityId === entityId);
  assert(row?.reviewId, `${entityType} impact review not found`);
  return row.reviewId;
}

async function createPaidOrder(customerSession, seeded) {
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
      items: [
        {
          catalogItemId: seeded.item.catalogItemId,
          variantId: seeded.variant.variantId,
          quantity: 1,
          unitPrice: seeded.variant.price,
        },
      ],
      customer: { id: customerSession.session.userId },
    },
    { cookie: customerSession.cookieHeader }
  );
  assert(order.status === 201, `order expected 201, got ${order.status}`);
  const orderId = order.data?.order?.orderId;
  assert(typeof orderId === 'string', 'orderId missing');

  const checkoutMethod = resolveCheckoutMethod(provider);
  const checkout = await post(
    '/api/payments/checkout',
    {
      orderId,
      method: checkoutMethod,
      provider,
      amount: seeded.variant.price,
      currency: 'BRL',
      items: [{ id: seeded.item.catalogItemId, name: seeded.item.name, quantity: 1, unitPrice: seeded.variant.price }],
    },
    { 'x-idempotency-key': `qa-fin-checkout-${Date.now()}-${Math.random()}` }
  );
  assert(checkout.status === 200, `checkout expected 200, got ${checkout.status}`);
  const providerReference = checkout.data?.payment?.providerReference;
  assert(typeof providerReference === 'string', 'providerReference missing');

  const webhookPayload = {
    eventId: `evt-fin-${Date.now()}-${Math.random()}`,
    providerReference,
    event: 'payment.approved',
    ...(provider ? { provider } : {}),
  };
  const webhook = await post(
    '/api/payments/webhook',
    webhookPayload,
    withWebhookSignature(webhookPayload, {
      'x-idempotency-key': `qa-fin-wh-${Date.now()}-${Math.random()}`,
      ...(provider ? { 'x-provider': provider } : {}),
    })
  );
  assert(webhook.status === 200, `webhook expected 200, got ${webhook.status}`);
  return { orderId, providerReference };
}

async function run() {
  const report = [];
  const customerSession = await loginLocalUser(QA_USERS.customer);
  const supportSession = await loginLocalUser(QA_USERS.support);
  const financeSession = await loginLocalUser(QA_USERS.finance);
  const adminSession = await loginLocalUser(QA_USERS.admin);
  const adminHeaders = { cookie: adminSession.cookieHeader };
  const supportHeaders = { cookie: supportSession.cookieHeader };
  const financeHeaders = { cookie: financeSession.cookieHeader };
  report.push('QA-FIN-IMPACT-00A authenticated sessions ready for customer/support/finance/admin');

  const seed = await postBootstrap(baseUrl);
  assert(seed.status === 200 || seed.status === 201, `catalog bootstrap expected 200|201, got ${seed.status}`);
  const seeded = await resolveSeededCatalogVariant(baseUrl);
  const checkoutMethod = resolveCheckoutMethod(provider);
  report.push('QA-FIN-IMPACT-00 catalog bootstrap available');
  report.push(`QA-FIN-IMPACT-00B catalog item resolved (${seeded.variant.variantId})`);
  report.push(`QA-FIN-IMPACT-00C checkout method resolved (${checkoutMethod})`);

  const paidA = await createPaidOrder(customerSession, seeded);
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

  const paidB = await createPaidOrder(customerSession, seeded);
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
