#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const SEQUENCE = [
  'npm run alert:critical',
  'npm run p3:precheck',
  'npm run qa:providers:ready',
  'npm run check:strict',
  'npm run qa:payments21',
  'npm run qa:exceptions',
  'npm run qa:coreops',
  'npm run qa:functional',
];

function run(cmd) {
  const isWin = process.platform === 'win32';
  const shell = isWin ? 'cmd.exe' : 'sh';
  const args = isWin ? ['/d', '/s', '/c', cmd] : ['-lc', cmd];
  return spawnSync(shell, args, { stdio: 'inherit', env: process.env });
}

function main() {
  const execute = process.argv.includes('--execute');
  if (!execute) {
    console.log(
      JSON.stringify(
        {
          status: 'READY_TO_EXECUTE',
          mode: 'dry-run',
          message: 'Use `npm run go:preflight:run` para executar preflight completo.',
          sequence: SEQUENCE,
        },
        null,
        2
      )
    );
    process.exit(0);
  }

  for (const cmd of SEQUENCE) {
    console.log(`\n[RUN] ${cmd}`);
    const result = run(cmd);
    if (result.status !== 0) {
      console.error(JSON.stringify({ status: 'FAIL', failedCommand: cmd, code: result.status ?? 1 }, null, 2));
      process.exit(result.status ?? 1);
    }
  }

  console.log(JSON.stringify({ status: 'PASS', phase: 'GO_LIVE_PREFLIGHT', executed: SEQUENCE }, null, 2));
}

main();

