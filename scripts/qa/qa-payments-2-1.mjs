import { existsSync } from 'node:fs';
import path from 'node:path';
import { withWebhookSignature } from '../lib/qa-webhook-signature.mjs';
import { ensureQaEnvLoaded } from '../lib/qa-env.mjs';
import { providerConfigState } from '../lib/provider-config.mjs';
import { postBootstrap, resolveSeededCatalogVariant } from '../lib/catalog-seed-helpers.mjs';

ensureQaEnvLoaded();

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3201';
const qaMode = String(process.env.QA_PAYMENTS21_MODE ?? 'local').trim().toLowerCase();
const isReadinessMode = qaMode === 'readiness' || qaMode === 'cutover';
const configuredPersistence = process.env.QA_EXPECT_PERSISTENCE ?? process.env.PAYMENT_PERSISTENCE;
const configuredProvider = process.env.QA_PAYMENT_PROVIDER ?? process.env.PAYMENT_PROVIDER;
const provider = configuredProvider ? String(configuredProvider).trim().toLowerCase() : null;
const expectedPersistence = configuredPersistence ? String(configuredPersistence).trim().toLowerCase() : null;
const gatewayRealRequired = [
  { env: 'PAYMENT_GATEWAY_BASE_URL', setting: 'baseUrl' },
  { env: 'PAYMENT_GATEWAY_API_KEY', setting: 'apiKey' },
  { env: 'PAYMENT_GATEWAY_MERCHANT_ID', setting: 'merchantId' },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isLocalhostBaseUrl(value) {
  try {
    const url = new URL(value);
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function resolveCheckoutMethod(currentProvider) {
  if (isReadinessMode) return 'card';
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
  return { status: response.status, data, headers: response.headers };
}

async function get(pathname, headers = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, { headers });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // ignore
  }
  return { status: response.status, data, headers: response.headers };
}

async function registerCustomer() {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      persona: 'ALMA',
      fullName: `QA Payments ${Date.now()}`,
      email: `qa-payments-${Date.now()}@useruah.com.br`,
      password: 'qaPayments123',
      termsAccepted: true,
      draft: {
        cpf: '12345678901',
        phone: '11999999999',
      },
    }),
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // ignore
  }
  return {
    status: response.status,
    data,
    cookie: response.headers.get('set-cookie')?.split(';')[0] ?? null,
  };
}

async function run() {
  if (isReadinessMode) {
    assert(provider === 'stripe', `readiness_requires_payment_provider_stripe:${provider || 'missing'}`);
    assert(expectedPersistence === 'mysql', `readiness_requires_mysql_persistence:${expectedPersistence || 'missing'}`);
    assert(String(process.env.DATABASE_URL ?? '').trim().toLowerCase().startsWith('mysql://'), 'readiness_requires_mysql_database_url');
    assert(!isLocalhostBaseUrl(baseUrl), 'readiness_requires_hml_base_url');
  }

  if (provider === 'gateway_real') {
    const readiness = providerConfigState('gateway_real', gatewayRealRequired);
    assert(readiness.configured, `missing_env:${readiness.missing.join(',')}`);
  }

  const report = [];
  const selectedProvider = provider ?? 'sandbox';

  const seed = await postBootstrap(baseUrl);
  if (seed.status === 200) {
    report.push('P0-PAY21-00 bootstrap catalog ready');
  } else {
    report.push(`P0-PAY21-00 bootstrap skipped (status ${seed.status})`);
  }

  const seeded = await resolveSeededCatalogVariant(baseUrl);
  report.push(`P0-PAY21-00B catalog item resolved (${seeded.variant.variantId})`);
  const checkoutMethod = resolveCheckoutMethod(selectedProvider);
  report.push(`P0-PAY21-00C checkout method resolved (${checkoutMethod})`);

  const customer = await registerCustomer();
  assert(customer.status === 201, `register expected 201, got ${customer.status}`);
  assert(typeof customer.cookie === 'string' && customer.cookie.length > 0, 'customer cookie missing');
  const customerId = customer.data?.session?.userId;
  assert(typeof customerId === 'string' && customerId.length > 0, 'customer session userId missing');
  report.push('P0-PAY21-00D auth session cookie established');

  const session = await get('/api/auth/session', { cookie: customer.cookie });
  assert(session.status === 200, `auth session expected 200, got ${session.status}`);
  assert(session.data?.authenticated === true, 'auth session not authenticated');
  assert(session.data?.session?.userId === customerId, 'auth session returned mismatched user');
  report.push('P0-PAY21-00E auth/session recognizes ruah_session');

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
    { cookie: customer.cookie }
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
      provider: selectedProvider,
      amount: seeded.variant.price,
      currency: 'BRL',
      items: [{ id: seeded.item.catalogItemId, name: seeded.item.name, quantity: 1, unitPrice: seeded.variant.price }],
    },
    { cookie: customer.cookie, 'x-idempotency-key': key }
  );
  assert(checkout.status === 200, `checkout expected 200, got ${checkout.status}`);
  const paymentId = checkout.data?.payment?.paymentId;
  const providerReference = checkout.data?.payment?.providerReference;
  assert(typeof paymentId === 'string', 'paymentId missing');
  assert(typeof providerReference === 'string', 'providerReference missing');
  report.push(`P0-PAY21-02 checkout processing via ${selectedProvider}`);

  const persistenceMode = expectedPersistence ?? 'sqlite';
  if (persistenceMode === 'sqlite') {
    const sqliteFile = path.resolve('.tmp-store', 'payments.sqlite');
    assert(existsSync(sqliteFile), 'payments.sqlite not found');
    report.push('P0-PAY21-03 relational sqlite file created');
  } else if (persistenceMode === 'mysql') {
    report.push('P0-PAY21-03 relational mysql mode selected');
  } else {
    report.push('P0-PAY21-03 persistence check skipped');
  }

  const status = await get(`/api/payments/status/${paymentId}`, { cookie: customer.cookie });
  assert(status.status === 200, `status expected 200, got ${status.status}`);
  report.push('P0-PAY21-04 payment status query ok');

  const webhookEventId = `evt-${Date.now()}`;
  const webhookPayload = {
    eventId: webhookEventId,
    providerReference,
    event: 'payment.approved',
    ...(selectedProvider ? { provider: selectedProvider } : {}),
  };
  const webhook = await post(
    '/api/payments/webhook',
    webhookPayload,
    withWebhookSignature(webhookPayload, { 'x-idempotency-key': `wh-${Date.now()}`, ...(selectedProvider ? { 'x-provider': selectedProvider } : {}) })
  );
  assert(webhook.status === 200, `webhook expected 200, got ${webhook.status}`);
  report.push('P0-PAY21-05 webhook approved processed');

  const webhookDuplicate = await post(
    '/api/payments/webhook',
    webhookPayload,
    withWebhookSignature(webhookPayload, { 'x-idempotency-key': `wh-dup-${Date.now()}`, ...(selectedProvider ? { 'x-provider': selectedProvider } : {}) })
  );
  assert(webhookDuplicate.status === 200, `webhook duplicate expected 200, got ${webhookDuplicate.status}`);
  report.push('P0-PAY21-06 webhook duplicate handled');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, qaMode, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, qaMode, error: String(error) }, null, 2));
  process.exit(1);
});
