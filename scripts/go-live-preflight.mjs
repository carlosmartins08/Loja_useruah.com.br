#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const COMMANDS_BY_PROVIDER = {
  gateway_real: 'npm run qa:gateway-real:smoke',
  inter: 'npm run qa:inter:smoke',
  infinitepay: 'npm run qa:infinitepay:smoke',
  mercadopago: 'npm run qa:mercadopago:smoke',
  pagarme: 'npm run qa:pagarme:smoke',
  cielo: 'npm run qa:cielo:smoke',
  stripe: 'npm run qa:stripe:smoke',
};

function resolveProvider() {
  const mode = String(process.env.PAYMENT_PROVIDER ?? '').trim().toLowerCase();
  if (mode === 'gateway_real') {
    const target = String(process.env.PAYMENT_GATEWAY_TARGET ?? '').trim().toLowerCase();
    return target || 'gateway_real';
  }
  return mode;
}

function buildSequence() {
  const provider = resolveProvider();
  const providerSmoke = COMMANDS_BY_PROVIDER[provider] ?? '<<defina PAYMENT_PROVIDER/PAYMENT_GATEWAY_TARGET corretamente>>';
  return [
    'npm run alert:critical',
    'npm run p3:precheck',
    'npm run qa:providers:ready',
    providerSmoke,
    'npm run check:strict',
    'npm run qa:payments21',
    'npm run qa:exceptions',
    'npm run qa:coreops',
    'npm run qa:functional',
  ];
}

function run(cmd) {
  const isWin = process.platform === 'win32';
  const shell = isWin ? 'cmd.exe' : 'sh';
  const args = isWin ? ['/d', '/s', '/c', cmd] : ['-lc', cmd];
  return spawnSync(shell, args, { stdio: 'inherit', env: process.env });
}

function main() {
  const execute = process.argv.includes('--execute');
  const sequence = buildSequence();
  if (!execute) {
    console.log(
      JSON.stringify(
        {
          status: 'READY_TO_EXECUTE',
          mode: 'dry-run',
          message: 'Use `npm run go:preflight:run` para executar preflight completo.',
          provider: resolveProvider() || null,
          sequence,
        },
        null,
        2
      )
    );
    process.exit(0);
  }

  for (const cmd of sequence) {
    if (cmd.startsWith('<<')) {
      console.error(JSON.stringify({ status: 'FAIL', reason: 'invalid_provider', provider: resolveProvider() || null }, null, 2));
      process.exit(1);
    }
    console.log(`\n[RUN] ${cmd}`);
    const result = run(cmd);
    if (result.status !== 0) {
      console.error(JSON.stringify({ status: 'FAIL', failedCommand: cmd, code: result.status ?? 1 }, null, 2));
      process.exit(result.status ?? 1);
    }
  }

  console.log(JSON.stringify({ status: 'PASS', phase: 'GO_LIVE_PREFLIGHT', provider: resolveProvider() || null, executed: sequence }, null, 2));
}

main();
