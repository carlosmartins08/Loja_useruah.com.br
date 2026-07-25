import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const port = Number(process.env.QA_PORT ?? 3347);
const baseUrl = `http://localhost:${port}`;
const nextBin = join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const tmpStore = join(process.cwd(), '.tmp-store');
const campaignStorePath = join(tmpStore, 'campaigns.json');
const campaignProductsStorePath = join(tmpStore, 'campaign-products.json');

function resolveQaDatabaseUrl() {
  const qaDatabaseUrl = String(process.env.QA_DATABASE_URL ?? '').trim();
  if (!qaDatabaseUrl) throw new Error('QA_DATABASE_URL_REQUIRED');

  let parsed;
  try {
    parsed = new URL(qaDatabaseUrl);
  } catch {
    throw new Error('QA_DATABASE_URL_MUST_BE_MYSQL');
  }

  if (parsed.protocol !== 'mysql:' && parsed.protocol !== 'mysql2:') {
    throw new Error('QA_DATABASE_URL_MUST_BE_MYSQL');
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  if (!database || !/(qa|test|disposable|ephemeral)/i.test(database)) {
    throw new Error('QA_DATABASE_URL_MUST_TARGET_QA_DATABASE');
  }

  const inheritedDatabaseUrl = String(process.env.DATABASE_URL ?? '').trim();
  if (inheritedDatabaseUrl) {
    try {
      if (new URL(inheritedDatabaseUrl).toString() === parsed.toString()) {
        throw new Error('QA_DATABASE_URL_MUST_DIFFER_FROM_DATABASE_URL');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'QA_DATABASE_URL_MUST_DIFFER_FROM_DATABASE_URL') {
        throw error;
      }
      if (inheritedDatabaseUrl === qaDatabaseUrl) {
        throw new Error('QA_DATABASE_URL_MUST_DIFFER_FROM_DATABASE_URL');
      }
    }
  }

  return qaDatabaseUrl;
}

const qaDatabaseUrl = resolveQaDatabaseUrl();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer(child) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 60000) {
    if (child.exitCode !== null) throw new Error(`server exited before readiness: ${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/api/catalog-items`);
      if (response.ok) return;
    } catch {
      // keep polling until the timeout
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`server readiness timeout at ${baseUrl}`);
}

function startServer() {
  const child = spawn(process.execPath, [nextBin, 'start', '-p', String(port)], {
    env: {
      ...process.env,
      DATABASE_URL: qaDatabaseUrl,
      PAYMENT_PERSISTENCE: 'mysql',
      QA_SCRIPT: process.env.QA_SCRIPT ?? 'scripts/qa/qa-campaign-authority-restart.mjs',
      RBAC_ACTIVE: 'true',
      ALLOW_HEADER_ACTOR_FALLBACK: 'true',
    },
    stdio: 'inherit',
    windowsHide: process.platform === 'win32',
  });
  return { child, ready: waitForServer(child) };
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 5000);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    child.kill();
  });
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // ignore non-json responses
  }
  return { response, data };
}

function snapshot(path) {
  return existsSync(path) ? readFileSync(path) : null;
}

function installStaleLocalCampaign(campaign, catalogItemId) {
  mkdirSync(tmpStore, { recursive: true });
  writeFileSync(
    campaignStorePath,
    JSON.stringify(
      {
        campaigns: {
          [campaign.campaignId]: {
            ...campaign,
            name: 'stale-local-campaign',
            status: 'rejected',
          },
        },
      },
      null,
      2
    ),
    'utf8'
  );
  writeFileSync(
    campaignProductsStorePath,
    JSON.stringify(
      {
        links: {
          [`CMPROD-STALE-${campaign.campaignId}`]: {
            campaignProductId: `CMPROD-STALE-${campaign.campaignId}`,
            campaignId: campaign.campaignId,
            catalogItemId,
            linkedBy: 'stale-local',
            createdAt: new Date().toISOString(),
          },
        },
      },
      null,
      2
    ),
    'utf8'
  );
}

function restore(path, value) {
  if (value === null) {
    if (existsSync(path)) unlinkSync(path);
    return;
  }
  writeFileSync(path, value);
}

async function run() {
  const report = [];
  const suffix = Date.now();
  const curatorHeaders = { 'x-actor-id': `qa-curator-authority-${suffix}`, 'x-actor-role': 'curator' };
  const ownerHeaders = { 'x-actor-id': `qa-community-authority-${suffix}`, 'x-actor-role': 'community_manager' };
  const adminHeaders = { 'x-actor-id': `qa-admin-authority-${suffix}`, 'x-actor-role': 'platform_admin' };
  const campaignSnapshot = snapshot(campaignStorePath);
  const productsSnapshot = snapshot(campaignProductsStorePath);
  let first = null;
  let second = null;
  let campaign = null;
  let catalogItemId = null;

  try {
    first = startServer();
    await first.ready;

    const bootstrap = await request('/api/catalog-items/bootstrap', { method: 'POST', headers: curatorHeaders });
    assert(bootstrap.response.status === 200, `catalog bootstrap expected 200, got ${bootstrap.response.status}`);
    const catalog = await request('/api/catalog-items');
    assert(catalog.response.status === 200, `catalog list expected 200, got ${catalog.response.status}`);
    const item = catalog.data?.items?.find((row) => row.catalogItemId === '1') ?? catalog.data?.items?.[0];
    assert(item?.catalogItemId, 'published catalog item missing');
    catalogItemId = item.catalogItemId;

    const created = await request('/api/campaigns', {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({
        organizationId: `ORG-QA-CAMPAIGN-AUTHORITY-${suffix}`,
        name: `Campaign authority ${suffix}`,
        description: 'QA for campaign authority across restart.',
        budget: 2400,
        progressivePriceRule: '2-5=5%;6-10=10%',
      }),
    });
    assert(created.response.status === 201, `campaign create expected 201, got ${created.response.status}`);
    campaign = created.data?.campaign;
    assert(campaign?.campaignId, 'campaignId missing');

    const linked = await request(`/api/campaigns/${campaign.campaignId}/products`, {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({ catalogItemId }),
    });
    assert(linked.response.status === 201 || linked.response.status === 200, `campaign link expected 200|201, got ${linked.response.status}`);

    const submitted = await request(`/api/campaigns/${campaign.campaignId}/submit`, {
      method: 'POST',
      headers: ownerHeaders,
      body: '{}',
    });
    assert(submitted.response.status === 200, `campaign submit expected 200, got ${submitted.response.status}`);

    const queue = await request('/api/admin/impact-reviews?status=pending_review&entityType=Campaign', {
      headers: adminHeaders,
    });
    assert(queue.response.status === 200, `impact queue expected 200, got ${queue.response.status}`);
    const review = queue.data?.reviews?.find((row) => row.entityId === campaign.campaignId);
    assert(review?.reviewId, 'campaign impact review missing');

    const approvedReview = await request(`/api/admin/impact-reviews/${review.reviewId}/approve`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ reason: 'campaign authority restart proof' }),
    });
    assert(approvedReview.response.status === 200, `impact approve expected 200, got ${approvedReview.response.status}`);

    const activated = await request(`/api/campaigns/${campaign.campaignId}/approve`, {
      method: 'POST',
      headers: adminHeaders,
      body: '{}',
    });
    assert(activated.response.status === 200, `campaign activate expected 200, got ${activated.response.status}`);

    const publicBefore = await request(`/api/campaigns/${campaign.campaignId}/public`);
    assert(publicBefore.response.status === 200, `public campaign before restart expected 200, got ${publicBefore.response.status}`);
    assert(publicBefore.data?.state === 'active', 'campaign should be active before restart');
    assert(publicBefore.data?.products?.some((row) => row.catalogItemId === catalogItemId), 'linked product missing before restart');
    await stopServer(first.child);
    first = null;
    report.push('CAMPAIGN-AUTH-01 active campaign and product link resolved from MySQL');

    installStaleLocalCampaign(campaign, catalogItemId);
    second = startServer();
    await second.ready;

    const publicAfter = await request(`/api/campaigns/${campaign.campaignId}/public`);
    assert(publicAfter.response.status === 200, `public campaign after restart expected 200, got ${publicAfter.response.status}`);
    assert(publicAfter.data?.state === 'active', `campaign did not remain active after restart: ${JSON.stringify(publicAfter.data)}`);
    assert(publicAfter.data?.campaign?.name === campaign.name, 'public campaign read stale local name');
    assert(publicAfter.data?.products?.some((row) => row.catalogItemId === catalogItemId), 'product link did not survive restart');
    report.push('CAMPAIGN-AUTH-02 public campaign survived restart without local campaign/link fallback');
  } finally {
    if (first) await stopServer(first.child);
    if (second) await stopServer(second.child);
    restore(campaignStorePath, campaignSnapshot);
    restore(campaignProductsStorePath, productsSnapshot);
  }

  console.log(JSON.stringify({ status: 'PASS', baseUrl, persistence: 'mysql', campaignId: campaign?.campaignId, catalogItemId, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, persistence: 'mysql', error: String(error) }, null, 2));
  process.exit(1);
});
