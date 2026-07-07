#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { ensureQaEnvLoaded } from '../lib/qa-env.mjs';
import { ensureAgentPlanFile, formatAgentBrief } from '../lib/agent-context.mjs';

ensureQaEnvLoaded();
console.log(formatAgentBrief(ensureAgentPlanFile().plan));

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

function isLocalBaseUrl(value) {
  try {
    const url = new URL(String(value).trim());
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function buildSequence() {
  const provider = resolveProvider();
  const providerSmoke = COMMANDS_BY_PROVIDER[provider] ?? '<<defina PAYMENT_PROVIDER/PAYMENT_GATEWAY_TARGET corretamente>>';
  return [
    'npm run check:strict',
    'npm run alert:critical',
    'npm run p3:precheck',
    'npm run qa:providers:ready',
    providerSmoke,
    'npm run qa:blindspots',
    'npm run qa:catalog',
    'npm run qa:payments21',
    'npm run qa:exceptions',
    'npm run qa:coreops',
    'npm run qa:payout:ledger',
    'npm run qa:functional',
    'npm run qa:matrix:audit',
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
    const blockedByLocalBaseUrl = isLocalBaseUrl(process.env.HML_BASE_URL);
    console.log(
      JSON.stringify(
        {
          status: blockedByLocalBaseUrl ? 'BLOCKED_EXTERNAL_BASE_URL' : 'READY_TO_EXECUTE',
          mode: 'dry-run',
          message: blockedByLocalBaseUrl
            ? 'HML_BASE_URL ainda aponta para localhost; a prova completa de go-live continua bloqueada ate existir homolog final real.'
            : 'Use `npm run go:e2e:proof:run` para executar a prova completa de go-live.',
          provider: resolveProvider() || null,
          baseUrl: process.env.HML_BASE_URL ?? null,
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

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        phase: 'GO_LIVE_E2E_PROOF',
        provider: resolveProvider() || null,
        executed: sequence,
      },
      null,
      2
    )
  );
}

main();
