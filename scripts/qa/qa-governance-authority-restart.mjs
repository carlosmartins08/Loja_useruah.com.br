import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const port = Number(process.env.QA_PORT ?? 3346);
const baseUrl = `http://localhost:${port}`;
const nextBin = join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const tmpStore = join(process.cwd(), '.tmp-store');
const artworkStorePath = join(tmpStore, 'artworks.json');
const impactStorePath = join(tmpStore, 'impact-reviews.json');

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
      QA_SCRIPT: process.env.QA_SCRIPT ?? 'scripts/qa/qa-governance-authority-restart.mjs',
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

function installStaleLocalGovernance(artworkId, review) {
  mkdirSync(tmpStore, { recursive: true });
  writeFileSync(
    artworkStorePath,
    JSON.stringify(
      {
        [artworkId]: {
          artworkId,
          authorId: 'stale-local',
          status: 'rejected',
          sourceAsset: '/assets/stale-local.svg',
          metadata: { theme: 'stale', category: 'stale', tags: [] },
          submittedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      null,
      2
    ),
    'utf8'
  );
  writeFileSync(
    impactStorePath,
    JSON.stringify(
      {
        reviews: {
          [review.reviewId]: {
            ...review,
            status: 'rejected',
            decisionReason: 'stale-local-only',
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
  const curatorHeaders = { 'x-actor-id': 'qa-curator', 'x-actor-role': 'curator' };
  const adminHeaders = { 'x-actor-id': 'qa-admin', 'x-actor-role': 'platform_admin' };
  const artworkSnapshot = snapshot(artworkStorePath);
  const impactSnapshot = snapshot(impactStorePath);
  let first = null;
  let second = null;

  try {
    first = startServer();
    await first.ready;
    const bootstrap = await request('/api/catalog-items/bootstrap', { method: 'POST', headers: curatorHeaders });
    assert(bootstrap.response.status === 200, `bootstrap expected 200, got ${bootstrap.response.status}`);

    const artworksBefore = await request('/api/artworks?status=approved', { headers: curatorHeaders });
    assert(artworksBefore.response.status === 200, `artworks before restart expected 200, got ${artworksBefore.response.status}`);
    const artwork = artworksBefore.data?.artworks?.find((row) => row.artworkId === 'ART-SEED-1');
    assert(artwork?.status === 'approved', 'approved artwork seed missing before restart');

    const reviewsBefore = await request('/api/admin/impact-reviews?entityType=CatalogItem', { headers: adminHeaders });
    assert(reviewsBefore.response.status === 200, `impact reviews before restart expected 200, got ${reviewsBefore.response.status}`);
    const review = reviewsBefore.data?.reviews
      ?.filter((row) => row.entityType === 'CatalogItem' && row.entityId === '1')
      ?.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
    assert(review?.status === 'approved', 'approved catalog impact review missing before restart');
    await stopServer(first.child);
    first = null;
    report.push('GOV-AUTH-01 approved artwork and impact review resolved from MySQL');

    installStaleLocalGovernance(artwork.artworkId, review);
    second = startServer();
    await second.ready;

    const artworksAfter = await request('/api/artworks?status=approved', { headers: curatorHeaders });
    const artworkAfter = artworksAfter.data?.artworks?.find((row) => row.artworkId === artwork.artworkId);
    assert(artworkAfter?.status === 'approved', 'artwork did not survive process restart');
    assert(artworkAfter.authorId !== 'stale-local', 'artwork read fell back to stale local store');
    report.push('GOV-AUTH-02 approved artwork survived restart without local fallback');

    const reviewsAfter = await request('/api/admin/impact-reviews?entityType=CatalogItem', { headers: adminHeaders });
    const reviewAfter = reviewsAfter.data?.reviews?.find((row) => row.reviewId === review.reviewId);
    assert(reviewAfter?.status === 'approved', 'impact review did not survive process restart');
    assert(reviewAfter.decisionReason !== 'stale-local-only', 'impact review read fell back to stale local store');
    report.push('GOV-AUTH-03 approved impact review survived restart without local fallback');
  } finally {
    if (first) await stopServer(first.child);
    if (second) await stopServer(second.child);
    restore(artworkStorePath, artworkSnapshot);
    restore(impactStorePath, impactSnapshot);
  }

  console.log(JSON.stringify({ status: 'PASS', baseUrl, persistence: 'mysql', report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, persistence: 'mysql', error: String(error) }, null, 2));
  process.exit(1);
});
