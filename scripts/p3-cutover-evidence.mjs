#!/usr/bin/env node
import process from 'node:process';

const PROVIDERS = ['inter', 'infinitepay', 'mercadopago', 'pagarme', 'cielo', 'stripe'];

function hasValue(key) {
  const value = process.env[key];
  return Boolean(value && String(value).trim());
}

function req(keys) {
  return keys.filter((key) => !hasValue(key));
}

function providerRequirements(provider) {
  const upper = provider.toUpperCase();
  if (provider === 'inter') {
    return [`PAYMENT_ENABLE_${upper}`, `PAYMENT_${upper}_BASE_URL`, `PAYMENT_${upper}_TOKEN_URL`, `PAYMENT_${upper}_CLIENT_ID`, `PAYMENT_${upper}_CLIENT_SECRET`];
  }
  if (provider === 'cielo') {
    return [`PAYMENT_ENABLE_${upper}`, `PAYMENT_${upper}_BASE_URL`, `PAYMENT_${upper}_API_KEY`, `PAYMENT_${upper}_MERCHANT_ID`];
  }
  return [`PAYMENT_ENABLE_${upper}`, `PAYMENT_${upper}_BASE_URL`, `PAYMENT_${upper}_API_KEY`];
}

const missingGlobal = req(['HML_BASE_URL', 'PAYMENT_PROVIDER', 'PAYMENT_WEBHOOK_SECRET']);
if (missingGlobal.length > 0) {
  console.error(JSON.stringify({ status: 'FAIL', reason: 'missing_global_env', missing: missingGlobal }, null, 2));
  process.exit(1);
}

if (process.env.PAYMENT_PROVIDER !== 'gateway_real') {
  console.error(
    JSON.stringify(
      { status: 'FAIL', reason: 'invalid_provider_mode', expected: 'gateway_real', got: process.env.PAYMENT_PROVIDER },
      null,
      2
    )
  );
  process.exit(1);
}

const targetProvider = String(process.env.PAYMENT_GATEWAY_TARGET ?? '').trim().toLowerCase();
if (!PROVIDERS.includes(targetProvider)) {
  console.error(
    JSON.stringify(
      {
        status: 'FAIL',
        reason: 'invalid_or_missing_target_provider',
        expected: PROVIDERS,
        got: targetProvider || null,
        hint: 'Defina PAYMENT_GATEWAY_TARGET com o provider real deste cutover.',
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
        `Executar smoke dedicado: npm run qa:${targetProvider}:smoke`,
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
