#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

function parseEnvDuplicates(filePath) {
  if (!existsSync(filePath)) return { filePath, duplicates: [] };
  const raw = readFileSync(filePath, 'utf8');
  const seen = new Map();
  const duplicates = [];
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const lineNo = i + 1;
    if (seen.has(key)) {
      duplicates.push({ key, firstLine: seen.get(key), duplicateLine: lineNo });
    } else {
      seen.set(key, lineNo);
    }
  }
  return { filePath, duplicates };
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function normalizeRouteShape(filePath) {
  return filePath
    .replace(/\\/g, '/')
    .replace(/^app\/api\//, '')
    .replace(/\/route\.ts$/, '')
    .replace(/\[[^\]]+\]/g, '{}');
}

function routeCollisionReport() {
  const files = walk(join(process.cwd(), 'app', 'api'))
    .map((p) => relative(process.cwd(), p).replace(/\\/g, '/'))
    .filter((p) => p.endsWith('/route.ts'));
  const byShape = new Map();
  for (const file of files) {
    const shape = normalizeRouteShape(file);
    if (!byShape.has(shape)) byShape.set(shape, []);
    byShape.get(shape).push(file);
  }
  const collisions = Array.from(byShape.entries())
    .filter(([, rows]) => rows.length > 1)
    .map(([shape, filesInShape]) => ({ shape, files: filesInShape }));
  return { totalRoutes: files.length, collisions };
}

function adminGuardReport() {
  const adminDir = join(process.cwd(), 'app', 'api', 'admin');
  if (!existsSync(adminDir)) return { missingGuards: [] };
  const files = walk(adminDir).filter((p) => p.replace(/\\/g, '/').endsWith('/route.ts'));
  const missingGuards = [];
  for (const file of files) {
    const rel = relative(process.cwd(), file).replace(/\\/g, '/');
    const raw = readFileSync(file, 'utf8');
    const hasActor = raw.includes('getActorFromRequest');
    const hasForbidden = raw.includes("error: 'forbidden'") || raw.includes('status: 403');
    if (!hasActor || !hasForbidden) {
      missingGuards.push({ file: rel, hasActor, hasForbidden });
    }
  }
  return { checked: files.length, missingGuards };
}

function ensureRequiredDocs() {
  const required = [
    'docs/BLIND_SPOT_CLOSURE_CHECKLIST.md',
    'docs/EXECUTION_TRACKING.md',
    'docs/CHANGELOG_GOVERNANCE.md',
    'docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md',
  ];
  const missing = required.filter((file) => !existsSync(join(process.cwd(), file)));
  return { required, missing };
}

function main() {
  const env = parseEnvDuplicates(join(process.cwd(), '.env'));
  const envExample = parseEnvDuplicates(join(process.cwd(), '.env.example'));
  const routes = routeCollisionReport();
  const admin = adminGuardReport();
  const docs = ensureRequiredDocs();

  const hasIssues =
    env.duplicates.length > 0 ||
    envExample.duplicates.length > 0 ||
    routes.collisions.length > 0 ||
    admin.missingGuards.length > 0 ||
    docs.missing.length > 0;

  const payload = {
    status: hasIssues ? 'FAIL' : 'PASS',
    report: {
      envDuplicates: env.duplicates,
      envExampleDuplicates: envExample.duplicates,
      routeShapeCollisions: routes.collisions,
      adminGuardMissing: admin.missingGuards,
      docsMissing: docs.missing,
      totals: {
        apiRoutes: routes.totalRoutes,
        adminRoutes: admin.checked ?? 0,
      },
    },
  };

  if (hasIssues) {
    console.error(JSON.stringify(payload, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(payload, null, 2));
}

main();
