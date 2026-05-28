const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3202';
const expectRbac = process.env.QA_EXPECT_RBAC !== 'false';

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

async function createPaidOrder(customerId) {
  const order = await post('/api/orders', {
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
    items: [{ catalogItemId: '1', variantId: 'VAR-1-OFFWHITE', quantity: 1, unitPrice: 89.9 }],
    customer: { id: customerId },
  });
  assert(order.status === 201, `order expected 201, got ${order.status}`);
  const orderId = order.data?.order?.orderId;
  assert(typeof orderId === 'string', 'orderId missing');

  const checkout = await post(
    '/api/payments/checkout',
    {
      orderId,
      method: 'pix',
      provider: 'sandbox',
      amount: 89.9,
      currency: 'BRL',
      items: [{ id: '1', name: 'Camiseta Respiro', quantity: 1, unitPrice: 89.9 }],
    },
    { 'x-idempotency-key': `qa-core-checkout-${Date.now()}-${Math.random()}` }
  );
  assert(checkout.status === 200, `checkout expected 200, got ${checkout.status}`);
  const providerReference = checkout.data?.payment?.providerReference;
  assert(typeof providerReference === 'string', 'providerReference missing');

  const webhook = await post(
    '/api/payments/webhook',
    { eventId: `evt-core-${Date.now()}-${Math.random()}`, providerReference, event: 'payment.approved' },
    { 'x-idempotency-key': `qa-core-wh-${Date.now()}-${Math.random()}` }
  );
  assert(webhook.status === 200, `webhook expected 200, got ${webhook.status}`);

  return orderId;
}

async function run() {
  const report = [];

  const seed = await post('/api/catalog-items/bootstrap', {}, {
    'x-actor-id': 'qa-curator',
    'x-actor-role': 'curator',
  });
  if (seed.status === 200) {
    report.push('P0-CORE-01 bootstrap catalog ready');
  } else {
    report.push(`P0-CORE-01 bootstrap skipped (status ${seed.status})`);
  }

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
    items: [{ catalogItemId: '1', variantId: 'VAR-1-OFFWHITE', quantity: 1, unitPrice: 89.9 }],
    customer: { id: 'customer-core-placed' },
  });
  assert(placedOrder.status === 201, `placed order expected 201, got ${placedOrder.status}`);
  const placedOrderId = placedOrder.data?.order?.orderId;
  assert(typeof placedOrderId === 'string', 'placed orderId missing');

  const createProdInvalid = await post(
    '/api/production-jobs',
    { orderId: placedOrderId },
    { 'x-actor-id': 'qa-production', 'x-actor-role': 'production_operator' }
  );
  assert(createProdInvalid.status === 409, `production from placed expected 409, got ${createProdInvalid.status}`);
  report.push('P0-CORE-02 production creation blocked for non-paid order');

  const paidOrderId = await createPaidOrder('customer-core-paid');
  report.push('P0-CORE-03 paid order created via checkout+webhook');

  const createProd = await post(
    '/api/production-jobs',
    { orderId: paidOrderId },
    { 'x-actor-id': 'qa-production', 'x-actor-role': 'production_operator' }
  );
  assert(createProd.status === 200 || createProd.status === 201, `production create expected 200|201, got ${createProd.status}`);
  report.push('P0-CORE-04 production create idempotent for paid order');

  const byOrder = await get(`/api/production-jobs/by-order/${paidOrderId}`);
  assert(byOrder.status === 200, `production by order expected 200, got ${byOrder.status}`);
  const jobId = byOrder.data?.job?.productionJobId;
  assert(typeof jobId === 'string', 'productionJobId missing');

  if (expectRbac) {
    const noAuthStart = await post(`/api/production-jobs/${jobId}/start`, {});
    assert(noAuthStart.status === 403, `start without actor expected 403, got ${noAuthStart.status}`);
    report.push('P0-CORE-05 production start protected by RBAC');
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

  const orderStatus = await get(`/api/orders/${paidOrderId}/status`, { 'x-actor-id': 'customer-core-paid', 'x-actor-role': 'customer' });
  assert(orderStatus.status === 200, `order status expected 200, got ${orderStatus.status}`);
  assert(orderStatus.data?.status === 'shipped', `order status expected shipped, got ${String(orderStatus.data?.status)}`);
  report.push('P0-CORE-08 customer sees shipped order status');

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
