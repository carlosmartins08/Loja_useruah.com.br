#!/usr/bin/env node
import { execSync } from 'node:child_process';

function getChangedFiles() {
  const commands = ['git diff --name-only --cached', 'git diff --name-only HEAD'];
  for (const cmd of commands) {
    try {
      const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      if (out) {
        return out.split(/\r?\n/).filter(Boolean);
      }
    } catch {}
  }
  return [];
}

const criticalMatchers = [
  /^app\/api\/payments\//,
  /^app\/api\/orders\//,
  /^app\/api\/production-jobs\//,
  /^app\/api\/shipments\//,
  /^lib\/payment-/,
  /^lib\/order-store\.ts$/,
  /^lib\/production-store\.ts$/,
  /^lib\/shipment-store\.ts$/,
];

const files = getChangedFiles();
const normalizedFiles = files.map((file) => file.replace(/\\/g, '/'));
const criticalTouched = normalizedFiles.some((file) => criticalMatchers.some((matcher) => matcher.test(file)));

if (!criticalTouched) {
  console.log(JSON.stringify({ status: 'PASS', reason: 'no_critical_changes' }, null, 2));
  process.exit(0);
}

const requiredFiles = ['docs/EXECUTION_TRACKING.md', 'docs/CHANGELOG_GOVERNANCE.md'];
const missingFiles = requiredFiles.filter((requiredFile) => !normalizedFiles.includes(requiredFile));

const requiredEnv = ['PR_CHANGE_TYPE', 'PR_RISK_LEVEL', 'PR_SOURCE_DOC'];
const missingEnv = requiredEnv.filter((key) => {
  const value = process.env[key];
  return !value || !String(value).trim();
});

if (missingFiles.length > 0 || missingEnv.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: 'FAIL',
        reason: 'critical_change_without_governance',
        criticalTouched,
        missingFiles,
        missingEnv,
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
      reason: 'critical_change_governance_ok',
      filesChecked: files.length,
    },
    null,
    2
  )
);
