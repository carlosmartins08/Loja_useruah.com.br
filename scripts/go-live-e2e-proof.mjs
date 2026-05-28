#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const SEQUENCE = [
  'npm run check:strict',
  'npm run alert:critical',
  'npm run p3:precheck',
  'npm run qa:blindspots',
  'npm run qa:catalog',
  'npm run qa:payments21',
  'npm run qa:exceptions',
  'npm run qa:coreops',
  'npm run qa:payout:ledger',
  'npm run qa:functional',
  'npm run qa:matrix:audit',
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
          message: 'Use `npm run go:e2e:proof:run` para executar a prova completa de go-live.',
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

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        phase: 'GO_LIVE_E2E_PROOF',
        executed: SEQUENCE,
      },
      null,
      2
    )
  );
}

main();

