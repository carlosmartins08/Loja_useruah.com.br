const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3204';

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

async function get(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
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

  // Hard gate: Inter credentials must exist before smoke.
  requiredEnv('PAYMENT_ENABLE_INTER');
  requiredEnv('PAYMENT_INTER_BASE_URL');
  requiredEnv('PAYMENT_INTER_TOKEN_URL');
  requiredEnv('PAYMENT_INTER_CLIENT_ID');
  requiredEnv('PAYMENT_INTER_CLIENT_SECRET');

  const order = await post('/api/orders', {
    items: [{ catalogItemId: '1', variantId: 'VAR-1-OFFWHITE', quantity: 1, unitPrice: 89.9 }],
    customer: { id: 'customer-inter-smoke' },
  });
  assert(order.status === 201, `order expected 201, got ${order.status}`);
  const orderId = order.data?.order?.orderId;
  assert(typeof orderId === 'string', 'orderId missing');
  report.push('INTER-01 order created');

  const key = `qa-inter-${Date.now()}`;
  const checkout = await post(
    '/api/payments/checkout',
    {
      orderId,
      method: 'pix',
      provider: 'inter',
      amount: 89.9,
      currency: 'BRL',
      items: [{ id: '1', name: 'Camiseta Respiro', quantity: 1, unitPrice: 89.9 }],
    },
    { 'x-idempotency-key': key }
  );
  assert(checkout.status === 200, `checkout expected 200, got ${checkout.status}`);
  const paymentId = checkout.data?.payment?.paymentId;
  const providerReference = checkout.data?.payment?.providerReference;
  assert(typeof paymentId === 'string', 'paymentId missing');
  assert(typeof providerReference === 'string' && providerReference.length > 0, 'providerReference missing');
  assert(checkout.data?.payment?.provider === 'inter', `provider expected inter, got ${String(checkout.data?.payment?.provider)}`);
  report.push('INTER-02 checkout inter provider ok');

  const status = await get(`/api/payments/status/${paymentId}`);
  assert(status.status === 200, `status expected 200, got ${status.status}`);
  report.push('INTER-03 payment status query ok');

  const webhookEventId = `inter-evt-${Date.now()}`;
  const webhook = await post(
    '/api/payments/webhook',
    { eventId: webhookEventId, provider: 'inter', providerReference, event: 'payment.approved' },
    { 'x-provider': 'inter', 'x-idempotency-key': `inter-wh-${Date.now()}` }
  );
  assert(webhook.status === 200, `webhook expected 200, got ${webhook.status}`);
  report.push('INTER-04 webhook approved processed');

  const webhookDuplicate = await post(
    '/api/payments/webhook',
    { eventId: webhookEventId, provider: 'inter', providerReference, event: 'payment.approved' },
    { 'x-provider': 'inter', 'x-idempotency-key': `inter-wh-dup-${Date.now()}` }
  );
  assert(webhookDuplicate.status === 200, `webhook duplicate expected 200, got ${webhookDuplicate.status}`);
  report.push('INTER-05 webhook duplicate idempotent');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});

