#!/usr/bin/env node
import { execSync } from 'node:child_process';

function getChangedFiles() {
  const commands = ['git diff --name-only --cached', 'git diff --name-only HEAD'];
  for (const cmd of commands) {
    try {
      const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      if (out) return out.split(/\r?\n/).filter(Boolean).map((v) => v.replace(/\\/g, '/'));
    } catch {}
  }
  return [];
}

const domains = [
  {
    name: 'auth_rbac',
    patterns: [/^app\/api\/auth\//, /^context\/UserContext\.tsx$/, /^lib\/access-control\.ts$/, /^lib\/session-token\.ts$/],
    requiredChecks: ['check', 'pr:gate'],
  },
  {
    name: 'payments',
    patterns: [/^app\/api\/payments\//, /^app\/api\/refunds\//, /^app\/api\/chargebacks\//, /^lib\/payment-/, /^infra\/mysql\/init\/001_payments\.sql$/],
    requiredChecks: ['check', 'qa:payments21', 'qa:exceptions', 'pr:gate'],
  },
  {
    name: 'orders_ops',
    patterns: [/^app\/api\/orders\//, /^app\/api\/production-jobs\//, /^app\/api\/shipments\//, /^lib\/order-store\.ts$/, /^lib\/production-store\.ts$/, /^lib\/shipment-store\.ts$/],
    requiredChecks: ['check', 'qa:coreops', 'pr:gate'],
  },
  {
    name: 'frontend_core',
    patterns: [/^app\/(account|admin|checkout|help-center|policies)\//, /^components\/navigation\//],
    requiredChecks: ['check', 'pr:gate'],
  },
];

const changedFiles = getChangedFiles();
if (changedFiles.length === 0) {
  console.log(JSON.stringify({ status: 'PASS', reason: 'no_changes_detected' }, null, 2));
  process.exit(0);
}

const impactedDomains = domains
  .filter((domain) => changedFiles.some((file) => domain.patterns.some((pattern) => pattern.test(file))))
  .map((domain) => domain.name);

const requiredChecks = [...new Set(domains.filter((d) => impactedDomains.includes(d.name)).flatMap((d) => d.requiredChecks))];

if (requiredChecks.length === 0) {
  console.log(JSON.stringify({ status: 'PASS', reason: 'no_critical_domain_impacted', changedFiles }, null, 2));
  process.exit(0);
}

const executedChecks = (process.env.EXECUTED_CHECKS || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);
const missingChecks = requiredChecks.filter((check) => !executedChecks.includes(check));

if (missingChecks.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: 'FAIL',
        reason: 'missing_required_checks',
        impactedDomains,
        requiredChecks,
        executedChecks,
        missingChecks,
        hint: "Set EXECUTED_CHECKS, e.g. 'check,qa:coreops,pr:gate'",
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: 'PASS',
      reason: 'impact_checks_satisfied',
      impactedDomains,
      requiredChecks,
      executedChecks,
    },
    null,
    2
  )
);
