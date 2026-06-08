#!/usr/bin/env node
import process from 'node:process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadDotEnvFile() {
  const file = join(process.cwd(), '.env');
  if (!existsSync(file)) return;
  const raw = readFileSync(file, 'utf8');
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    if (!key) continue;
    if (Object.prototype.hasOwnProperty.call(process.env, key) && process.env[key] !== undefined && String(process.env[key]).trim() !== '') {
      continue;
    }
    process.env[key] = trimmed.slice(idx + 1).trim();
  }
}

loadDotEnvFile();

const DIRECT_PROVIDERS = ['inter', 'infinitepay', 'mercadopago', 'pagarme', 'cielo', 'stripe'];

function hasValue(key) {
  const value = process.env[key];
  return Boolean(value && String(value).trim());
}

function req(keys) {
  return keys.filter((key) => !hasValue(key));
}

function providerRequirements(provider) {
  if (provider === 'gateway_real') {
    return ['PAYMENT_GATEWAY_BASE_URL', 'PAYMENT_GATEWAY_API_KEY', 'PAYMENT_GATEWAY_MERCHANT_ID'];
  }
  if (provider === 'stripe') {
    return ['PAYMENT_ENABLE_STRIPE', 'PAYMENT_STRIPE_BASE_URL', 'PAYMENT_STRIPE_API_KEY', 'PAYMENT_STRIPE_WEBHOOK_SECRET'];
  }
  const upper = provider.toUpperCase();
  if (provider === 'inter') {
    return [`PAYMENT_${upper}_BASE_URL`, `PAYMENT_${upper}_TOKEN_URL`, `PAYMENT_${upper}_CLIENT_ID`, `PAYMENT_${upper}_CLIENT_SECRET`];
  }
  if (provider === 'cielo') {
    return [`PAYMENT_${upper}_BASE_URL`, `PAYMENT_${upper}_API_KEY`, `PAYMENT_${upper}_MERCHANT_ID`];
  }
  return [`PAYMENT_${upper}_BASE_URL`, `PAYMENT_${upper}_API_KEY`];
}

const missingGlobal = req(['HML_BASE_URL', 'PAYMENT_PROVIDER']);
if (missingGlobal.length > 0) {
  console.error(JSON.stringify({ status: 'FAIL', reason: 'missing_global_env', missing: missingGlobal }, null, 2));
  process.exit(1);
}

const providerMode = String(process.env.PAYMENT_PROVIDER ?? '').trim().toLowerCase();
if (providerMode !== 'gateway_real' && !DIRECT_PROVIDERS.includes(providerMode)) {
  console.error(
    JSON.stringify(
      { status: 'FAIL', reason: 'invalid_provider_mode', expected: ['gateway_real', ...DIRECT_PROVIDERS], got: process.env.PAYMENT_PROVIDER },
      null,
      2
    )
  );
  process.exit(1);
}

const rawTargetProvider = String(process.env.PAYMENT_GATEWAY_TARGET ?? '').trim().toLowerCase();
const targetProvider = providerMode === 'gateway_real' ? (DIRECT_PROVIDERS.includes(rawTargetProvider) ? rawTargetProvider : 'gateway_real') : providerMode;

const requiredWebhookSecret = targetProvider === 'stripe' ? 'PAYMENT_STRIPE_WEBHOOK_SECRET' : 'PAYMENT_WEBHOOK_SECRET';
const missingWebhookSecret = req([requiredWebhookSecret]);
if (missingWebhookSecret.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: 'FAIL',
        reason: 'missing_webhook_secret',
        targetProvider,
        missing: missingWebhookSecret,
      },
      null,
      2
    )
  );
  process.exit(1);
}

const providerMissing = req(providerRequirements(targetProvider));
if (providerMissing.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: 'FAIL',
        reason: 'missing_provider_env',
        targetProvider,
        missing: providerMissing,
      },
      null,
      2
    )
  );
  process.exit(1);
}

if (String(process.env.PAYMENT_PERSISTENCE ?? '').toLowerCase() !== 'mysql') {
  console.error(JSON.stringify({ status: 'FAIL', reason: 'invalid_persistence_mode', expected: 'mysql' }, null, 2));
  process.exit(1);
}

if (!String(process.env.DATABASE_URL ?? '').startsWith('mysql://')) {
  console.error(JSON.stringify({ status: 'FAIL', reason: 'invalid_database_url', expectedPrefix: 'mysql://' }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: 'READY',
      phase: 'P3',
      baseUrl: process.env.HML_BASE_URL,
      targetProvider,
      checklist: [
        'Executar npm run check',
        'Executar npm run qa:providers:ready',
        `Executar smoke dedicado: ${targetProvider === 'gateway_real' ? 'npm run qa:gateway-real:smoke' : `npm run qa:${targetProvider}:smoke`}`,
        'Executar npm run qa:payments21',
        'Executar npm run qa:exceptions',
        'Registrar 10 transacoes sequenciais sem divergencia por providerReference',
        'Em falha, rollback imediato para provider sandbox configurado no ambiente',
      ],
    },
    null,
    2
  )
);
