#!/usr/bin/env node
import { providerConfigState } from '../lib/provider-config.mjs';
import { withWebhookSignature } from '../lib/qa-webhook-signature.mjs';
import { ensureQaEnvLoaded } from '../lib/qa-env.mjs';

ensureQaEnvLoaded();

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3216';
const required = [
  { env: 'PAYMENT_GATEWAY_BASE_URL', setting: 'baseUrl' },
  { env: 'PAYMENT_GATEWAY_API_KEY', setting: 'apiKey' },
  { env: 'PAYMENT_GATEWAY_MERCHANT_ID', setting: 'merchantId' },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function post(pathname, body, headers = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
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

async function run() {
  const readiness = providerConfigState('gateway_real', required);
  assert(readiness.configured, `missing_env:${readiness.missing.join(',')}`);

  const report = [];
  const customerId = 'customer-gateway-real-smoke';

  const order = await post('/api/orders', {
    supplierId: 'supplier-default',
    shippingAddressMode: 'same_as_account',
    shippingAddress: {
      recipientName: 'QA Customer',
      cep: '01000-000',
      street: 'Rua QA Gateway Real',
      number: '100',
      city: 'Sao Paulo',
      state: 'SP',
      country: 'BR',
    },
    items: [{ catalogItemId: '1', variantId: 'VAR-1-OFFWHITE', quantity: 1, unitPrice: 89.9 }],
    customer: { id: customerId },
  }, {
    'x-actor-id': customerId,
    'x-actor-role': 'customer',
  });
  assert(order.status === 201, `order expected 201, got ${order.status}`);
  const orderId = order.data?.order?.orderId;
  assert(typeof orderId === 'string', 'orderId missing');
  report.push('P0-GWREAL-01 order created');

  const checkout = await post(
    '/api/payments/checkout',
    {
      orderId,
      method: 'pix',
      provider: 'gateway_real',
      amount: 89.9,
      currency: 'BRL',
      items: [{ id: '1', name: 'Camiseta Respiro', quantity: 1, unitPrice: 89.9 }],
    },
    { 'x-idempotency-key': `gw-real-${Date.now()}` }
  );
  assert(checkout.status === 200, `checkout expected 200, got ${checkout.status}`);
  const paymentId = checkout.data?.payment?.paymentId;
  const providerReference = checkout.data?.payment?.providerReference;
  assert(typeof paymentId === 'string', 'paymentId missing');
  assert(typeof providerReference === 'string' && providerReference.length > 0, 'providerReference missing');
  report.push('P0-GWREAL-02 checkout via gateway_real');

  const status = await get(`/api/payments/status/${paymentId}`, { 'x-actor-id': customerId, 'x-actor-role': 'customer' });
  assert(status.status === 200, `status expected 200, got ${status.status}`);
  report.push('P0-GWREAL-03 payment status query ok');

  const webhookEventId = `evt-gw-real-${Date.now()}`;
  const webhookPayload = { eventId: webhookEventId, provider: 'gateway_real', providerReference, event: 'payment.approved' };
  const webhook = await post(
    '/api/payments/webhook',
    webhookPayload,
    withWebhookSignature(webhookPayload, { 'x-idempotency-key': `wh-gw-real-${Date.now()}`, 'x-provider': 'gateway_real' })
  );
  assert(webhook.status === 200, `webhook expected 200, got ${webhook.status}`);
  report.push('P0-GWREAL-04 webhook approved processed');

  const webhookDuplicate = await post(
    '/api/payments/webhook',
    webhookPayload,
    withWebhookSignature(webhookPayload, { 'x-idempotency-key': `wh-gw-real-dup-${Date.now()}`, 'x-provider': 'gateway_real' })
  );
  assert(webhookDuplicate.status === 200, `webhook duplicate expected 200, got ${webhookDuplicate.status}`);
  report.push('P0-GWREAL-05 webhook duplicate handled');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
