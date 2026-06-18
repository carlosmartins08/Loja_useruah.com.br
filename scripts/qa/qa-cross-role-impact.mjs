import { withWebhookSignature } from '../lib/qa-webhook-signature.mjs';
import { ensureQaEnvLoaded } from '../lib/qa-env.mjs';
import { postBootstrap, resolveSeededCatalogVariant } from '../lib/catalog-seed-helpers.mjs';

ensureQaEnvLoaded();

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3215';
const provider = process.env.QA_PAYMENT_PROVIDER ?? process.env.PAYMENT_PROVIDER ?? 'sandbox';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function resolveCheckoutMethod(currentProvider) {
  if (currentProvider === 'stripe' || currentProvider === 'cielo') return 'card';
  return 'pix';
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
    // ignore non-json responses
  }
  return { status: response.status, data };
}

async function reqWithRetry(method, pathname, body, headers = {}, retries = 3) {
  let last = null;
  for (let i = 0; i < retries; i += 1) {
    last = await req(method, pathname, body, headers);
    if (last.status !== 500 && last.status !== 404) return last;
  }
  return last;
}

async function createPaidOrder(customerId, seeded) {
  const order = await req(
    'POST',
    '/api/orders',
    {
      supplierId: 'supplier-default',
      shippingAddressMode: 'same_as_account',
      shippingAddress: {
        recipientName: 'QA Cross Role',
        cep: '01000-000',
        street: 'Rua QA',
        number: '10',
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
    },
    { 'x-actor-id': customerId, 'x-actor-role': 'customer' }
  );
  assert(order.status === 201, `order expected 201, got ${order.status}`);
  const orderId = order.data?.order?.orderId;
  assert(typeof orderId === 'string', 'orderId missing');

  const checkoutMethod = resolveCheckoutMethod(provider);
  const checkout = await req(
    'POST',
    '/api/payments/checkout',
    {
      orderId,
      method: checkoutMethod,
      provider,
      amount: seeded.variant.price,
      currency: 'BRL',
      items: [{ id: seeded.item.catalogItemId, name: seeded.item.name, quantity: 1, unitPrice: seeded.variant.price }],
    },
    { 'x-idempotency-key': `qa-cr-checkout-${Date.now()}-${Math.random()}` }
  );
  assert(checkout.status === 200, `checkout expected 200, got ${checkout.status}`);
  const providerReference = checkout.data?.payment?.providerReference;
  assert(typeof providerReference === 'string', 'providerReference missing');

  const webhookPayload = {
    eventId: `evt-cr-${Date.now()}-${Math.random()}`,
    providerReference,
    event: 'payment.approved',
    ...(provider ? { provider } : {}),
  };
  const webhook = await req(
    'POST',
    '/api/payments/webhook',
    webhookPayload,
    withWebhookSignature(webhookPayload, {
      'x-idempotency-key': `qa-cr-wh-${Date.now()}-${Math.random()}`,
      ...(provider ? { 'x-provider': provider } : {}),
    })
  );
  assert(webhook.status === 200, `webhook expected 200, got ${webhook.status}`);

  return orderId;
}

async function run() {
  const report = [];

  const seed = await postBootstrap(baseUrl);
  assert(seed.status === 200 || seed.status === 201, `catalog bootstrap expected 200|201, got ${seed.status}`);
  const seeded = await resolveSeededCatalogVariant(baseUrl);
  const checkoutMethod = resolveCheckoutMethod(provider);
  report.push('CR-01 catalog bootstrap available');
  report.push(`CR-01B catalog item resolved (${seeded.variant.variantId})`);
  report.push(`CR-01C checkout method resolved (${checkoutMethod})`);

  const customerA = 'customer-cross-a';
  const customerB = 'customer-cross-b';
  const orderId = await createPaidOrder(customerA, seeded);
  report.push('CR-02 customer A created paid order');

  const forbiddenCustomerRead = await reqWithRetry(
    'GET',
    `/api/orders/${orderId}/status`,
    undefined,
    { 'x-actor-id': customerB, 'x-actor-role': 'customer' }
  );
  assert(forbiddenCustomerRead.status === 403, `customer B read order expected 403, got ${forbiddenCustomerRead.status}`);
  report.push('CR-03 customer B blocked from customer A order');

  const productionCreate = await req(
    'POST',
    '/api/production-jobs',
    { orderId },
    { 'x-actor-id': 'qa-production', 'x-actor-role': 'production_operator' }
  );
  assert(productionCreate.status === 200 || productionCreate.status === 201, `production create expected 200|201, got ${productionCreate.status}`);
  report.push('CR-04 production operator created job from paid order');

  const byOrder = await reqWithRetry(
    'GET',
    `/api/production-jobs/by-order/${orderId}`,
    undefined,
    { 'x-actor-id': 'qa-production', 'x-actor-role': 'production_operator' }
  );
  assert(byOrder.status === 200, `job by order expected 200, got ${byOrder.status}`);
  const jobId = byOrder.data?.job?.productionJobId;
  assert(typeof jobId === 'string', 'productionJobId missing');

  const supportCannotStartProduction = await req(
    'POST',
    `/api/production-jobs/${jobId}/start`,
    {},
    { 'x-actor-id': 'qa-support', 'x-actor-role': 'support_agent' }
  );
  assert(supportCannotStartProduction.status === 403, `support start production expected 403, got ${supportCannotStartProduction.status}`);
  report.push('CR-05 support blocked from production action');

  const productionStart = await req(
    'POST',
    `/api/production-jobs/${jobId}/start`,
    {},
    { 'x-actor-id': 'qa-production', 'x-actor-role': 'production_operator' }
  );
  assert(productionStart.status === 200, `production start expected 200, got ${productionStart.status}`);

  const productionShip = await req(
    'POST',
    `/api/production-jobs/${jobId}/ship`,
    { trackingCode: 'CR123456789BR', carrier: 'Correios' },
    { 'x-actor-id': 'qa-production', 'x-actor-role': 'production_operator' }
  );
  assert(productionShip.status === 200, `production ship expected 200, got ${productionShip.status}`);
  report.push('CR-06 production action impacted customer order lifecycle');

  const customerAStatus = await reqWithRetry(
    'GET',
    `/api/orders/${orderId}/status`,
    undefined,
    { 'x-actor-id': customerA, 'x-actor-role': 'customer' }
  );
  assert(customerAStatus.status === 200, `customer A status expected 200, got ${customerAStatus.status}`);
  assert(customerAStatus.data?.status === 'shipped', `customer A status expected shipped, got ${String(customerAStatus.data?.status)}`);
  report.push('CR-07 customer sees shipped status after production ship');

  const ticket = await req(
    'POST',
    '/api/tickets',
    { orderId, subject: 'Entrega', message: 'Quando chega?' },
    { 'x-actor-id': customerA, 'x-actor-role': 'customer' }
  );
  assert(ticket.status === 201, `ticket create expected 201, got ${ticket.status}`);
  const ticketId = ticket.data?.ticket?.ticketId;
  assert(typeof ticketId === 'string', 'ticketId missing');
  report.push('CR-08 customer opened support ticket');

  const supportContext = await req(
    'GET',
    `/api/support/orders/${orderId}/context`,
    undefined,
    { 'x-actor-id': 'qa-support', 'x-actor-role': 'support_agent' }
  );
  assert(supportContext.status === 200, `support context expected 200, got ${supportContext.status}`);
  report.push('CR-09 support can access consolidated order context');

  const customerCannotSupportContext = await req(
    'GET',
    `/api/support/orders/${orderId}/context`,
    undefined,
    { 'x-actor-id': customerA, 'x-actor-role': 'customer' }
  );
  assert(customerCannotSupportContext.status === 403, `customer support context expected 403, got ${customerCannotSupportContext.status}`);
  report.push('CR-10 customer blocked from support-only context');

  const supportReply = await req(
    'POST',
    `/api/tickets/${ticketId}/reply`,
    { message: 'Pedido ja enviado com rastreio.' },
    { 'x-actor-id': 'qa-support', 'x-actor-role': 'support_agent' }
  );
  assert(supportReply.status === 200, `support reply expected 200, got ${supportReply.status}`);

  const customerReadTicket = await req(
    'GET',
    `/api/tickets/${ticketId}`,
    undefined,
    { 'x-actor-id': customerA, 'x-actor-role': 'customer' }
  );
  assert(customerReadTicket.status === 200, `customer ticket read expected 200, got ${customerReadTicket.status}`);
  assert(Array.isArray(customerReadTicket.data?.ticket?.messages), 'ticket messages missing');
  report.push('CR-11 support action visible to customer in ticket thread');

  const refundRequest = await req(
    'POST',
    '/api/refunds',
    { orderId, reason: 'Desistencia' },
    {
      'x-actor-id': 'qa-support',
      'x-actor-role': 'support_agent',
      'x-idempotency-key': `qa-cr-rfd-${Date.now()}-${Math.random()}`,
    }
  );
  assert(refundRequest.status === 201 || refundRequest.status === 200, `refund request expected 201|200, got ${refundRequest.status}`);
  const refundId = refundRequest.data?.refund?.refundId;
  assert(typeof refundId === 'string', 'refundId missing');
  report.push('CR-12 support opened refund request');

  const supportCannotApproveRefund = await req(
    'POST',
    `/api/refunds/${refundId}/approve`,
    {},
    { 'x-actor-id': 'qa-support', 'x-actor-role': 'support_agent' }
  );
  assert(supportCannotApproveRefund.status === 403, `support approve refund expected 403, got ${supportCannotApproveRefund.status}`);
  report.push('CR-13 support blocked from finance-only refund approval');

  const payoutFromCustomerBlocked = await req(
    'POST',
    '/api/payouts',
    { ownerId: customerA, ownerRole: 'artist', amount: 10, commissionIds: [] },
    {
      'x-actor-id': customerA,
      'x-actor-role': 'customer',
      'x-idempotency-key': `qa-cr-payout-block-${Date.now()}-${Math.random()}`,
    }
  );
  assert(payoutFromCustomerBlocked.status === 403, `customer payout request expected 403, got ${payoutFromCustomerBlocked.status}`);
  report.push('CR-14 customer blocked from payout flow');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
