import { existsSync } from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3201';
const expectedPersistence = process.env.QA_EXPECT_PERSISTENCE ?? 'sqlite';

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

  const order = await post('/api/orders', {
    items: [{ catalogItemId: '1', variantId: 'VAR-1-OFFWHITE', quantity: 1, unitPrice: 89.9 }],
    customer: { id: 'customer-pay-21' },
  });
  assert(order.status === 201, `order expected 201, got ${order.status}`);
  const orderId = order.data?.order?.orderId;
  assert(typeof orderId === 'string', 'orderId missing');
  report.push('P0-PAY21-01 order created');

  const key = `qa-pay21-${Date.now()}`;
  const checkout = await post(
    '/api/payments/checkout',
    {
      orderId,
      method: 'pix',
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
  assert(typeof providerReference === 'string', 'providerReference missing');
  report.push('P0-PAY21-02 checkout processing via gateway_sandbox adapter');

  if (expectedPersistence === 'sqlite') {
    const sqliteFile = path.resolve('.tmp-store', 'payments.sqlite');
    assert(existsSync(sqliteFile), 'payments.sqlite not found');
    report.push('P0-PAY21-03 relational sqlite file created');
  } else if (expectedPersistence === 'mysql') {
    report.push('P0-PAY21-03 relational mysql mode selected');
  } else {
    report.push('P0-PAY21-03 persistence check skipped');
  }

  const status = await get(`/api/payments/status/${paymentId}`);
  assert(status.status === 200, `status expected 200, got ${status.status}`);
  report.push('P0-PAY21-04 payment status query ok');

  const webhookEventId = `evt-${Date.now()}`;
  const webhook = await post(
    '/api/payments/webhook',
    { eventId: webhookEventId, providerReference, event: 'payment.approved' },
    { 'x-idempotency-key': `wh-${Date.now()}` }
  );
  assert(webhook.status === 200, `webhook expected 200, got ${webhook.status}`);
  report.push('P0-PAY21-05 webhook approved processed');

  const webhookDuplicate = await post(
    '/api/payments/webhook',
    { eventId: webhookEventId, providerReference, event: 'payment.approved' },
    { 'x-idempotency-key': `wh-dup-${Date.now()}` }
  );
  assert(webhookDuplicate.status === 200, `webhook duplicate expected 200, got ${webhookDuplicate.status}`);
  report.push('P0-PAY21-06 webhook duplicate handled');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
