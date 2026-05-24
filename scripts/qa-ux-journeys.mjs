import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  const raw = fs.readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function routeOverlaps(pattern, forbiddenPattern) {
  if (pattern === forbiddenPattern) return true;
  if (pattern === '/' || forbiddenPattern === '/') return false;
  const aPrefix = pattern.endsWith('/*') ? pattern.slice(0, -1) : pattern;
  const bPrefix = forbiddenPattern.endsWith('/*') ? forbiddenPattern.slice(0, -1) : forbiddenPattern;
  return aPrefix.startsWith(bPrefix) || bPrefix.startsWith(aPrefix);
}

function run() {
  const uxRules = readJson('data/ux-rules.json');
  const content = readJson('data/content-messages.json');

  const failures = [];
  const warnings = [];

  const exitIntent = uxRules.exitIntent ?? {};
  const critical = uxRules.journeyCritical ?? {};

  const messageIds = new Set((content.messages ?? []).map((m) => m.id));
  for (const requiredId of critical.requiredContentMessageIds ?? []) {
    if (!messageIds.has(requiredId)) {
      failures.push(`missing_content_message_id:${requiredId}`);
    }
  }

  const allowedRoutes = exitIntent.allowedRoutes ?? [];
  const forbiddenRoutes = critical.forbiddenExitIntentRoutes ?? [];
  for (const allowed of allowedRoutes) {
    for (const forbidden of forbiddenRoutes) {
      if (routeOverlaps(allowed, forbidden)) {
        failures.push(`exit_intent_route_overlap_forbidden:${allowed}:${forbidden}`);
      }
    }
  }

  if (critical.requireExitIntentAnonymousPolicy) {
    if (typeof exitIntent.allowAnonymous !== 'boolean') {
      failures.push('exit_intent_missing_allow_anonymous_policy');
    }
  }

  const requiredRoles = critical.requiredAllowedRolesForExitIntent ?? [];
  const allowedRoles = exitIntent.allowedUserRoles ?? [];
  for (const role of requiredRoles) {
    if (!allowedRoles.includes(role)) {
      failures.push(`exit_intent_missing_required_role:${role}`);
    }
  }

  if ((exitIntent.allowedUserRoles ?? []).some((role) => role !== 'customer')) {
    warnings.push('exit_intent_allows_non_customer_role');
  }

  if (failures.length > 0) {
    console.error(JSON.stringify({ status: 'FAIL', failures, warnings }, null, 2));
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        summary: {
          requiredContentMessageIds: (critical.requiredContentMessageIds ?? []).length,
          allowedExitIntentRoutes: allowedRoutes.length,
          forbiddenExitIntentRoutes: forbiddenRoutes.length,
        },
        warnings,
      },
      null,
      2
    )
  );
}

run();
