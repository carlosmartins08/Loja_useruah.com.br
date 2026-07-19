import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const port = Number(process.env.QA_PORT ?? 3348);
const baseUrl = `http://localhost:${port}`;
const nextBin = join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const tmpStore = join(process.cwd(), '.tmp-store');
const referralStorePath = join(tmpStore, 'referral-links.json');

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
      PAYMENT_PERSISTENCE: 'mysql',
      QA_SCRIPT: process.env.QA_SCRIPT ?? 'scripts/qa/qa-referral-authority-restart.mjs',
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

function installStaleLocalReferral(link) {
  mkdirSync(tmpStore, { recursive: true });
  writeFileSync(
    referralStorePath,
    JSON.stringify(
      {
        links: {
          [link.referralLinkId]: {
            ...link,
            slug: 'stale-local-referral',
            status: 'paused',
          },
        },
        events: {},
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
  const affiliateHeaders = { 'x-actor-id': `qa-affiliate-authority-${suffix}`, 'x-actor-role': 'affiliate' };
  const adminHeaders = { 'x-actor-id': `qa-admin-referral-authority-${suffix}`, 'x-actor-role': 'platform_admin' };
  const referralSnapshot = snapshot(referralStorePath);
  let first = null;
  let second = null;
  let link = null;

  try {
    first = startServer();
    await first.ready;

    const created = await request('/api/affiliate/links', {
      method: 'POST',
      headers: affiliateHeaders,
      body: JSON.stringify({
        label: `Referral authority ${suffix}`,
        channel: 'qa',
        targetPath: '/shop',
        slug: `qa-referral-authority-${suffix}`,
      }),
    });
    assert(created.response.status === 201, `referral create expected 201, got ${created.response.status}`);
    link = created.data?.link;
    assert(link?.referralLinkId && link?.slug, 'referral link identity missing');

    const redirect = await request(`/af/${link.slug}`, { redirect: 'manual' });
    assert(redirect.response.status === 307, `referral redirect expected 307, got ${redirect.response.status}`);

    const conversionPayload = { orderId: `QA-REFERRAL-ORDER-${suffix}`, revenueAmount: 123.45 };
    const conversion = await request(`/api/affiliate/links/${link.referralLinkId}/conversions`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify(conversionPayload),
    });
    assert(conversion.response.status === 201, `conversion expected 201, got ${conversion.response.status}`);
    const repeatedConversion = await request(`/api/affiliate/links/${link.referralLinkId}/conversions`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify(conversionPayload),
    });
    assert(repeatedConversion.response.status === 200, `repeated conversion expected 200, got ${repeatedConversion.response.status}`);
    assert(repeatedConversion.data?.reused === true, 'repeated conversion should be idempotent');

    const before = await request(`/api/affiliate/links?ownerId=${encodeURIComponent(affiliateHeaders['x-actor-id'])}`, {
      headers: affiliateHeaders,
    });
    const beforeLink = before.data?.links?.find((row) => row.referralLinkId === link.referralLinkId);
    assert(before.response.status === 200, `referral list before restart expected 200, got ${before.response.status}`);
    assert(beforeLink?.status === 'active', 'referral link should be active before restart');
    assert(beforeLink?.clickCount === 1 && beforeLink?.conversionCount === 1, 'referral events missing before restart');
    await stopServer(first.child);
    first = null;
    report.push('REFERRAL-AUTH-01 link, click and conversion resolved from MySQL');

    installStaleLocalReferral(link);
    second = startServer();
    await second.ready;

    const after = await request(`/api/affiliate/links?ownerId=${encodeURIComponent(affiliateHeaders['x-actor-id'])}`, {
      headers: affiliateHeaders,
    });
    const afterLink = after.data?.links?.find((row) => row.referralLinkId === link.referralLinkId);
    assert(after.response.status === 200, `referral list after restart expected 200, got ${after.response.status}`);
    assert(afterLink?.status === 'active', 'referral link did not survive restart as active');
    assert(afterLink?.slug === link.slug, 'referral list read stale local slug');
    assert(afterLink?.clickCount === 1 && afterLink?.conversionCount === 1, 'referral events did not survive restart');
    report.push('REFERRAL-AUTH-02 link and events survived restart without local fallback');
  } finally {
    if (first) await stopServer(first.child);
    if (second) await stopServer(second.child);
    restore(referralStorePath, referralSnapshot);
  }

  console.log(JSON.stringify({ status: 'PASS', baseUrl, persistence: 'mysql', referralLinkId: link?.referralLinkId, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, persistence: 'mysql', error: String(error) }, null, 2));
  process.exit(1);
});
