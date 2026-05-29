const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3215';

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

async function createPaidOrder(customerId) {
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
      items: [{ catalogItemId: '1', variantId: 'VAR-1-OFFWHITE', quantity: 1, unitPrice: 89.9 }],
      customer: { id: customerId },
    },
    { 'x-actor-id': customerId, 'x-actor-role': 'customer' }
  );
  assert(order.status === 201, `order expected 201, got ${order.status}`);
  const orderId = order.data?.order?.orderId;
  assert(typeof orderId === 'string', 'orderId missing');

  const checkout = await req(
    'POST',
    '/api/payments/checkout',
    {
      orderId,
      method: 'pix',
      provider: 'sandbox',
      amount: 89.9,
      currency: 'BRL',
      items: [{ id: '1', name: 'Camiseta Ruah', quantity: 1, unitPrice: 89.9 }],
    },
    { 'x-idempotency-key': `qa-cr-checkout-${Date.now()}-${Math.random()}` }
  );
  assert(checkout.status === 200, `checkout expected 200, got ${checkout.status}`);
  const providerReference = checkout.data?.payment?.providerReference;
  assert(typeof providerReference === 'string', 'providerReference missing');

  const webhook = await req(
    'POST',
    '/api/payments/webhook',
    { eventId: `evt-cr-${Date.now()}-${Math.random()}`, providerReference, event: 'payment.approved' },
    { 'x-idempotency-key': `qa-cr-wh-${Date.now()}-${Math.random()}` }
  );
  assert(webhook.status === 200, `webhook expected 200, got ${webhook.status}`);

  return orderId;
}

async function run() {
  const report = [];

  const seed = await req('POST', '/api/catalog-items/bootstrap', {}, { 'x-actor-id': 'qa-curator', 'x-actor-role': 'curator' });
  assert(seed.status === 200 || seed.status === 201, `catalog bootstrap expected 200|201, got ${seed.status}`);
  report.push('CR-01 catalog bootstrap available');

  const customerA = 'customer-cross-a';
  const customerB = 'customer-cross-b';
  const orderId = await createPaidOrder(customerA);
  report.push('CR-02 customer A created paid order');

  const forbiddenCustomerRead = await req(
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

  const byOrder = await req('GET', `/api/production-jobs/by-order/${orderId}`);
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

  const customerAStatus = await req(
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

