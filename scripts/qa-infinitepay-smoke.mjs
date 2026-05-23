const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3209';

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

  requiredEnv('PAYMENT_ENABLE_INFINITEPAY');
  requiredEnv('PAYMENT_INFINITEPAY_BASE_URL');
  requiredEnv('PAYMENT_INFINITEPAY_API_KEY');

  const order = await post('/api/orders', {
    items: [{ catalogItemId: '1', variantId: 'VAR-1-OFFWHITE', quantity: 1, unitPrice: 89.9 }],
    customer: { id: 'customer-infinitepay-smoke' },
  });
  assert(order.status === 201, `order expected 201, got ${order.status}`);
  const orderId = order.data?.order?.orderId;
  assert(typeof orderId === 'string', 'orderId missing');
  report.push('INF-01 order created');

  const key = `qa-inf-${Date.now()}`;
  const checkout = await post(
    '/api/payments/checkout',
    {
      orderId,
      method: 'pix',
      provider: 'infinitepay',
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
  assert(checkout.data?.payment?.provider === 'infinitepay', `provider expected infinitepay, got ${String(checkout.data?.payment?.provider)}`);
  report.push('INF-02 checkout infinitepay provider ok');

  const status = await get(`/api/payments/status/${paymentId}`);
  assert(status.status === 200, `status expected 200, got ${status.status}`);
  report.push('INF-03 payment status query ok');

  const webhookEventId = `inf-evt-${Date.now()}`;
  const webhook = await post(
    '/api/payments/webhook',
    { eventId: webhookEventId, provider: 'infinitepay', providerReference, event: 'payment.approved' },
    { 'x-provider': 'infinitepay', 'x-idempotency-key': `inf-wh-${Date.now()}` }
  );
  assert(webhook.status === 200, `webhook expected 200, got ${webhook.status}`);
  report.push('INF-04 webhook approved processed');

  const webhookDuplicate = await post(
    '/api/payments/webhook',
    { eventId: webhookEventId, provider: 'infinitepay', providerReference, event: 'payment.approved' },
    { 'x-provider': 'infinitepay', 'x-idempotency-key': `inf-wh-dup-${Date.now()}` }
  );
  assert(webhookDuplicate.status === 200, `webhook duplicate expected 200, got ${webhookDuplicate.status}`);
  report.push('INF-05 webhook duplicate idempotent');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
