#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = join(process.cwd(), 'reports', 'backend-readiness');
mkdirSync(outDir, { recursive: true });

const checks = [
  { id: 'B01', name: 'Static quality', script: 'check:strict' },
  { id: 'B02', name: 'Core operations', script: 'qa:coreops' },
  { id: 'B03', name: 'Payment exceptions', script: 'qa:exceptions' },
  { id: 'B04', name: 'Campaign impact', script: 'qa:campaign:impact' },
  { id: 'B05', name: 'Finance impact', script: 'qa:finance:impact' },
  { id: 'B06', name: 'Payout ledger', script: 'qa:payout:ledger' },
  { id: 'B07', name: 'Matrix audit', script: 'qa:matrix:audit' },
  { id: 'B08', name: 'Cross-role impact', script: 'qa:crossrole:impact' },
  { id: 'B09', name: 'Blind spots', script: 'qa:blindspots' },
];

function spawnNpmRun(script) {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath) {
    return spawnSync(process.execPath, [npmExecPath, 'run', script], {
      cwd: process.cwd(),
      encoding: 'utf-8',
      env: process.env,
      timeout: 1000 * 60 * 12,
      maxBuffer: 1024 * 1024 * 20,
    });
  }
  return spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], {
    cwd: process.cwd(),
    encoding: 'utf-8',
    env: process.env,
    timeout: 1000 * 60 * 12,
    maxBuffer: 1024 * 1024 * 20,
  });
}

const results = [];
for (const check of checks) {
  const command = `npm run ${check.script}`;
  console.log(`[backend-gate] running ${check.id} - ${check.name}: ${command}`);
  const startedAt = new Date().toISOString();
  const run = spawnNpmRun(check.script);
  const endedAt = new Date().toISOString();
  const timedOut = Boolean(run.error && run.error.message && run.error.message.includes('timed out'));
  const effectiveCode = timedOut ? 124 : run.status ?? 1;
  results.push({
    ...check,
    cmd: command,
    startedAt,
    endedAt,
    ok: effectiveCode === 0,
    exitCode: effectiveCode,
    timedOut,
    stdout: run.stdout ?? '',
    stderr: run.stderr ?? '',
    error: run.error ? String(run.error.message) : '',
  });
  console.log(`[backend-gate] ${check.id} status=${effectiveCode}${timedOut ? ' (timeout)' : ''}`);
}

const ok = results.every((r) => r.ok);
const summary = {
  generatedAt: new Date().toISOString(),
  ok,
  passed: results.filter((r) => r.ok).length,
  failed: results.filter((r) => !r.ok).length,
  results: results.map(({ stdout, stderr, error, ...rest }) => rest),
};

const jsonPath = join(outDir, `backend-gate-${stamp}.json`);
writeFileSync(jsonPath, JSON.stringify({ ...summary, results }, null, 2), 'utf-8');

const mdLines = [
  '# Backend Readiness Gate',
  '',
  `- Generated at: ${summary.generatedAt}`,
  `- Overall: ${ok ? 'PASS' : 'FAIL'}`,
  `- Passed: ${summary.passed}`,
  `- Failed: ${summary.failed}`,
  '',
  '## Checks',
  '',
  ...results.flatMap((r) => [
    `### ${r.id} - ${r.name}`,
    `- Command: \`${r.cmd}\``,
    `- Status: ${r.ok ? 'PASS' : 'FAIL'} (exit=${r.exitCode})`,
    `- Timeout: ${r.timedOut ? 'yes' : 'no'}`,
    `- Started: ${r.startedAt}`,
    `- Ended: ${r.endedAt}`,
    ...(r.error ? [`- Error: ${r.error}`] : []),
    '',
  ]),
  '## Artifact',
  '',
  `- JSON report: \`${jsonPath}\``,
  '',
];

const mdPath = join(outDir, `backend-gate-${stamp}.md`);
writeFileSync(mdPath, mdLines.join('\n'), 'utf-8');

console.log(JSON.stringify({ ok, passed: summary.passed, failed: summary.failed, jsonPath, mdPath }, null, 2));
process.exit(ok ? 0 : 1);
