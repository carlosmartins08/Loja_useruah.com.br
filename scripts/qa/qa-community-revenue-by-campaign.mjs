import mysql from 'mysql2/promise';
import { ensureQaEnvLoaded } from '../lib/qa-env.mjs';

ensureQaEnvLoaded();

const baseUrl = process.env.QA_BASE_URL ?? 'http://localhost:3338';
const qaIdentityPassword = String(process.env.QA_IDENTITY_PASSWORD ?? '');
const QA_DATABASE_URL = String(process.env.QA_DATABASE_URL ?? '').trim();
const OWNER = {
  email: 'qa-community-manager@useruah.local',
  userId: 'usr:qa-community-manager@useruah.local',
  expectedRole: 'community_manager',
};
const FOREIGN_OWNER = {
  email: 'qa-foreign-community-manager@useruah.local',
  expectedRole: 'community_manager',
};
const FORBIDDEN_ACTOR = {
  email: 'qa-curator@useruah.local',
  expectedRole: 'curator',
};
const FIXTURE = {
  campaignId: 'CMP-QA-COMMUNITY-REVENUE-READ',
  orderId: 'ORD-QA-COMMUNITY-REVENUE-READ',
  orderItemId: 'ITEM-QA-COMMUNITY-REVENUE-READ',
  commissionId: 'COM-QA-COMMUNITY-REVENUE-READ',
  campaignName: 'Campanha QA leitura de receita',
  amount: 42.5,
};
const FORBIDDEN_PATH_FRAGMENTS = [
  '/api/orders',
  '/api/payments',
  '/api/webhooks',
  '/api/production-jobs',
  '/ship',
  '/shipment',
  '/api/affiliate',
  '/api/referral',
  '/af/',
  'dimona',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertRevenueReadPath(pathname) {
  const normalized = pathname.toLowerCase();
  const forbiddenPath = FORBIDDEN_PATH_FRAGMENTS.find((fragment) => normalized.includes(fragment));
  assert(!forbiddenPath, `QA_COMMUNITY_REVENUE_FORBIDDEN_ENDPOINT:${forbiddenPath}`);
}

function toMysqlDatetime(iso) {
  return iso.replace('T', ' ').replace('Z', '');
}

function resolveQaDatabaseUrl() {
  assert(QA_DATABASE_URL, 'QA_DATABASE_URL_REQUIRED');
  let parsed;
  try {
    parsed = new URL(QA_DATABASE_URL);
  } catch {
    throw new Error('QA_DATABASE_URL_MUST_BE_MYSQL');
  }

  assert(parsed.protocol === 'mysql:' || parsed.protocol === 'mysql2:', 'QA_DATABASE_URL_MUST_BE_MYSQL');
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  assert(database && /(qa|test|disposable|ephemeral)/i.test(database), 'QA_DATABASE_URL_MUST_TARGET_QA_DATABASE');
  return { database, url: QA_DATABASE_URL };
}

async function req(method, pathname, body, options = {}) {
  assertRevenueReadPath(pathname);
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data, setCookie: response.headers.get('set-cookie') ?? '' };
}

async function loginQaUser(user) {
  assert(qaIdentityPassword, 'QA_IDENTITY_PASSWORD_REQUIRED');
  const response = await req('POST', '/api/auth/login', { email: user.email, password: qaIdentityPassword });
  const data = response.data;
  assert(response.status === 200, `${user.expectedRole} login expected 200, got ${response.status}`);
  const match = response.setCookie.match(/ruah_session=([^;]+)/);
  assert(match?.[1], `${user.expectedRole} ruah_session cookie missing after login`);
  assert(data?.session?.activeRole === user.expectedRole, `${user.expectedRole} activeRole mismatch`);
  return { cookie: `ruah_session=${match[1]}` };
}

function buildOrderItem(now) {
  return {
    orderItemId: FIXTURE.orderItemId,
    catalogItemId: 'QA-COMMUNITY-REVENUE-CATALOG',
    artworkId: 'ART-QA-COMMUNITY-REVENUE',
    artworkAuthorId: 'usr:qa-artist-not-used',
    productBaseId: 'BASE-QA-COMMUNITY-REVENUE',
    productName: 'Produto QA para leitura de receita',
    variantId: 'VAR-QA-COMMUNITY-REVENUE',
    variantLabel: 'QA',
    productImage: '',
    supplierId: 'supplier-qa-not-dispatched',
    campaignId: FIXTURE.campaignId,
    campaignName: FIXTURE.campaignName,
    campaignProgressivePriceRule: 'qa-fixture-read-only',
    organizationId: 'ORG-QA-COMMUNITY-REVENUE',
    communityOwnerId: OWNER.userId,
    shippingAddress: {
      recipientName: 'Fixture QA sem envio',
      cep: '00000-000',
      street: 'Nao aplicavel',
      number: '0',
      city: 'QA',
      state: 'QA',
      country: 'BR',
    },
    quantity: 1,
    unitPrice: FIXTURE.amount,
    priceCompositionVersion: 'qa-fixture-read-only',
    snapshotVersion: 'phase2-context-pricing-v1',
    grossItemAmount: FIXTURE.amount,
    supplierAmount: 0,
    artistLicenseAmount: 0,
    platformCommissionAmount: 0,
    gatewayFeeAmount: 0,
    shippingAmount: 0,
    taxReserveAmount: 0,
    communityCommissionAmount: FIXTURE.amount,
    supplierNetAmount: 0,
    artistNetAmount: 0,
    platformNetAmount: 0,
    fixtureCreatedAt: now,
  };
}

async function prepareRevenueFixture() {
  const { database, url } = resolveQaDatabaseUrl();
  const now = new Date().toISOString();
  const mysqlNow = toMysqlDatetime(now);
  const sourceKey = `order.paid:${FIXTURE.orderId}:item:${FIXTURE.orderItemId}:community:${OWNER.userId}`;
  const connection = await mysql.createConnection(url);

  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO campaigns (
        campaign_id, organization_id, name, description, budget, progressive_price_rule,
        starts_at, ends_at, status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, 'active', ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name), description = VALUES(description), budget = VALUES(budget),
        progressive_price_rule = VALUES(progressive_price_rule), status = 'active', updated_at = VALUES(updated_at)`,
      [
        FIXTURE.campaignId,
        'ORG-QA-COMMUNITY-REVENUE',
        FIXTURE.campaignName,
        'Fixture QA idempotente para leitura de receita por campanha; nao representa pedido ou pagamento real.',
        0,
        'qa-fixture-read-only',
        OWNER.userId,
        mysqlNow,
        mysqlNow,
      ]
    );
    await connection.execute(
      `INSERT INTO orders (order_id, customer_id, items_json, total_amount, status, created_at, updated_at, paid_at)
       VALUES (?, ?, ?, ?, 'shipped', ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         items_json = VALUES(items_json), total_amount = VALUES(total_amount), status = 'shipped',
         updated_at = VALUES(updated_at), paid_at = VALUES(paid_at)`,
      [
        FIXTURE.orderId,
        'usr:qa-fixture-not-a-customer',
        JSON.stringify(JSON.stringify([buildOrderItem(now)])),
        FIXTURE.amount,
        mysqlNow,
        mysqlNow,
        mysqlNow,
      ]
    );
    await connection.execute(
      `INSERT INTO commissions (
        commission_id, order_id, owner_id, owner_role, amount, currency, status, source_key, created_at, updated_at
      ) VALUES (?, ?, ?, 'community_manager', ?, 'BRL', 'available', ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        owner_id = VALUES(owner_id), owner_role = 'community_manager', amount = VALUES(amount),
        currency = 'BRL', status = 'available', updated_at = VALUES(updated_at)`,
      [FIXTURE.commissionId, FIXTURE.orderId, OWNER.userId, FIXTURE.amount, sourceKey, mysqlNow, mysqlNow]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }

  return { database, sourceKey };
}

async function run() {
  assert(qaIdentityPassword, 'QA_IDENTITY_PASSWORD_REQUIRED');
  const report = [];
  const fixture = await prepareRevenueFixture();
  report.push(`QA-COMMUNITY-REVENUE-00 controlled read-only fixture prepared in ${fixture.database}`);

  const ownerSession = await loginQaUser(OWNER);
  const foreignOwnerSession = await loginQaUser(FOREIGN_OWNER);
  const forbiddenSession = await loginQaUser(FORBIDDEN_ACTOR);
  const ownerHeaders = { cookie: ownerSession.cookie };
  const foreignOwnerHeaders = { cookie: foreignOwnerSession.cookie };
  const forbiddenHeaders = { cookie: forbiddenSession.cookie };

  const byCampaign = await req('GET', '/api/commissions/me/campaigns?includeOrders=true', undefined, { headers: ownerHeaders });
  assert(byCampaign.status === 200, `community revenue by campaign expected 200, got ${byCampaign.status}`);
  const campaignRows = Array.isArray(byCampaign.data?.campaigns) ? byCampaign.data.campaigns : [];
  const campaignRow = campaignRows.find((row) => row.campaignId === FIXTURE.campaignId);
  assert(campaignRow, 'controlled campaign revenue row not found');
  assert(campaignRow.orderCount === 1, `campaign orderCount expected 1, got ${String(campaignRow.orderCount)}`);
  assert(campaignRow.commissionCount === 1, `campaign commissionCount expected 1, got ${String(campaignRow.commissionCount)}`);
  assert(Number(campaignRow.availableGross) === FIXTURE.amount, `campaign availableGross expected ${FIXTURE.amount}, got ${String(campaignRow.availableGross)}`);
  const orderRows = Array.isArray(byCampaign.data?.orders) ? byCampaign.data.orders : [];
  assert(orderRows.some((row) => row.campaignId === FIXTURE.campaignId && row.orderId === FIXTURE.orderId), 'campaign drilldown fixture missing');
  report.push('QA-COMMUNITY-REVENUE-01 owner reads the controlled campaign revenue breakdown');

  const aggregatedLedger = await req('GET', '/api/commissions/me', undefined, { headers: ownerHeaders });
  assert(aggregatedLedger.status === 200, `community aggregated ledger expected 200, got ${aggregatedLedger.status}`);
  assert(Number(aggregatedLedger.data?.balances?.availableGross) >= FIXTURE.amount, 'aggregate community ledger should include controlled commission');
  report.push('QA-COMMUNITY-REVENUE-02 owner aggregate ledger remains coherent with campaign breakdown');

  const foreignOwner = await req('GET', '/api/commissions/me/campaigns?includeOrders=true', undefined, { headers: foreignOwnerHeaders });
  assert(foreignOwner.status === 200, `foreign community owner endpoint expected 200, got ${foreignOwner.status}`);
  const foreignRows = Array.isArray(foreignOwner.data?.campaigns) ? foreignOwner.data.campaigns : [];
  assert(!foreignRows.some((row) => row.campaignId === FIXTURE.campaignId), 'foreign community manager must not read owner campaign revenue');
  report.push('QA-COMMUNITY-REVENUE-03 foreign community manager cannot read another owner revenue');

  const forbidden = await req('GET', '/api/commissions/me/campaigns', undefined, { headers: forbiddenHeaders });
  assert(forbidden.status === 403, `curator community revenue expected 403, got ${forbidden.status}`);
  report.push('QA-COMMUNITY-REVENUE-04 non-finance role is blocked from community revenue');

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        scope: 'community_campaign_revenue_read_ownership_only',
        database: fixture.database,
        campaignId: FIXTURE.campaignId,
        report,
        notValidated: ['order', 'checkout', 'payment', 'webhook', 'production', 'shipping', 'referral', 'attribution'],
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', scope: 'community_campaign_revenue_read_ownership_only', error: String(error) }, null, 2));
  process.exit(1);
});
