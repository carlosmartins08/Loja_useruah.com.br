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

  function hasGuardMarkers(raw) {
    const hasActor = raw.includes('getActorFromRequest');
    const hasForbidden = raw.includes("error: 'forbidden'") || raw.includes('status: 403');
    return { hasActor, hasForbidden, ok: hasActor && hasForbidden };
  }

  function delegatedAdminApiGuardReport(raw) {
    const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@\/lib\/admin-api\/([^'"]+)['"]/g;
    const delegates = [];
    for (const match of raw.matchAll(importRegex)) {
      const importedNames = match[1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      const modulePath = match[2];
      const filePath = join(process.cwd(), 'lib', 'admin-api', `${modulePath}.ts`);
      const exists = existsSync(filePath);
      const targetRaw = exists ? readFileSync(filePath, 'utf8') : '';
      const markers = exists ? hasGuardMarkers(targetRaw) : { hasActor: false, hasForbidden: false, ok: false };
      delegates.push({
        modulePath: `lib/admin-api/${modulePath}.ts`,
        importedNames,
        exists,
        hasActor: markers.hasActor,
        hasForbidden: markers.hasForbidden,
        ok: markers.ok,
      });
    }

    return {
      delegates,
      ok: delegates.length > 0 && delegates.every((item) => item.ok),
    };
  }

  for (const file of files) {
    const rel = relative(process.cwd(), file).replace(/\\/g, '/');
    const raw = readFileSync(file, 'utf8');
    const direct = hasGuardMarkers(raw);
    const delegated = delegatedAdminApiGuardReport(raw);
    if (!direct.ok && !delegated.ok) {
      missingGuards.push({
        file: rel,
        hasActor: direct.hasActor,
        hasForbidden: direct.hasForbidden,
        delegatedModules: delegated.delegates,
      });
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

function executionTrackingReport() {
  const trackingPath = join(process.cwd(), 'docs', 'EXECUTION_TRACKING.md');
  if (!existsSync(trackingPath)) {
    return { ok: false, reason: 'missing_tracking', archiveFiles: [], lineCount: 0 };
  }
  const raw = readFileSync(trackingPath, 'utf8');
  const lineCount = raw.split(/\r?\n/).length;
  const archiveDir = join(process.cwd(), 'docs', 'archive');
  const archiveFiles = existsSync(archiveDir)
    ? readdirSync(archiveDir).filter((file) => /^EXECUTION_TRACKING_HISTORY_.*\.md$/.test(file))
    : [];

  return {
    ok: raw.includes('Historico narrativo completo foi arquivado em') && archiveFiles.length > 0 && lineCount <= 120,
    reason: !raw.includes('Historico narrativo completo foi arquivado em')
      ? 'missing_archive_pointer'
      : archiveFiles.length === 0
        ? 'missing_archive_file'
        : lineCount > 120
          ? 'tracking_too_long'
          : 'ok',
    archiveFiles,
    lineCount,
  };
}

function main() {
  const env = parseEnvDuplicates(join(process.cwd(), '.env'));
  const envExample = parseEnvDuplicates(join(process.cwd(), '.env.example'));
  const routes = routeCollisionReport();
  const admin = adminGuardReport();
  const docs = ensureRequiredDocs();
  const tracking = executionTrackingReport();

  const hasIssues =
    env.duplicates.length > 0 ||
    envExample.duplicates.length > 0 ||
    routes.collisions.length > 0 ||
    admin.missingGuards.length > 0 ||
    docs.missing.length > 0 ||
    !tracking.ok;

  const payload = {
    status: hasIssues ? 'FAIL' : 'PASS',
    report: {
      envDuplicates: env.duplicates,
      envExampleDuplicates: envExample.duplicates,
      routeShapeCollisions: routes.collisions,
      adminGuardMissing: admin.missingGuards,
      docsMissing: docs.missing,
      executionTracking: tracking,
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
