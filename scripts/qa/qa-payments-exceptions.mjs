import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { postBootstrap, resolveSeededCatalogVariant } from '../lib/catalog-seed-helpers.mjs';

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3203';

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

async function createPaidOrder(customerId, seeded, amount = seeded.variant.price) {
  const customerHeaders = { 'x-actor-id': customerId, 'x-actor-role': 'customer' };
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
          unitPrice: amount,
        },
      ],
      customer: { id: customerId },
    },
    customerHeaders
  );
  assert(order.status === 201, `order expected 201, got ${order.status}`);
  const orderId = order.data?.order?.orderId;
  assert(typeof orderId === 'string', 'orderId missing');

  const checkout = await post(
    '/api/payments/checkout',
    {
      orderId,
      method: 'pix',
      provider: 'sandbox',
      amount,
      currency: 'BRL',
      items: [{ id: seeded.item.catalogItemId, name: seeded.item.name, quantity: 1, unitPrice: amount }],
    },
    { 'x-idempotency-key': `qa-exc-checkout-${Date.now()}-${Math.random()}` }
  );
  assert(checkout.status === 200, `checkout expected 200, got ${checkout.status}`);
  const payment = checkout.data?.payment;
  assert(typeof payment?.providerReference === 'string', 'providerReference missing');

  const webhookEventId = `evt-exc-${Date.now()}-${Math.random()}`;
  const webhook = await post('/api/payments/webhook', {
    eventId: webhookEventId,
    providerReference: payment.providerReference,
    event: 'payment.approved',
  });
  assert(webhook.status === 200, `webhook expected 200, got ${webhook.status}`);

  return { orderId, paymentId: payment.paymentId, providerReference: payment.providerReference };
}

async function run() {
  const report = [];

  const bootstrap = await postBootstrap(baseUrl);
  if (bootstrap.status === 200) {
    report.push('P0-EXC-00 bootstrap catalog ready');
  } else {
    report.push(`P0-EXC-00 bootstrap skipped (status ${bootstrap.status})`);
  }

  const seeded = await resolveSeededCatalogVariant(baseUrl);
  report.push(`P0-EXC-00B catalog item resolved (${seeded.variant.variantId})`);

  const placedOrder = await post(
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
      customer: { id: 'qa-cancel-customer' },
    },
    { 'x-actor-id': 'qa-cancel-customer', 'x-actor-role': 'customer' }
  );
  assert(placedOrder.status === 201, `placed order expected 201, got ${placedOrder.status}`);
  const placedOrderId = placedOrder.data?.order?.orderId;
  assert(typeof placedOrderId === 'string', 'placedOrderId missing');

  const cancelPlaced = await post(
    `/api/orders/${placedOrderId}/cancel`,
    { reason: 'customer_changed_mind' },
    { 'x-actor-id': 'qa-cancel-customer', 'x-actor-role': 'customer' }
  );
  assert(cancelPlaced.status === 200, `cancel placed expected 200, got ${cancelPlaced.status}`);
  assert(cancelPlaced.data?.order?.status === 'cancelled', 'placed cancel did not set cancelled');
  report.push('P0-EXC-01 cancelamento valido em placed');

  const cancelPlacedAgain = await post(
    `/api/orders/${placedOrderId}/cancel`,
    { reason: 'retry' },
    { 'x-actor-id': 'qa-cancel-customer', 'x-actor-role': 'customer' }
  );
  assert(cancelPlacedAgain.status === 409, `cancel placed duplicate expected 409, got ${cancelPlacedAgain.status}`);
  report.push('P0-EXC-02 bloqueio de cancelamento invalido por estado');

  const paid = await createPaidOrder('qa-refund-customer', seeded);

  const refundIdempotency = `qa-refund-${Date.now()}`;
  const refundRequest = await post(
    '/api/refunds',
    { orderId: paid.orderId, reason: 'customer_request' },
    { 'x-idempotency-key': refundIdempotency, 'x-actor-id': 'qa-support', 'x-actor-role': 'support_agent' }
  );
  assert(refundRequest.status === 201, `refund request expected 201, got ${refundRequest.status}`);
  const refundId = refundRequest.data?.refund?.refundId;
  assert(typeof refundId === 'string', 'refundId missing');
  report.push('P0-EXC-03 refund request criado');

  const refundRequestDuplicate = await post(
    '/api/refunds',
    { orderId: paid.orderId, reason: 'customer_request' },
    { 'x-idempotency-key': refundIdempotency, 'x-actor-id': 'qa-support', 'x-actor-role': 'support_agent' }
  );
  assert(refundRequestDuplicate.status === 200, `refund request duplicate expected 200, got ${refundRequestDuplicate.status}`);
  assert(refundRequestDuplicate.data?.reused === true, 'refund request duplicate should be reused');
  report.push('P0-EXC-04 idempotencia de refund request');

  const refundApprove = await post(
    `/api/refunds/${refundId}/approve`,
    {},
    { 'x-actor-id': 'qa-finance', 'x-actor-role': 'finance_admin' }
  );
  assert(refundApprove.status === 409, `refund approve pending review expected 409, got ${refundApprove.status}`);
  assert(refundApprove.data?.detail === 'impact_review_pending', `expected impact_review_pending, got ${String(refundApprove.data?.detail)}`);
  report.push('P0-EXC-05 refund approve bloqueado por impact review pendente');

  const pendingReviews = await get('/api/admin/impact-reviews?status=pending_review', {
    'x-actor-id': 'qa-admin',
    'x-actor-role': 'platform_admin',
  });
  assert(pendingReviews.status === 200, `impact reviews expected 200, got ${pendingReviews.status}`);
  const reviews = Array.isArray(pendingReviews.data?.reviews) ? pendingReviews.data.reviews : [];
  const refundReview = reviews.find((row) => row.entityType === 'Refund' && row.entityId === refundId);
  assert(refundReview?.reviewId, 'refund impact review not found');

  const approveReview = await post(
    `/api/admin/impact-reviews/${refundReview.reviewId}/approve`,
    { reason: 'qa exceptions refund approval' },
    { 'x-actor-id': 'qa-admin', 'x-actor-role': 'platform_admin' }
  );
  assert(approveReview.status === 200, `impact review approve expected 200, got ${approveReview.status}`);

  const refundApproveAfterReview = await post(
    `/api/refunds/${refundId}/approve`,
    {},
    { 'x-actor-id': 'qa-finance', 'x-actor-role': 'finance_admin' }
  );
  assert(refundApproveAfterReview.status === 200, `refund approve after review expected 200, got ${refundApproveAfterReview.status}`);
  assert(refundApproveAfterReview.data?.refund?.status === 'approved', 'refund approve should set approved');
  report.push('P0-EXC-06 refund approve apos impact review');

  const refundRejectAfterApprove = await post(
    `/api/refunds/${refundId}/reject`,
    { reason: 'not_applicable' },
    { 'x-actor-id': 'qa-finance', 'x-actor-role': 'finance_admin' }
  );
  assert(refundRejectAfterApprove.status === 409, `refund reject after approve expected 409, got ${refundRejectAfterApprove.status}`);
  report.push('P0-EXC-07 refund reject bloqueado apos approve');

  const paidChargeback = await createPaidOrder('qa-chargeback-customer', seeded);
  const chargebackEventId = `chb-${Date.now()}`;
  const chargeback = await post('/api/chargebacks/webhook', {
    eventId: chargebackEventId,
    providerReference: paidChargeback.providerReference,
    reason: 'issuer_dispute',
  });
  assert(chargeback.status === 200, `chargeback expected 200, got ${chargeback.status}`);
  report.push('P0-EXC-08 chargeback recebido');

  const chargebackDuplicate = await post('/api/chargebacks/webhook', {
    eventId: chargebackEventId,
    providerReference: paidChargeback.providerReference,
    reason: 'issuer_dispute',
  });
  assert(chargebackDuplicate.status === 200, `chargeback duplicate expected 200, got ${chargebackDuplicate.status}`);
  assert(chargebackDuplicate.data?.status === 'already_processed', 'chargeback duplicate should be already_processed');
  report.push('P0-EXC-09 idempotencia chargeback');

  const splitsFile = path.resolve('.tmp-store', 'payment-splits.json');
  const licenseFile = path.resolve('.tmp-store', 'license-events.json');
  assert(existsSync(splitsFile), 'payment-splits store not found');
  assert(existsSync(licenseFile), 'license-events store not found');
  const splitsRaw = JSON.parse(readFileSync(splitsFile, 'utf-8'));
  const licenseRaw = JSON.parse(readFileSync(licenseFile, 'utf-8'));

  const refundSplitIds = splitsRaw.byPayment?.[paid.paymentId] ?? [];
  const refundSplitRows = refundSplitIds.map((id) => splitsRaw.splits?.[id]).filter(Boolean);
  assert(refundSplitRows.length > 0, 'refund split rows missing');
  assert(refundSplitRows.every((row) => row.status === 'refunded'), 'refund split rows should be refunded');
  report.push('P0-EXC-10 payment_splits atualizados em refund');

  const refundLicenseIds = licenseRaw.byOrder?.[paid.orderId] ?? [];
  const refundLicenseRows = refundLicenseIds.map((id) => licenseRaw.events?.[id]).filter(Boolean);
  assert(refundLicenseRows.length > 0, 'refund license rows missing');
  assert(refundLicenseRows.every((row) => row.paymentStatus === 'refunded'), 'refund license rows should be refunded');
  report.push('P0-EXC-11 license_events atualizados em refund');

  const chargebackLicenseIds = licenseRaw.byOrder?.[paidChargeback.orderId] ?? [];
  const chargebackLicenseRows = chargebackLicenseIds.map((id) => licenseRaw.events?.[id]).filter(Boolean);
  assert(chargebackLicenseRows.length > 0, 'chargeback license rows missing');
  assert(chargebackLicenseRows.every((row) => row.paymentStatus === 'refunded'), 'chargeback license rows should be refunded');
  report.push('P0-EXC-12 license_events atualizados em chargeback');

  console.log(JSON.stringify({ status: 'PASS', baseUrl, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, error: String(error) }, null, 2));
  process.exit(1);
});
