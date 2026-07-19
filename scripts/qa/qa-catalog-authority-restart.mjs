import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const port = Number(process.env.QA_PORT ?? 3345);
const baseUrl = `http://localhost:${port}`;
const nextBin = join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const catalogStorePath = join(process.cwd(), '.tmp-store', 'catalog-items.json');

function resolvePersistence() {
  const fromProcess = process.env.PAYMENT_PERSISTENCE?.trim();
  if (fromProcess) return fromProcess.toLowerCase();
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) return 'sqlite';
  const line = readFileSync(envPath, 'utf8').split(/\r?\n/).find((entry) => /^PAYMENT_PERSISTENCE\s*=/.test(entry));
  return line ? line.replace(/^PAYMENT_PERSISTENCE\s*=\s*/, '').trim().replace(/^['"]|['"]$/g, '').toLowerCase() : 'sqlite';
}

const persistence = resolvePersistence();

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
    env: { ...process.env, QA_SCRIPT: process.env.QA_SCRIPT ?? 'scripts/qa/qa-catalog-authority-restart.mjs' },
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

function readLocalCatalogSnapshot() {
  return existsSync(catalogStorePath) ? readFileSync(catalogStorePath) : null;
}

function writeStaleLocalCatalog() {
  mkdirSync(join(process.cwd(), '.tmp-store'), { recursive: true });
  writeFileSync(
    catalogStorePath,
    JSON.stringify({ '1': { catalogItemId: '1', name: 'STALE_LOCAL_ONLY_CATALOG' } }, null, 2),
    'utf8'
  );
}

function restoreLocalCatalog(snapshot) {
  if (snapshot === null) {
    if (existsSync(catalogStorePath)) {
      unlinkSync(catalogStorePath);
    }
    return;
  }
  writeFileSync(catalogStorePath, snapshot);
}

async function run() {
  const report = [];
  let localSnapshot = null;
  let first = null;
  let second = null;

  try {
    first = startServer();
    await first.ready;

    const bootstrap = await request('/api/catalog-items/bootstrap', {
      method: 'POST',
      headers: { 'x-actor-id': 'qa-curator', 'x-actor-role': 'curator' },
    });
    assert(bootstrap.response.status === 200, `bootstrap expected 200, got ${bootstrap.response.status}`);

    const catalogBeforeRestart = await request('/api/catalog-items');
    assert(catalogBeforeRestart.response.status === 200, `catalog before restart expected 200, got ${catalogBeforeRestart.response.status}`);
    const canonicalItem = catalogBeforeRestart.data?.items?.find((item) => item.catalogItemId === '1');
    assert(canonicalItem?.name, 'canonical catalog item 1 missing before restart');
    await stopServer(first.child);
    first = null;
    report.push('CAT-AUTH-01 catalog bootstrap and public read completed before process restart');

    if (persistence === 'mysql') {
      localSnapshot = readLocalCatalogSnapshot();
      writeStaleLocalCatalog();
    }

    second = startServer();
    await second.ready;
    const catalogAfterRestart = await request('/api/catalog-items');
    assert(catalogAfterRestart.response.status === 200, `catalog after restart expected 200, got ${catalogAfterRestart.response.status}`);
    const itemAfterRestart = catalogAfterRestart.data?.items?.find((item) => item.catalogItemId === '1');
    assert(itemAfterRestart?.name === canonicalItem.name, 'catalog item changed after process restart');
    report.push('CAT-AUTH-02 catalog item persisted across process restart');

    if (persistence === 'mysql') {
      assert(itemAfterRestart.name !== 'STALE_LOCAL_ONLY_CATALOG', 'MySQL catalog read fell back to stale local store');
      report.push('CAT-AUTH-03 MySQL remained the catalog authority despite stale local store data');
    }
  } finally {
    if (first) await stopServer(first.child);
    if (second) await stopServer(second.child);
    if (persistence === 'mysql') restoreLocalCatalog(localSnapshot);
  }

  console.log(JSON.stringify({ status: 'PASS', baseUrl, persistence, report }, null, 2));
}

run().catch((error) => {
  console.error(JSON.stringify({ status: 'FAIL', baseUrl, persistence, error: String(error) }, null, 2));
  process.exit(1);
});
