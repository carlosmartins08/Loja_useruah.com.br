import { existsSync } from 'node:fs';
import { join } from 'node:path';
import mysql from 'mysql2/promise';

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3350';
const qaIdentityPassword = String(process.env.QA_IDENTITY_PASSWORD ?? '');
const activeAgentPlanPath = join(process.cwd(), '.tmp-store', 'active-agent-plan.json');

const QA_USERS = {
  primary: { email: 'qa-customer-primary@useruah.local', expectedRole: 'customer' },
  foreign: { email: 'qa-customer-foreign@useruah.local', expectedRole: 'customer' },
};

const FIXTURE = {
  catalogItemId: 'CAT-QA-ORDER-CHECKOUT-READINESS',
  artworkId: 'ART-QA-ORDER-CHECKOUT-READINESS',
  productBaseId: 'PBASE-QA-ORDER-CHECKOUT-READINESS',
  variantId: 'VAR-QA-ORDER-CHECKOUT-READINESS-M',
  unitPrice: 129.9,
  supplierId: 'supplier-qa-order-checkout',
};

const FORBIDDEN_PATH_TOKENS = [
  '/api/payments/webhook',
  '/api/webhook',
  '/webhook',
  '/api/production-jobs',
  '/production',
  '/api/shipments',
  '/ship',
  '/shipment',
  '/api/affiliate',
  '/api/referral',
  '/af/',
  'attribution',
  'commission',
  'commissions',
  'payout',
  'dimona',
  'provider/real',
  'gateway-real',
];

const calledPaths = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertAuthorization(condition, message) {
  if (!condition) throw new Error(`ORDER_CHECKOUT_AUTHORIZATION_REPAIR_REQUIRED:${message}`);
}

function assertIdempotency(condition, message) {
  if (!condition) throw new Error(`ORDER_CHECKOUT_IDEMPOTENCY_PRODUCT_REPAIR_REQUIRED:${message}`);
}

function assertGatePath(pathname) {
  const normalizedPath = pathname.toLowerCase();
  const forbiddenPath = FORBIDDEN_PATH_TOKENS.find((token) => normalizedPath.includes(token));
  assert(!forbiddenPath, `QA_ORDER_CHECKOUT_FORBIDDEN_ENDPOINT:${forbiddenPath}`);

  const isAllowed =
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/session' ||
    pathname === '/api/orders' ||
    /^\/api\/orders\/[^/]+\/status$/.test(pathname) ||
    pathname === '/api/payments/checkout' ||
    /^\/api\/payments\/status\/[^/]+$/.test(pathname);

  assert(isAllowed, `QA_ORDER_CHECKOUT_ENDPOINT_NOT_ALLOWED:${pathname}`);
}

async function req(method, pathname, body, options = {}) {
  assertGatePath(pathname);
  const suppliedHeaders = options.headers ?? {};
  for (const headerName of Object.keys(suppliedHeaders)) {
    assert(!headerName.toLowerCase().startsWith('x-actor-'), 'QA_ORDER_CHECKOUT_HEADER_ACTOR_FORBIDDEN');
  }
  calledPaths.push(pathname);

  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...suppliedHeaders },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await response.json().catch(() => null) : await response.text().catch(() => null);
  return { status: response.status, data, setCookie: response.headers.get('set-cookie') ?? '' };
}

async function loginQaUser(user) {
  assert(qaIdentityPassword, 'QA_IDENTITY_PASSWORD_REQUIRED');
  const login = await req('POST', '/api/auth/login', { email: user.email, password: qaIdentityPassword });
  assert(login.status === 200, `${user.expectedRole} login expected 200, got ${login.status}`);
  assert(login.data?.session?.activeRole === user.expectedRole, `${user.expectedRole} activeRole mismatch`);

  const match = login.setCookie.match(/ruah_session=([^;]+)/);
  assert(match?.[1], `${user.expectedRole} ruah_session cookie missing after login`);
  const cookie = `ruah_session=${match[1]}`;
  const session = await req('GET', '/api/auth/session', undefined, { headers: { cookie } });
  assert(session.status === 200, `${user.expectedRole} session expected 200, got ${session.status}`);
  assert(session.data?.authenticated === true, `${user.expectedRole} session should be authenticated`);
  assert(session.data?.session?.activeRole === user.expectedRole, `${user.expectedRole} session role mismatch`);
  return { cookie, userId: session.data?.session?.userId };
}

function resolveQaDatabaseUrl() {
  const raw = String(process.env.QA_DATABASE_URL ?? '').trim();
  assert(raw, 'QA_ORDER_CHECKOUT_QA_DATABASE_URL_REQUIRED');

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('QA_ORDER_CHECKOUT_QA_DATABASE_URL_MUST_BE_MYSQL');
  }

  assert(['mysql:', 'mysql2:'].includes(parsed.protocol), 'QA_ORDER_CHECKOUT_QA_DATABASE_URL_MUST_BE_MYSQL');
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  assert(/(qa|test|disposable|ephemeral)/i.test(database), 'QA_ORDER_CHECKOUT_QA_DATABASE_URL_MUST_TARGET_QA_DATABASE');
  return raw;
}

function assertRuntimeIsolation() {
  assert(process.env.QA_REQUIRE_ISOLATED_DATABASE === 'true', 'QA_ORDER_CHECKOUT_ISOLATED_DATABASE_REQUIRED');
  assert(process.env.PAYMENT_PERSISTENCE === 'mysql', 'QA_ORDER_CHECKOUT_MYSQL_REQUIRED');
  assert(process.env.QA_NEXT_DIST_DIR === '.tmp-store/qa-next-order-checkout-readiness', 'QA_ORDER_CHECKOUT_ISOLATED_NEXT_REQUIRED');
  assert(process.env.PAYMENT_PROVIDER === 'sandbox', 'QA_ORDER_CHECKOUT_SANDBOX_PROVIDER_REQUIRED');
  assert(process.env.ALLOW_HEADER_ACTOR_FALLBACK !== 'true', 'QA_ORDER_CHECKOUT_HEADER_FALLBACK_FORBIDDEN');
  assert(process.env.DATABASE_URL === process.env.QA_DATABASE_URL, 'QA_ORDER_CHECKOUT_RUNNER_MUST_MAP_QA_DATABASE_URL');
  assert(!existsSync(activeAgentPlanPath), 'QA_ORDER_CHECKOUT_ACTIVE_AGENT_PLAN_MUST_BE_ABSENT');
}

async function preparePublishedCatalogFixture() {
  const connection = await mysql.createConnection(resolveQaDatabaseUrl());
  const now = new Date().toISOString().replace('T', ' ').replace('Z', '');
  const image = '/images/catalog/qa-order-checkout-readiness.png';
  const variants = [
    {
      variantId: FIXTURE.variantId,
      label: 'M',
      price: FIXTURE.unitPrice,
      image,
      inStock: true,
    },
  ];

  try {
    await connection.execute(
      `INSERT INTO catalog_items (
        catalog_item_id, artwork_id, product_base_id, name, price, image, color_images_json, fit,
        fabric, print_type_description, wash_guide, installment_count, detail_images_json, model_mockups_json,
        variants_json, category, segment, tags_json, pricing_policy_json, publication_status, created_at, updated_at,
        published_at, unpublished_at, publication_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, NULL, ?)
      ON DUPLICATE KEY UPDATE
        artwork_id = VALUES(artwork_id), product_base_id = VALUES(product_base_id), name = VALUES(name), price = VALUES(price),
        image = VALUES(image), color_images_json = VALUES(color_images_json), fit = VALUES(fit), fabric = VALUES(fabric),
        print_type_description = VALUES(print_type_description), wash_guide = VALUES(wash_guide), installment_count = VALUES(installment_count),
        detail_images_json = VALUES(detail_images_json), model_mockups_json = VALUES(model_mockups_json), variants_json = VALUES(variants_json),
        category = VALUES(category), segment = VALUES(segment), tags_json = VALUES(tags_json), pricing_policy_json = VALUES(pricing_policy_json),
        publication_status = 'published', updated_at = VALUES(updated_at), published_at = VALUES(published_at), unpublished_at = NULL,
        publication_reason = VALUES(publication_reason)`,
      [
        FIXTURE.catalogItemId,
        FIXTURE.artworkId,
        FIXTURE.productBaseId,
        'QA Order Checkout Readiness Item',
        FIXTURE.unitPrice,
        image,
        JSON.stringify({ Preto: image }),
        'regular',
        'Algodao QA',
        'Impressao QA',
        'Lavar a frio',
        1,
        JSON.stringify([{ label: 'Frente', src: image }]),
        JSON.stringify([{ label: 'Modelo', src: image }]),
        JSON.stringify(variants),
        'Autoral',
        'Base',
        JSON.stringify(['qa', 'order-checkout-readiness']),
        JSON.stringify({ minPrice: 100, suggestedPrice: FIXTURE.unitPrice, promoPriceFloor: 100 }),
        now,
        now,
        now,
        'qa_order_checkout_readiness_fixture',
      ]
    );

    const [rows] = await connection.execute(
      `SELECT publication_status, variants_json FROM catalog_items WHERE catalog_item_id = ?`,
      [FIXTURE.catalogItemId]
    );
    const item = rows[0];
    const persistedVariants = typeof item?.variants_json === 'string' ? JSON.parse(item.variants_json) : item?.variants_json;
    const variant = Array.isArray(persistedVariants) ? persistedVariants.find((row) => row?.variantId === FIXTURE.variantId) : null;
    assert(item?.publication_status === 'published', 'QA_ORDER_CHECKOUT_FIXTURE_MUST_BE_PUBLISHED');
    assert(variant?.inStock === true && Number(variant?.price) === FIXTURE.unitPrice, 'QA_ORDER_CHECKOUT_FIXTURE_VARIANT_INVALID');
  } finally {
    await connection.end();
  }
}

function orderPayload(unitPrice) {
  return {
    supplierId: FIXTURE.supplierId,
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
        catalogItemId: FIXTURE.catalogItemId,
        variantId: FIXTURE.variantId,
        quantity: 1,
        unitPrice,
      },
    ],
  };
}

async function inspectCustomerOrderPersistence(customerId) {
  const connection = await mysql.createConnection(resolveQaDatabaseUrl());
  try {
    const [rows] = await connection.execute(
      `SELECT
         COUNT(DISTINCT orders.order_id) AS order_count,
         COUNT(DISTINCT payments.payment_id) AS payment_count,
         COUNT(DISTINCT CASE WHEN payments.payment_id IS NULL THEN orders.order_id END) AS orphan_order_count
       FROM orders
       LEFT JOIN payments ON payments.order_id = orders.order_id
       WHERE orders.customer_id = ?`,
      [customerId]
    );
    return {
      orderCount: Number(rows[0]?.order_count ?? 0),
      paymentCount: Number(rows[0]?.payment_count ?? 0),
      orphanOrderCount: Number(rows[0]?.orphan_order_count ?? 0),
    };
  } finally {
    await connection.end();
  }
}

async function run() {
  const report = [];
  assertRuntimeIsolation();
  await preparePublishedCatalogFixture();

  const primary = await loginQaUser(QA_USERS.primary);
  const foreign = await loginQaUser(QA_USERS.foreign);
  assert(typeof primary.userId === 'string' && primary.userId.length > 0, 'primary session userId missing');
  assert(typeof foreign.userId === 'string' && foreign.userId.length > 0, 'foreign session userId missing');
  report.push('ORD-CHK-01 customer authenticated by ruah_session');
  report.push('ORD-CHK-02 isolated MySQL QA and isolated Next artifact required');
  const baselinePersistence = await inspectCustomerOrderPersistence(primary.userId);

  const idempotencyKey = `qa-order-checkout-${Date.now()}`;
  const tamperedOrder = await req('POST', '/api/orders', orderPayload(0.01), {
    headers: { cookie: primary.cookie, 'x-idempotency-key': `${idempotencyKey}-tampered` },
  });
  assert(tamperedOrder.status === 409, `tampered order expected 409, got ${tamperedOrder.status}`);
  assert(tamperedOrder.data?.error === 'price_mismatch', `tampered order expected price_mismatch, got ${tamperedOrder.data?.error}`);
  report.push('ORD-CHK-03 server-side order pricing rejects or neutralizes client price tampering');

  const validOrderPayload = orderPayload(FIXTURE.unitPrice);
  const order = await req('POST', '/api/orders', validOrderPayload, {
    headers: { cookie: primary.cookie, 'x-idempotency-key': idempotencyKey },
  });
  assert(order.status === 201, `order expected 201, got ${order.status}`);
  const orderId = order.data?.order?.orderId;
  assert(typeof orderId === 'string' && orderId.length > 0, 'orderId missing');
  assert(order.data?.order?.totalAmount === FIXTURE.unitPrice, 'order total must use server catalog price');
  assert(order.data?.reused === false, 'first order creation must not be marked reused');
  report.push('ORD-CHK-04 customer can create persisted order for published catalog item');

  const repeatedOrder = await req('POST', '/api/orders', validOrderPayload, {
    headers: { cookie: primary.cookie, 'x-idempotency-key': idempotencyKey },
  });
  assertIdempotency(repeatedOrder.status === 200, `same-attempt order retry expected 200, got ${repeatedOrder.status}`);
  assertIdempotency(repeatedOrder.data?.reused === true, 'same-attempt order retry must be marked reused');
  assertIdempotency(repeatedOrder.data?.order?.orderId === orderId, 'same-attempt order retry must return the original order');

  const incompatibleOrderPayload = orderPayload(FIXTURE.unitPrice);
  incompatibleOrderPayload.shippingAddress.number = '101';
  const incompatibleOrder = await req('POST', '/api/orders', incompatibleOrderPayload, {
    headers: { cookie: primary.cookie, 'x-idempotency-key': idempotencyKey },
  });
  assertIdempotency(incompatibleOrder.status === 409, `incompatible order retry expected 409, got ${incompatibleOrder.status}`);
  assertIdempotency(
    incompatibleOrder.data?.error === 'order_idempotency_conflict',
    `incompatible order retry conflict code mismatch: ${incompatibleOrder.data?.error ?? 'missing'}`
  );
  report.push('ORD-CHK-05 order creation retry reuses orderId and incompatible payload returns explicit 409');

  const ownOrderStatus = await req('GET', `/api/orders/${orderId}/status`, undefined, { headers: { cookie: primary.cookie } });
  assert(ownOrderStatus.status === 200, `own order status expected 200, got ${ownOrderStatus.status}`);
  assert(ownOrderStatus.data?.status === 'placed', `order must remain placed before checkout, got ${ownOrderStatus.data?.status}`);

  const foreignOrderStatus = await req('GET', `/api/orders/${orderId}/status`, undefined, { headers: { cookie: foreign.cookie } });
  assertAuthorization(foreignOrderStatus.status === 403 || foreignOrderStatus.status === 404, `foreign order status expected 403/404, got ${foreignOrderStatus.status}`);

  const missingKeyCheckout = await req(
    'POST',
    '/api/payments/checkout',
    { orderId, method: 'card', provider: 'sandbox' },
    { headers: { cookie: primary.cookie } }
  );
  assert(missingKeyCheckout.status === 422, `checkout without key expected 422, got ${missingKeyCheckout.status}`);
  assert(missingKeyCheckout.data?.detail === 'missing_x_idempotency_key', 'checkout without key must identify missing idempotency key');

  const foreignCheckout = await req(
    'POST',
    '/api/payments/checkout',
    { orderId, method: 'card', provider: 'sandbox' },
    { headers: { cookie: foreign.cookie, 'x-idempotency-key': `${idempotencyKey}-foreign` } }
  );
  assertAuthorization(foreignCheckout.status === 403, `foreign checkout expected 403, got ${foreignCheckout.status}`);
  report.push('ORD-CHK-06 foreign customer cannot access another customer order/status/payment');
  report.push('ORD-CHK-07 checkout requires ownership and x-idempotency-key');

  const checkout = await req(
    'POST',
    '/api/payments/checkout',
    { orderId, method: 'card', provider: 'sandbox', amount: 0.01, currency: 'BRL' },
    { headers: { cookie: primary.cookie, 'x-idempotency-key': idempotencyKey } }
  );
  assert(checkout.status === 200, `checkout expected 200, got ${checkout.status}`);
  const payment = checkout.data?.payment;
  const paymentId = payment?.paymentId;
  assert(typeof paymentId === 'string' && paymentId.length > 0, 'paymentId missing');
  assert(payment?.orderId === orderId, 'checkout payment must reference requested order');
  assert(payment?.amount === order.data?.order?.totalAmount, 'checkout amount must come from persisted order total');
  assert(payment?.amount !== 0.01, 'checkout must ignore client payment amount tampering');
  assert(checkout.data?.reused === false, 'first checkout must not be marked reused');

  const retryOrder = await req('POST', '/api/orders', validOrderPayload, {
    headers: { cookie: primary.cookie, 'x-idempotency-key': idempotencyKey },
  });
  assertIdempotency(retryOrder.status === 200, `full retry order expected 200, got ${retryOrder.status}`);
  assertIdempotency(retryOrder.data?.order?.orderId === orderId, 'full retry must recover the original order');

  const repeatedCheckout = await req(
    'POST',
    '/api/payments/checkout',
    { orderId: retryOrder.data?.order?.orderId, method: 'card', provider: 'sandbox' },
    { headers: { cookie: primary.cookie, 'x-idempotency-key': idempotencyKey } }
  );
  assertIdempotency(repeatedCheckout.status === 200, `same-key checkout expected 200, got ${repeatedCheckout.status}`);
  assertIdempotency(repeatedCheckout.data?.reused === true, 'same-key checkout must be reused');
  assertIdempotency(repeatedCheckout.data?.payment?.paymentId === paymentId, 'same-key checkout must return the original payment');
  assertIdempotency(repeatedCheckout.data?.payment?.orderId === orderId, 'same-key checkout returned payment for a different order');
  const afterFullRetry = await inspectCustomerOrderPersistence(primary.userId);
  assertIdempotency(
    afterFullRetry.orderCount === baselinePersistence.orderCount + 1,
    `full retry changed order count from ${baselinePersistence.orderCount} to ${afterFullRetry.orderCount}`
  );
  assertIdempotency(
    afterFullRetry.paymentCount === baselinePersistence.paymentCount + 1,
    `full retry changed payment count from ${baselinePersistence.paymentCount} to ${afterFullRetry.paymentCount}`
  );
  assertIdempotency(
    afterFullRetry.orphanOrderCount === baselinePersistence.orphanOrderCount,
    'full retry left an additional placed order without payment'
  );
  report.push('ORD-CHK-08 full order-to-checkout retry reuses one order and one payment without orphan order');

  const ownPaymentStatus = await req('GET', `/api/payments/status/${paymentId}`, undefined, { headers: { cookie: primary.cookie } });
  assert(ownPaymentStatus.status === 200, `own payment status expected 200, got ${ownPaymentStatus.status}`);
  assert(ownPaymentStatus.data?.payment?.status === 'processing', `payment status expected processing, got ${ownPaymentStatus.data?.payment?.status}`);
  assert(ownPaymentStatus.data?.payment?.status !== 'approved', 'sandbox/internal checkout must not approve payment');

  const foreignPaymentStatus = await req('GET', `/api/payments/status/${paymentId}`, undefined, { headers: { cookie: foreign.cookie } });
  assertAuthorization(foreignPaymentStatus.status === 403 || foreignPaymentStatus.status === 404, `foreign payment status expected 403/404, got ${foreignPaymentStatus.status}`);

  const afterCheckoutOrderStatus = await req('GET', `/api/orders/${orderId}/status`, undefined, { headers: { cookie: primary.cookie } });
  assert(afterCheckoutOrderStatus.status === 200, `order after checkout expected 200, got ${afterCheckoutOrderStatus.status}`);
  assert(afterCheckoutOrderStatus.data?.status === 'placed', `order must not become paid after sandbox checkout, got ${afterCheckoutOrderStatus.data?.status}`);
  assert(afterCheckoutOrderStatus.data?.paymentStatus === 'processing', `order paymentStatus expected processing, got ${afterCheckoutOrderStatus.data?.paymentStatus}`);
  report.push('ORD-CHK-09 sandbox/internal payment remains processing and does not mark order paid');

  const secondAttemptKey = `${idempotencyKey}-second`;
  const secondOrder = await req('POST', '/api/orders', orderPayload(FIXTURE.unitPrice), {
    headers: { cookie: primary.cookie, 'x-idempotency-key': secondAttemptKey },
  });
  assert(secondOrder.status === 201, `second order expected 201, got ${secondOrder.status}`);
  const secondOrderId = secondOrder.data?.order?.orderId;
  assert(typeof secondOrderId === 'string' && secondOrderId.length > 0, 'second orderId missing');

  const crossOrderRetry = await req(
    'POST',
    '/api/payments/checkout',
    { orderId: secondOrderId, method: 'card', provider: 'sandbox' },
    { headers: { cookie: primary.cookie, 'x-idempotency-key': idempotencyKey } }
  );
  assertIdempotency(crossOrderRetry.status === 409, `cross-order idempotency conflict expected 409, got ${crossOrderRetry.status}`);
  assertIdempotency(
    crossOrderRetry.data?.error === 'idempotency_key_order_conflict',
    `cross-order idempotency conflict code mismatch: ${crossOrderRetry.data?.error ?? 'missing'}`
  );
  report.push('ORD-CHK-10 payment idempotency key cannot return a payment from another order');

  const secondCheckout = await req(
    'POST',
    '/api/payments/checkout',
    { orderId: secondOrderId, method: 'card', provider: 'sandbox' },
    { headers: { cookie: primary.cookie, 'x-idempotency-key': secondAttemptKey } }
  );
  assert(secondCheckout.status === 200, `second attempt checkout expected 200, got ${secondCheckout.status}`);
  assert(secondCheckout.data?.payment?.orderId === secondOrderId, 'second attempt payment must belong to second order');
  assert(secondCheckout.data?.payment?.status === 'processing', 'second attempt payment must remain processing');

  const finalPersistence = await inspectCustomerOrderPersistence(primary.userId);
  assertIdempotency(
    finalPersistence.orderCount === baselinePersistence.orderCount + 2,
    `two distinct attempts changed order count from ${baselinePersistence.orderCount} to ${finalPersistence.orderCount}`
  );
  assertIdempotency(
    finalPersistence.paymentCount === baselinePersistence.paymentCount + 2,
    `two distinct attempts changed payment count from ${baselinePersistence.paymentCount} to ${finalPersistence.paymentCount}`
  );
  assertIdempotency(
    finalPersistence.orphanOrderCount === baselinePersistence.orphanOrderCount,
    'gate left a placed order without an associated payment'
  );
  report.push('ORD-CHK-11 distinct attempts remain isolated and no placed order is left without payment');

  assert(!existsSync(activeAgentPlanPath), 'QA_ORDER_CHECKOUT_ACTIVE_AGENT_PLAN_CREATED');
  report.push('ORD-CHK-12 no webhook approved, production, shipping, referral, attribution, commission or payout route was called');

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        baseUrl,
        database: new URL(resolveQaDatabaseUrl()).pathname.replace(/^\//, ''),
        calledPaths,
        report,
        notValidated: [
          'payment.approved webhook',
          'production and shipping',
          'commissions, referral, attribution and payout',
          'real provider, external HML and cutover',
        ],
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  const message = String(error);
  const classificationMessage = error instanceof Error ? error.message : message;
  const classification = classificationMessage.startsWith('ORDER_CHECKOUT_IDEMPOTENCY_PRODUCT_REPAIR_REQUIRED:')
    ? 'ORDER_CHECKOUT_IDEMPOTENCY_PRODUCT_REPAIR_REQUIRED'
    : classificationMessage.startsWith('ORDER_CHECKOUT_AUTHORIZATION_REPAIR_REQUIRED:')
      ? 'ORDER_CHECKOUT_AUTHORIZATION_REPAIR_REQUIRED'
      : 'ORDER_CHECKOUT_QA_REPAIR';
  console.error(JSON.stringify({ status: 'FAIL', classification, baseUrl, calledPaths, error: message }, null, 2));
  process.exit(1);
});
