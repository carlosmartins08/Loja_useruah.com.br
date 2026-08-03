import { createHmac, randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import mysql from 'mysql2/promise';

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3351';
const activeAgentPlanPath = join(process.cwd(), '.tmp-store', 'active-agent-plan.json');
const expectedDatabase = 'useruah_qa_payment_approved_decoupling';
const provider = 'sandbox';
const calledPaths = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function resolveQaDatabaseUrl() {
  const raw = String(process.env.QA_DATABASE_URL ?? '').trim();
  assert(raw, 'QA_PAYMENT_APPROVED_QA_DATABASE_URL_REQUIRED');

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('QA_PAYMENT_APPROVED_QA_DATABASE_URL_MUST_BE_MYSQL');
  }

  assert(['mysql:', 'mysql2:'].includes(parsed.protocol), 'QA_PAYMENT_APPROVED_QA_DATABASE_URL_MUST_BE_MYSQL');
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  assert(database === expectedDatabase, `QA_PAYMENT_APPROVED_DATABASE_MUST_BE_${expectedDatabase}`);
  return raw;
}

function assertRuntimeIsolation() {
  assert(process.env.QA_REQUIRE_ISOLATED_DATABASE === 'true', 'QA_PAYMENT_APPROVED_ISOLATED_DATABASE_REQUIRED');
  assert(process.env.PAYMENT_PERSISTENCE === 'mysql', 'QA_PAYMENT_APPROVED_MYSQL_REQUIRED');
  assert(
    process.env.QA_NEXT_DIST_DIR === '.tmp-store/qa-next-payment-approved-decoupling',
    'QA_PAYMENT_APPROVED_ISOLATED_NEXT_REQUIRED'
  );
  assert(process.env.PAYMENT_PROVIDER === 'sandbox', 'QA_PAYMENT_APPROVED_SANDBOX_PROVIDER_REQUIRED');
  assert(process.env.QA_REQUIRE_WEBHOOK_SIGNATURE === 'true', 'QA_PAYMENT_APPROVED_SIGNATURE_REQUIRED');
  assert(
    process.env.QA_ENABLE_PAYMENT_APPROVED_FAILURE_INJECTION === 'true',
    'QA_PAYMENT_APPROVED_FAILURE_INJECTION_GUARD_REQUIRED'
  );
  assert(process.env.ALLOW_HEADER_ACTOR_FALLBACK !== 'true', 'QA_PAYMENT_APPROVED_HEADER_FALLBACK_FORBIDDEN');
  assert(process.env.DATABASE_URL === process.env.QA_DATABASE_URL, 'QA_PAYMENT_APPROVED_RUNNER_MUST_MAP_QA_DATABASE_URL');
  assert(process.env.PAYMENT_WEBHOOK_SECRET === 'qa-local-webhook-secret', 'QA_PAYMENT_APPROVED_LOCAL_WEBHOOK_SECRET_REQUIRED');
  assert(!existsSync(activeAgentPlanPath), 'QA_PAYMENT_APPROVED_ACTIVE_AGENT_PLAN_MUST_BE_ABSENT');
}

function signedHeaders(payload, additional = {}) {
  const rawBody = JSON.stringify(payload);
  const signature = createHmac('sha256', process.env.PAYMENT_WEBHOOK_SECRET).update(rawBody).digest('hex');
  return { 'x-signature': signature, 'x-provider': provider, ...additional };
}

async function postWebhook(payload, headers = {}) {
  const pathname = '/api/payments/webhook';
  calledPaths.push(pathname);
  for (const headerName of Object.keys(headers)) {
    assert(!headerName.toLowerCase().startsWith('x-actor-'), 'QA_PAYMENT_APPROVED_HEADER_ACTOR_FORBIDDEN');
  }

  const response = await fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  });
  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);
  return { status: response.status, data };
}

async function seedCase(connection, label, paymentStatus = 'processing') {
  const suffix = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
  const orderId = `ORD-PAY-APP-${label}-${suffix}`;
  const paymentId = `PAY-PAY-APP-${label}-${suffix}`;
  const providerReference = `sandbox_pay_app_${label}_${suffix}`;
  const now = new Date().toISOString().replace('T', ' ').replace('Z', '');

  await connection.execute(
    `INSERT INTO orders
      (order_id, customer_id, items_json, total_amount, status, created_at, updated_at, paid_at)
     VALUES (?, 'qa-payment-approved-customer', '[]', 129.90, 'placed', ?, ?, NULL)`,
    [orderId, now, now]
  );
  await connection.execute(
    `INSERT INTO payments
      (payment_id, order_id, provider, method, amount, currency, status, provider_reference, created_at, approved_at)
     VALUES (?, ?, 'sandbox', 'card', 129.90, 'BRL', ?, ?, ?, NULL)`,
    [paymentId, orderId, paymentStatus, providerReference, now]
  );

  return { orderId, paymentId, providerReference };
}

async function inspectCase(connection, fixture, eventId) {
  const [paymentRows] = await connection.execute(
    `SELECT status, approved_at FROM payments WHERE payment_id = ?`,
    [fixture.paymentId]
  );
  const [orderRows] = await connection.execute(`SELECT status, paid_at FROM orders WHERE order_id = ?`, [fixture.orderId]);
  const [eventRows] = await connection.execute(
    `SELECT COUNT(*) AS count FROM payment_events WHERE payment_id = ? AND event_name = 'payment.approved'`,
    [fixture.paymentId]
  );
  const [outboxRows] = await connection.execute(
    `SELECT COUNT(*) AS count FROM payment_approved_outbox WHERE payment_id = ? AND event_type = 'PaymentApproved'`,
    [fixture.paymentId]
  );
  const [inboxRows] = await connection.execute(
    `SELECT COUNT(*) AS count, MAX(processed) AS processed
     FROM provider_webhook_events
     WHERE provider = ? AND provider_event_id = ?`,
    [provider, eventId]
  );

  return {
    paymentStatus: paymentRows[0]?.status,
    paymentApprovedAt: paymentRows[0]?.approved_at,
    orderStatus: orderRows[0]?.status,
    orderPaidAt: orderRows[0]?.paid_at,
    paymentEventCount: Number(eventRows[0]?.count ?? 0),
    outboxCount: Number(outboxRows[0]?.count ?? 0),
    inboxCount: Number(inboxRows[0]?.count ?? 0),
    inboxProcessed: Number(inboxRows[0]?.processed ?? 0),
  };
}

async function downstreamCounts(connection, fixtures) {
  const orderIds = fixtures.map((fixture) => fixture.orderId);
  const paymentIds = fixtures.map((fixture) => fixture.paymentId);
  const orderPlaceholders = orderIds.map(() => '?').join(', ');
  const paymentPlaceholders = paymentIds.map(() => '?').join(', ');
  const [rows] = await connection.execute(
    `SELECT
      (SELECT COUNT(*) FROM production_jobs WHERE order_id IN (${orderPlaceholders})) AS production_jobs,
      (SELECT COUNT(*) FROM shipments WHERE order_id IN (${orderPlaceholders})) AS shipments,
      (SELECT COUNT(*) FROM payment_splits WHERE payment_id IN (${paymentPlaceholders})) AS payment_splits,
      (SELECT COUNT(*) FROM license_events WHERE order_id IN (${orderPlaceholders})) AS license_events,
      (SELECT COUNT(*) FROM commissions WHERE order_id IN (${orderPlaceholders})) AS commissions,
      (SELECT COUNT(*) FROM referral_events WHERE order_id IN (${orderPlaceholders})) AS referral_events,
      (SELECT COUNT(*) FROM payouts) AS payouts`,
    [...orderIds, ...orderIds, ...paymentIds, ...orderIds, ...orderIds, ...orderIds]
  );
  return Object.fromEntries(Object.entries(rows[0] ?? {}).map(([key, value]) => [key, Number(value)]));
}

function assertNoSynchronousDownstreamSource() {
  const source = readFileSync(join(process.cwd(), 'lib', 'payment-service.ts'), 'utf8');
  const forbiddenTokens = [
    'createQueuedProductionJob',
    'createPaymentSplits',
    'createLicenseEvents',
    'createCommissionPending',
    'recordReferralConversion',
    'supplier-production-dispatch',
    'dimona',
  ];
  for (const token of forbiddenTokens) {
    assert(!source.includes(token), `QA_PAYMENT_APPROVED_SYNCHRONOUS_DOWNSTREAM_FORBIDDEN:${token}`);
  }
}

async function run() {
  assertRuntimeIsolation();
  assertNoSynchronousDownstreamSource();
  const connection = await mysql.createConnection(resolveQaDatabaseUrl());
  const report = [];

  try {
    const normal = await seedCase(connection, 'normal');
    const concurrent = await seedCase(connection, 'concurrent');
    const rollback = await seedCase(connection, 'rollback');
    const terminalFailed = await seedCase(connection, 'terminal-failed', 'failed');
    const fixtures = [normal, concurrent, rollback, terminalFailed];
    const downstreamBefore = await downstreamCounts(connection, fixtures);

    report.push('PAY-APP-01 MySQL QA and isolated Next artifact required');

    const normalEventId = `evt-pay-app-normal-${randomUUID()}`;
    const normalPayload = {
      eventId: normalEventId,
      provider,
      providerReference: normal.providerReference,
      event: 'payment.approved',
    };
    const unsigned = await postWebhook(normalPayload, { 'x-provider': provider });
    assert(unsigned.status === 401, `unsigned webhook expected 401, got ${unsigned.status}`);
    const invalid = await postWebhook(normalPayload, { 'x-provider': provider, 'x-signature': 'invalid' });
    assert(invalid.status === 401, `invalid webhook expected 401, got ${invalid.status}`);
    report.push('PAY-APP-02 unsigned and invalid webhook rejected even with QA_SCRIPT');

    const approved = await postWebhook(normalPayload, signedHeaders(normalPayload));
    assert(approved.status === 200, `approved webhook expected 200, got ${approved.status}`);
    const normalState = await inspectCase(connection, normal, normalEventId);
    assert(normalState.paymentStatus === 'approved', `payment expected approved, got ${normalState.paymentStatus}`);
    assert(normalState.orderStatus === 'paid', `order expected paid, got ${normalState.orderStatus}`);
    assert(normalState.paymentApprovedAt && normalState.orderPaidAt, 'approved_at and paid_at are required');
    report.push('PAY-APP-03 signed approved webhook transitions payment to approved and order to paid');

    assert(normalState.paymentEventCount === 1, `payment event expected 1, got ${normalState.paymentEventCount}`);
    assert(normalState.outboxCount === 1, `outbox expected 1, got ${normalState.outboxCount}`);
    assert(normalState.inboxCount === 1 && normalState.inboxProcessed === 1, 'provider inbox must be processed exactly once');
    report.push('PAY-APP-04 payment event and PaymentApproved outbox created exactly once');

    const sequentialDuplicate = await postWebhook(normalPayload, signedHeaders(normalPayload));
    assert(sequentialDuplicate.status === 200, `sequential duplicate expected 200, got ${sequentialDuplicate.status}`);
    assert(sequentialDuplicate.data?.status === 'already_processed', 'sequential duplicate must be already_processed');
    const normalAfterDuplicate = await inspectCase(connection, normal, normalEventId);
    assert(normalAfterDuplicate.paymentEventCount === 1 && normalAfterDuplicate.outboxCount === 1, 'sequential duplicate created rows');
    report.push('PAY-APP-05 duplicate sequential webhook is idempotent');

    const concurrentEventId = `evt-pay-app-concurrent-${randomUUID()}`;
    const concurrentPayload = {
      eventId: concurrentEventId,
      provider,
      providerReference: concurrent.providerReference,
      event: 'payment.approved',
    };
    const concurrentHeaders = signedHeaders(concurrentPayload);
    const concurrentResponses = await Promise.all([
      postWebhook(concurrentPayload, concurrentHeaders),
      postWebhook(concurrentPayload, concurrentHeaders),
    ]);
    assert(concurrentResponses.every((response) => response.status === 200), 'concurrent duplicates must both return 200');
    const concurrentState = await inspectCase(connection, concurrent, concurrentEventId);
    assert(concurrentState.paymentStatus === 'approved' && concurrentState.orderStatus === 'paid', 'concurrent transition failed');
    assert(concurrentState.paymentEventCount === 1 && concurrentState.outboxCount === 1, 'concurrent duplicate created rows');
    report.push('PAY-APP-06 duplicate concurrent webhook is idempotent');

    const rollbackEventId = `evt-pay-app-rollback-${randomUUID()}`;
    const rollbackPayload = {
      eventId: rollbackEventId,
      provider,
      providerReference: rollback.providerReference,
      event: 'payment.approved',
    };
    const injectedFailure = await postWebhook(
      rollbackPayload,
      signedHeaders(rollbackPayload, { 'x-qa-payment-approved-failure': 'before-commit' })
    );
    assert(injectedFailure.status === 500, `injected failure expected 500, got ${injectedFailure.status}`);
    const rolledBackState = await inspectCase(connection, rollback, rollbackEventId);
    assert(rolledBackState.paymentStatus === 'processing', `rollback payment expected processing, got ${rolledBackState.paymentStatus}`);
    assert(rolledBackState.orderStatus === 'placed', `rollback order expected placed, got ${rolledBackState.orderStatus}`);
    assert(rolledBackState.paymentEventCount === 0, 'rollback left payment event');
    assert(rolledBackState.outboxCount === 0, 'rollback left outbox');
    assert(rolledBackState.inboxCount === 1 && rolledBackState.inboxProcessed === 0, 'rollback left inbox processed');
    report.push('PAY-APP-07 injected pre-commit failure leaves no partial state');

    const retryAfterFailure = await postWebhook(rollbackPayload, signedHeaders(rollbackPayload));
    assert(retryAfterFailure.status === 200, `retry after failure expected 200, got ${retryAfterFailure.status}`);
    const recoveredState = await inspectCase(connection, rollback, rollbackEventId);
    assert(recoveredState.paymentStatus === 'approved' && recoveredState.orderStatus === 'paid', 'retry did not recover state');
    assert(recoveredState.paymentEventCount === 1 && recoveredState.outboxCount === 1, 'retry did not create exactly one event/outbox');
    assert(recoveredState.inboxProcessed === 1, 'retry did not finalize inbox');
    report.push('PAY-APP-08 retry after controlled failure succeeds');

    const approvedPendingPayload = {
      eventId: `evt-pay-app-pending-approved-${randomUUID()}`,
      provider,
      providerReference: normal.providerReference,
      event: 'payment.pending',
    };
    const pendingApproved = await postWebhook(approvedPendingPayload, signedHeaders(approvedPendingPayload));
    assert(pendingApproved.status === 409, `pending on approved expected 409, got ${pendingApproved.status}`);

    const failedPendingPayload = {
      eventId: `evt-pay-app-pending-failed-${randomUUID()}`,
      provider,
      providerReference: terminalFailed.providerReference,
      event: 'payment.pending',
    };
    const pendingFailed = await postWebhook(failedPendingPayload, signedHeaders(failedPendingPayload));
    assert(pendingFailed.status === 409, `pending on failed expected 409, got ${pendingFailed.status}`);
    const [terminalRows] = await connection.execute(
      `SELECT payment_id, status FROM payments WHERE payment_id IN (?, ?)`,
      [normal.paymentId, terminalFailed.paymentId]
    );
    const terminalStatuses = new Map(terminalRows.map((row) => [row.payment_id, row.status]));
    assert(terminalStatuses.get(normal.paymentId) === 'approved', 'pending downgraded approved payment');
    assert(terminalStatuses.get(terminalFailed.paymentId) === 'failed', 'pending downgraded failed payment');
    report.push('PAY-APP-09 pending event does not downgrade terminal payment');

    const downstreamAfter = await downstreamCounts(connection, fixtures);
    assert(JSON.stringify(downstreamAfter) === JSON.stringify(downstreamBefore), 'downstream side-effect delta detected');
    assert(calledPaths.every((path) => path === '/api/payments/webhook'), 'gate called a forbidden route');
    report.push('PAY-APP-10 no production, shipping, split, license, commission, referral, payout, Dimona or provider-real side effect occurred');

    console.log(
      JSON.stringify(
        {
          status: 'PASS',
          classification: 'QA_PAYMENT_APPROVED_DECOUPLING_ISOLATION_PASS',
          baseUrl,
          database: expectedDatabase,
          calledPaths,
          report,
          downstreamBefore,
          downstreamAfter,
          notValidated: [
            'outbox consumer',
            'production and shipping',
            'splits, licenses, commissions, referral, attribution and payout',
            'Dimona or any real provider',
            'external HML, public Base URL and payment cutover',
          ],
        },
        null,
        2
      )
    );
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: 'FAIL',
        classification: 'PAYMENT_APPROVED_DECOUPLING_QA_REPAIR_REQUIRED',
        baseUrl,
        calledPaths,
        error: String(error),
      },
      null,
      2
    )
  );
  process.exit(1);
});
