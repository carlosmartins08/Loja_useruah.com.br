#!/usr/bin/env node
import process from 'node:process';

const PROVIDERS = [
  {
    key: 'inter',
    label: 'Inter',
    smoke: 'npm run qa:inter:smoke',
    required: ['PAYMENT_ENABLE_INTER', 'PAYMENT_INTER_BASE_URL', 'PAYMENT_INTER_TOKEN_URL', 'PAYMENT_INTER_CLIENT_ID', 'PAYMENT_INTER_CLIENT_SECRET'],
  },
  {
    key: 'infinitepay',
    label: 'InfinitePay',
    smoke: 'npm run qa:infinitepay:smoke',
    required: ['PAYMENT_ENABLE_INFINITEPAY', 'PAYMENT_INFINITEPAY_BASE_URL', 'PAYMENT_INFINITEPAY_API_KEY'],
  },
  {
    key: 'mercadopago',
    label: 'Mercado Pago',
    smoke: 'npm run qa:mercadopago:smoke',
    required: ['PAYMENT_ENABLE_MERCADOPAGO', 'PAYMENT_MERCADOPAGO_BASE_URL', 'PAYMENT_MERCADOPAGO_API_KEY'],
  },
  {
    key: 'pagarme',
    label: 'Pagar.me',
    smoke: 'npm run qa:pagarme:smoke',
    required: ['PAYMENT_ENABLE_PAGARME', 'PAYMENT_PAGARME_BASE_URL', 'PAYMENT_PAGARME_API_KEY'],
  },
  {
    key: 'cielo',
    label: 'Cielo',
    smoke: 'npm run qa:cielo:smoke',
    required: ['PAYMENT_ENABLE_CIELO', 'PAYMENT_CIELO_BASE_URL', 'PAYMENT_CIELO_API_KEY', 'PAYMENT_CIELO_MERCHANT_ID'],
  },
  {
    key: 'stripe',
    label: 'Stripe',
    smoke: 'npm run qa:stripe:smoke',
    required: ['PAYMENT_ENABLE_STRIPE', 'PAYMENT_STRIPE_BASE_URL', 'PAYMENT_STRIPE_API_KEY'],
  },
];

function hasValue(key) {
  const value = process.env[key];
  return Boolean(value && String(value).trim());
}

function isEnabled(key) {
  return String(process.env[key] ?? '').trim().toLowerCase() === 'true';
}

const report = PROVIDERS.map((provider) => {
  const missing = provider.required.filter((envKey) => !hasValue(envKey));
  const enabled = isEnabled(provider.required[0]);
  return {
    provider: provider.label,
    key: provider.key,
    enabled,
    ready: enabled && missing.length === 0,
    missing,
    nextCommand: provider.smoke,
  };
});

const readyCount = report.filter((row) => row.ready).length;
const enabledCount = report.filter((row) => row.enabled).length;

console.log(
  JSON.stringify(
    {
      status: readyCount > 0 ? 'PARTIAL_READY' : 'NOT_READY',
      summary: {
        providers: report.length,
        enabled: enabledCount,
        ready: readyCount,
      },
      report,
    },
    null,
    2
  )
);

process.exit(0);
