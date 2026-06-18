import { withWebhookSignature } from '../lib/qa-webhook-signature.mjs';
import { ensureQaEnvLoaded } from '../lib/qa-env.mjs';
import { postBootstrap, resolveSeededCatalogVariant } from '../lib/catalog-seed-helpers.mjs';

ensureQaEnvLoaded();

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3202';
const expectRbac = process.env.QA_EXPECT_RBAC !== 'false';
const provider = process.env.QA_PAYMENT_PROVIDER ?? process.env.PAYMENT_PROVIDER ?? 'sandbox';

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
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers,
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // ignore
  }
  return { status: response.status, data };
}

async function getWithRetry(pathname, headers = {}, retries = 3) {
  let last = null;
  for (let i = 0; i < retries; i += 1) {
    last = await get(pathname, headers);
    if (last.status !== 500) return last;
  }
  return last;
}

async function postWithRetry(pathname, body, headers = {}, retries = 3, retryStatuses = [404, 500]) {
  let last = null;
  for (let i = 0; i < retries; i += 1) {
    last = await post(pathname, body, headers);
    if (!retryStatuses.includes(last.status)) return last;
  }
  return last;
}

async function createPaidOrder(customerId, seeded, supplierId = 'supplier-default') {
  const order = await post('/api/orders', {
    supplierId,
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
  }, {
    'x-actor-id': customerId,
    'x-actor-role': 'customer',
  });
  assert(order.status === 201, `order expected 201, got ${order.status}`);
  const orderId = order.data?.order?.orderId;
  assert(typeof orderId === 'string', 'orderId missing');

  const idempotencyKey = `qa-core-checkout-${Date.now()}-${Math.random()}`;
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
    { 'x-idempotency-key': idempotencyKey }
  );
  assert(checkout.status === 200, `checkout expected 200, got ${checkout.status}`);
  const providerReference = checkout.data?.payment?.providerReference;
  assert(typeof providerReference === 'string', 'providerReference missing');
  const paymentId = checkout.data?.payment?.paymentId;
  assert(typeof paymentId === 'string', 'paymentId missing');

  const checkoutReplay = await post(
    '/api/payments/checkout',
    {
      orderId,
      method: checkoutMethod,
      provider,
      amount: seeded.variant.price,
      currency: 'BRL',
      items: [{ id: seeded.item.catalogItemId, name: seeded.item.name, quantity: 1, unitPrice: seeded.variant.price }],
    },
    { 'x-idempotency-key': idempotencyKey }
  );
  assert(checkoutReplay.status === 200, `checkout replay expected 200, got ${checkoutReplay.status}`);
  assert(checkoutReplay.data?.reused === true, `checkout replay expected reused=true, got ${String(checkoutReplay.data?.reused)}`);
  assert(checkoutReplay.data?.payment?.paymentId === paymentId, 'checkout replay changed paymentId');

  const webhookPayload = {
    eventId: `evt-core-${Date.now()}-${Math.random()}`,
    providerReference,
    event: 'payment.approved',
    ...(provider ? { provider } : {}),
  };
  const webhook = await post(
    '/api/payments/webhook',
    webhookPayload,
    withWebhookSignature(webhookPayload, {
      'x-idempotency-key': `qa-core-wh-${Date.now()}-${Math.random()}`,
      ...(provider ? { 'x-provider': provider } : {}),
    })
  );
  assert(webhook.status === 200, `webhook expected 200, got ${webhook.status}`);

  return orderId;
}

async function run() {
  const report = [];

  const seed = await postBootstrap(baseUrl);
  if (seed.status === 200) {
    report.push('P0-CORE-01 bootstrap catalog ready');
  } else {
    report.push(`P0-CORE-01 bootstrap skipped (status ${seed.status})`);
  }
  const seeded = await resolveSeededCatalogVariant(baseUrl);
  report.push(`P0-CORE-01B catalog item resolved (${seeded.variant.variantId})`);
  const checkoutMethod = resolveCheckoutMethod(provider);
  report.push(`P0-CORE-01C checkout method resolved (${checkoutMethod})`);

  const placedOrder = await post('/api/orders', {
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
    customer: { id: 'customer-core-placed' },
  }, {
    'x-actor-id': 'customer-core-placed',
    'x-actor-role': 'customer',
  });
  assert(placedOrder.status === 201, `placed order expected 201, got ${placedOrder.status}`);
  const placedOrderId = placedOrder.data?.order?.orderId;
  assert(typeof placedOrderId === 'string', 'placed orderId missing');

  const createProdInvalid = await postWithRetry(
    '/api/production-jobs',
    { orderId: placedOrderId },
    { 'x-actor-id': 'qa-production', 'x-actor-role': 'production_operator' },
    4
  );
  assert(createProdInvalid.status === 409, `production from placed expected 409, got ${createProdInvalid.status}`);
  report.push('P0-CORE-02 production creation blocked for non-paid order');

  const paidOrderId = await createPaidOrder('customer-core-paid', seeded);
  report.push('P0-CORE-03 paid order created via checkout+webhook');
  report.push('P0-CORE-03B checkout idempotency preserved same payment');
  const alternateSupplierOrderId = await createPaidOrder('customer-core-paid-alt', seeded, 'supplier-alt');
  report.push('P0-CORE-03C second paid order created for isolated supplier scope');

  const createProd = await postWithRetry(
    '/api/production-jobs',
    { orderId: paidOrderId },
    { 'x-actor-id': 'qa-production', 'x-actor-role': 'production_operator' },
    4
  );
  assert(createProd.status === 200 || createProd.status === 201, `production create expected 200|201, got ${createProd.status}`);
  report.push('P0-CORE-04 production create idempotent for paid order');
  const createProdAlternate = await postWithRetry(
    '/api/production-jobs',
    { orderId: alternateSupplierOrderId },
    { 'x-actor-id': 'qa-production', 'x-actor-role': 'production_operator' },
    4
  );
  assert(
    createProdAlternate.status === 200 || createProdAlternate.status === 201,
    `alternate production create expected 200|201, got ${createProdAlternate.status}`
  );
  report.push('P0-CORE-04B second production job created for scope isolation');

  const byOrder = await getWithRetry(`/api/production-jobs/by-order/${paidOrderId}`, {
    'x-actor-id': 'qa-production',
    'x-actor-role': 'production_operator',
  });
  assert(byOrder.status === 200, `production by order expected 200, got ${byOrder.status}`);
  const jobId = byOrder.data?.job?.productionJobId;
  assert(typeof jobId === 'string', 'productionJobId missing');
  const alternateByOrder = await getWithRetry(`/api/production-jobs/by-order/${alternateSupplierOrderId}`, {
    'x-actor-id': 'qa-production',
    'x-actor-role': 'production_operator',
  });
  assert(alternateByOrder.status === 200, `alternate production by order expected 200, got ${alternateByOrder.status}`);
  const alternateJobId = alternateByOrder.data?.job?.productionJobId;
  assert(typeof alternateJobId === 'string', 'alternate productionJobId missing');

  if (expectRbac) {
    const noAuthList = await get('/api/production-jobs');
    assert(noAuthList.status === 401, `list without actor expected 401, got ${noAuthList.status}`);
    report.push('P0-CORE-05 production list rejects anonymous access');

    const noAuthDetail = await get(`/api/production-jobs/${jobId}`);
    assert(noAuthDetail.status === 401, `detail without actor expected 401, got ${noAuthDetail.status}`);
    report.push('P0-CORE-05B production detail rejects anonymous access');

    const customerList = await get('/api/production-jobs', {
      'x-actor-id': 'customer-core-paid',
      'x-actor-role': 'customer',
    });
    assert(customerList.status === 403, `customer production list expected 403, got ${customerList.status}`);
    report.push('P0-CORE-05C customer blocked from production workspace');

    const supplierOwnList = await get('/api/production-jobs', {
      'x-actor-id': 'supplier-default',
      'x-actor-role': 'supplier',
    });
    assert(supplierOwnList.status === 200, `supplier own list expected 200, got ${supplierOwnList.status}`);
    const ownJobIds = Array.isArray(supplierOwnList.data?.jobs) ? supplierOwnList.data.jobs.map((job) => job.productionJobId) : [];
    assert(ownJobIds.includes(jobId), 'supplier own list missing owned job');
    assert(!ownJobIds.includes(alternateJobId), 'supplier own list leaked foreign job');
    report.push('P0-CORE-05D supplier list filtered to owned production scope');

    const supplierOwnDetail = await get(`/api/production-jobs/${jobId}`, {
      'x-actor-id': 'supplier-default',
      'x-actor-role': 'supplier',
    });
    assert(supplierOwnDetail.status === 200, `supplier own detail expected 200, got ${supplierOwnDetail.status}`);
    report.push('P0-CORE-05E supplier reads own production job');

    const supplierForeignDetail = await get(`/api/production-jobs/${alternateJobId}`, {
      'x-actor-id': 'supplier-default',
      'x-actor-role': 'supplier',
    });
    assert(supplierForeignDetail.status === 403, `supplier foreign detail expected 403, got ${supplierForeignDetail.status}`);
    report.push('P0-CORE-05F supplier blocked from foreign production detail');

    const supplierOwnByOrder = await get(`/api/production-jobs/by-order/${paidOrderId}`, {
      'x-actor-id': 'supplier-default',
      'x-actor-role': 'supplier',
    });
    assert(supplierOwnByOrder.status === 200, `supplier own by-order expected 200, got ${supplierOwnByOrder.status}`);

    const supplierForeignByOrder = await get(`/api/production-jobs/by-order/${alternateSupplierOrderId}`, {
      'x-actor-id': 'supplier-default',
      'x-actor-role': 'supplier',
    });
    assert(supplierForeignByOrder.status === 403, `supplier foreign by-order expected 403, got ${supplierForeignByOrder.status}`);
    report.push('P0-CORE-05G supplier by-order endpoint enforces ownership');

    const supplierCannotStartForeign = await post(
      `/api/production-jobs/${alternateJobId}/start`,
      {},
      { 'x-actor-id': 'supplier-default', 'x-actor-role': 'supplier' }
    );
    assert(supplierCannotStartForeign.status === 403, `supplier foreign start expected 403, got ${supplierCannotStartForeign.status}`);

    const supplierCannotShipForeign = await post(
      `/api/production-jobs/${alternateJobId}/ship`,
      { trackingCode: 'BR987654321', carrier: 'Correios' },
      { 'x-actor-id': 'supplier-default', 'x-actor-role': 'supplier' }
    );
    assert(supplierCannotShipForeign.status === 403, `supplier foreign ship expected 403, got ${supplierCannotShipForeign.status}`);
    report.push('P0-CORE-05H supplier blocked from start/ship outside own scope');

    const platformList = await get('/api/production-jobs', {
      'x-actor-id': 'qa-platform',
      'x-actor-role': 'platform_admin',
    });
    assert(platformList.status === 200, `platform production list expected 200, got ${platformList.status}`);
    report.push('P0-CORE-05I platform admin keeps global production visibility');

    const noAuthStart = await post(`/api/production-jobs/${jobId}/start`, {});
    assert(noAuthStart.status === 401, `start without actor expected 401, got ${noAuthStart.status}`);
    report.push('P0-CORE-05J production start protected by authenticated RBAC');
  }

  const start = await post(
    `/api/production-jobs/${jobId}/start`,
    {},
    { 'x-actor-id': 'qa-production', 'x-actor-role': 'production_operator' }
  );
  assert(start.status === 200, `production start expected 200, got ${start.status}`);
  report.push('P0-CORE-06 production start queued->in_progress');

  const ship = await post(
    `/api/production-jobs/${jobId}/ship`,
    { trackingCode: 'BR123456789', carrier: 'Correios' },
    { 'x-actor-id': 'qa-production', 'x-actor-role': 'production_operator' }
  );
  assert(ship.status === 200, `production ship expected 200, got ${ship.status}`);
  report.push('P0-CORE-07 production ship in_progress->shipped');

  const orderStatus = await getWithRetry(`/api/orders/${paidOrderId}/status`, {
    'x-actor-id': 'customer-core-paid',
    'x-actor-role': 'customer',
  });
  assert(orderStatus.status === 200, `order status expected 200, got ${orderStatus.status}`);
  assert(orderStatus.data?.status === 'shipped', `order status expected shipped, got ${String(orderStatus.data?.status)}`);
  report.push('P0-CORE-08 customer sees shipped order status');

  const crossUserOrderStatus = await get(`/api/orders/${paidOrderId}/status`, {
    'x-actor-id': 'customer-core-other',
    'x-actor-role': 'customer',
  });
  assert(
    crossUserOrderStatus.status === 401 || crossUserOrderStatus.status === 403,
    `cross user order status expected 401|403, got ${crossUserOrderStatus.status}`
  );
  report.push('P0-CORE-08B cross-user order access blocked');

  const shipment = await get(`/api/shipments/${paidOrderId}`, { 'x-actor-id': 'customer-core-paid', 'x-actor-role': 'customer' });
  assert(shipment.status === 200, `shipment expected 200, got ${shipment.status}`);
  assert(typeof shipment.data?.trackingCode === 'string', 'shipment trackingCode missing');
  report.push('P0-CORE-09 shipment tracking available');

  const ticket = await post(
    '/api/tickets',
    { orderId: paidOrderId, subject: 'Acompanhamento', message: 'Qual previsão de entrega?' },
    { 'x-actor-id': 'customer-core-paid', 'x-actor-role': 'customer' }
  );
  assert(ticket.status === 201, `ticket create expected 201, got ${ticket.status}`);
  const ticketId = ticket.data?.ticket?.ticketId;
  assert(typeof ticketId === 'string', 'ticketId missing');
  report.push('P0-CORE-10 customer ticket opened');

  const supportReply = await post(
    `/api/tickets/${ticketId}/reply`,
    { message: 'Pedido já enviado com rastreio.' },
    { 'x-actor-id': 'qa-support', 'x-actor-role': 'support_agent' }
  );
  assert(supportReply.status === 200, `support reply expected 200, got ${supportReply.status}`);
  report.push('P0-CORE-11 support replied ticket');

  const supportContext = await get(`/api/support/orders/${paidOrderId}/context`, {
    'x-actor-id': 'qa-support',
    'x-actor-role': 'support_agent',
  });
  assert(supportContext.status === 200, `support context expected 200, got ${supportContext.status}`);
  assert(supportContext.data?.order?.status === 'shipped', `support context order status expected shipped, got ${String(supportContext.data?.order?.status)}`);
  report.push('P0-CORE-12 support context consolidated');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
