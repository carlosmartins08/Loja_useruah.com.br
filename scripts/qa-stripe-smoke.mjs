import { ensureQaEnvLoaded } from './_qa-env.mjs';

ensureQaEnvLoaded();

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3207';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`missing_env:${name}`);
  }
  return String(value).trim();
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
  const report = [];
  const customerId = 'customer-stripe-smoke';
  const customerHeaders = {
    'x-actor-id': customerId,
    'x-actor-role': 'customer',
  };

  requiredEnv('PAYMENT_ENABLE_STRIPE');
  requiredEnv('PAYMENT_STRIPE_BASE_URL');
  requiredEnv('PAYMENT_STRIPE_API_KEY');

  const seed = await post('/api/catalog-items/bootstrap', {}, {
    'x-actor-id': 'qa-curator',
    'x-actor-role': 'curator',
  });
  if (seed.status === 200) {
    report.push('STRIPE-00 bootstrap catalog ready');
  } else {
    report.push(`STRIPE-00 bootstrap skipped (status ${seed.status})`);
  }

  const catalog = await get('/api/catalog-items');
  assert(catalog.status === 200, `catalog expected 200, got ${catalog.status}`);
  const seededItem = Array.isArray(catalog.data?.items)
    ? catalog.data.items.find((item) => item?.catalogItemId === '1')
    : null;
  assert(seededItem, 'seeded catalog item missing');
  const seededVariant = Array.isArray(seededItem?.variants) ? seededItem.variants[0] : null;
  assert(seededVariant?.variantId, 'seeded variant missing');
  assert(typeof seededVariant?.price === 'number', 'seeded variant price missing');
  report.push(`STRIPE-01 catalog item resolved (${seededVariant.variantId})`);

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
          catalogItemId: seededItem.catalogItemId,
          variantId: seededVariant.variantId,
          quantity: 1,
          unitPrice: seededVariant.price,
        },
      ],
      customer: { id: customerId },
    },
    customerHeaders
  );
  assert(order.status === 201, `order expected 201, got ${order.status}`);
  const orderId = order.data?.order?.orderId;
  assert(typeof orderId === 'string', 'orderId missing');
  report.push('STRIPE-02 order created as customer');

  const key = `qa-stripe-${Date.now()}`;
  const checkout = await post(
    '/api/payments/checkout',
    {
      orderId,
      method: 'card',
      provider: 'stripe',
      amount: seededVariant.price,
      currency: 'BRL',
      items: [{ id: seededItem.catalogItemId, name: seededItem.name, quantity: 1, unitPrice: seededVariant.price }],
    },
    { 'x-idempotency-key': key }
  );
  assert(checkout.status === 200, `checkout expected 200, got ${checkout.status}`);
  const paymentId = checkout.data?.payment?.paymentId;
  const providerReference = checkout.data?.payment?.providerReference;
  assert(typeof paymentId === 'string', 'paymentId missing');
  assert(typeof providerReference === 'string' && providerReference.length > 0, 'providerReference missing');
  assert(checkout.data?.payment?.provider === 'stripe', `provider expected stripe, got ${String(checkout.data?.payment?.provider)}`);
  report.push('STRIPE-03 checkout stripe provider ok');

  const status = await get(`/api/payments/status/${paymentId}`, customerHeaders);
  assert(status.status === 200, `status expected 200, got ${status.status}`);
  report.push('STRIPE-04 payment status query ok');

  const webhookEventId = `stripe-evt-${Date.now()}`;
  const webhook = await post(
    '/api/payments/webhook',
    { eventId: webhookEventId, provider: 'stripe', providerReference, event: 'payment.approved' },
    { 'x-provider': 'stripe', 'x-idempotency-key': `stripe-wh-${Date.now()}` }
  );
  assert(webhook.status === 200, `webhook expected 200, got ${webhook.status}`);
  report.push('STRIPE-05 webhook approved processed');

  const webhookDuplicate = await post(
    '/api/payments/webhook',
    { eventId: webhookEventId, provider: 'stripe', providerReference, event: 'payment.approved' },
    { 'x-provider': 'stripe', 'x-idempotency-key': `stripe-wh-dup-${Date.now()}` }
  );
  assert(webhookDuplicate.status === 200, `webhook duplicate expected 200, got ${webhookDuplicate.status}`);
  report.push('STRIPE-06 webhook duplicate idempotent');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
