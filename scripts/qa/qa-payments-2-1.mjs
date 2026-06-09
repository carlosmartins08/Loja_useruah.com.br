import { existsSync } from 'node:fs';
import path from 'node:path';
import { withWebhookSignature } from '../lib/qa-webhook-signature.mjs';
import { ensureQaEnvLoaded } from '../lib/qa-env.mjs';
import { providerConfigState } from '../lib/provider-config.mjs';
import { postBootstrap, resolveSeededCatalogVariant } from '../lib/catalog-seed-helpers.mjs';

ensureQaEnvLoaded();

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3201';
const expectedPersistence = process.env.QA_EXPECT_PERSISTENCE ?? process.env.PAYMENT_PERSISTENCE ?? 'sqlite';
const provider = process.env.QA_PAYMENT_PROVIDER ?? process.env.PAYMENT_PROVIDER ?? 'sandbox';
const gatewayRealRequired = [
  { env: 'PAYMENT_GATEWAY_BASE_URL', setting: 'baseUrl' },
  { env: 'PAYMENT_GATEWAY_API_KEY', setting: 'apiKey' },
  { env: 'PAYMENT_GATEWAY_MERCHANT_ID', setting: 'merchantId' },
];

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
  if (provider === 'gateway_real') {
    const readiness = providerConfigState('gateway_real', gatewayRealRequired);
    assert(readiness.configured, `missing_env:${readiness.missing.join(',')}`);
  }

  const report = [];
  const customerId = 'customer-pay-21';
  const customerHeaders = {
    'x-actor-id': customerId,
    'x-actor-role': 'customer',
  };

  const seed = await postBootstrap(baseUrl);
  if (seed.status === 200) {
    report.push('P0-PAY21-00 bootstrap catalog ready');
  } else {
    report.push(`P0-PAY21-00 bootstrap skipped (status ${seed.status})`);
  }

  const seeded = await resolveSeededCatalogVariant(baseUrl);
  report.push(`P0-PAY21-00B catalog item resolved (${seeded.variant.variantId})`);
  const checkoutMethod = resolveCheckoutMethod(provider);
  report.push(`P0-PAY21-00C checkout method resolved (${checkoutMethod})`);

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
      customer: { id: customerId },
    },
    customerHeaders
  );
  assert(order.status === 201, `order expected 201, got ${order.status}`);
  const orderId = order.data?.order?.orderId;
  assert(typeof orderId === 'string', 'orderId missing');
  report.push('P0-PAY21-01 order created');

  const key = `qa-pay21-${Date.now()}`;
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
    { 'x-idempotency-key': key }
  );
  assert(checkout.status === 200, `checkout expected 200, got ${checkout.status}`);
  const paymentId = checkout.data?.payment?.paymentId;
  const providerReference = checkout.data?.payment?.providerReference;
  assert(typeof paymentId === 'string', 'paymentId missing');
  assert(typeof providerReference === 'string', 'providerReference missing');
  report.push(`P0-PAY21-02 checkout processing via ${provider}`);

  if (expectedPersistence === 'sqlite') {
    const sqliteFile = path.resolve('.tmp-store', 'payments.sqlite');
    assert(existsSync(sqliteFile), 'payments.sqlite not found');
    report.push('P0-PAY21-03 relational sqlite file created');
  } else if (expectedPersistence === 'mysql') {
    report.push('P0-PAY21-03 relational mysql mode selected');
  } else {
    report.push('P0-PAY21-03 persistence check skipped');
  }

  const status = await get(`/api/payments/status/${paymentId}`, customerHeaders);
  assert(status.status === 200, `status expected 200, got ${status.status}`);
  report.push('P0-PAY21-04 payment status query ok');

  const webhookEventId = `evt-${Date.now()}`;
  const webhookPayload = { eventId: webhookEventId, providerReference, event: 'payment.approved', ...(provider ? { provider } : {}) };
  const webhook = await post(
    '/api/payments/webhook',
    webhookPayload,
    withWebhookSignature(webhookPayload, { 'x-idempotency-key': `wh-${Date.now()}`, ...(provider ? { 'x-provider': provider } : {}) })
  );
  assert(webhook.status === 200, `webhook expected 200, got ${webhook.status}`);
  report.push('P0-PAY21-05 webhook approved processed');

  const webhookDuplicate = await post(
    '/api/payments/webhook',
    webhookPayload,
    withWebhookSignature(webhookPayload, { 'x-idempotency-key': `wh-dup-${Date.now()}`, ...(provider ? { 'x-provider': provider } : {}) })
  );
  assert(webhookDuplicate.status === 200, `webhook duplicate expected 200, got ${webhookDuplicate.status}`);
  report.push('P0-PAY21-06 webhook duplicate handled');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});

