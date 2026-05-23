#!/usr/bin/env node
import process from 'node:process';

const PROVIDERS = {
  inter: {
    label: 'Inter',
    env: ['PAYMENT_ENABLE_INTER', 'PAYMENT_INTER_BASE_URL', 'PAYMENT_INTER_TOKEN_URL', 'PAYMENT_INTER_CLIENT_ID', 'PAYMENT_INTER_CLIENT_SECRET'],
    connectorSettings: ['tokenUrl', 'clientId', 'clientSecret'],
    smoke: 'npm run qa:inter:smoke',
  },
  infinitepay: {
    label: 'InfinitePay',
    env: ['PAYMENT_ENABLE_INFINITEPAY', 'PAYMENT_INFINITEPAY_BASE_URL', 'PAYMENT_INFINITEPAY_API_KEY'],
    connectorSettings: ['baseUrl', 'apiKey'],
    smoke: 'npm run qa:infinitepay:smoke',
  },
  mercadopago: {
    label: 'Mercado Pago',
    env: ['PAYMENT_ENABLE_MERCADOPAGO', 'PAYMENT_MERCADOPAGO_BASE_URL', 'PAYMENT_MERCADOPAGO_API_KEY'],
    connectorSettings: ['baseUrl', 'apiKey'],
    smoke: 'npm run qa:mercadopago:smoke',
  },
  pagarme: {
    label: 'Pagar.me',
    env: ['PAYMENT_ENABLE_PAGARME', 'PAYMENT_PAGARME_BASE_URL', 'PAYMENT_PAGARME_API_KEY'],
    connectorSettings: ['baseUrl', 'apiKey'],
    smoke: 'npm run qa:pagarme:smoke',
  },
  cielo: {
    label: 'Cielo',
    env: ['PAYMENT_ENABLE_CIELO', 'PAYMENT_CIELO_BASE_URL', 'PAYMENT_CIELO_API_KEY', 'PAYMENT_CIELO_MERCHANT_ID'],
    connectorSettings: ['baseUrl', 'apiKey', 'merchantId'],
    smoke: 'npm run qa:cielo:smoke',
  },
  stripe: {
    label: 'Stripe',
    env: ['PAYMENT_ENABLE_STRIPE', 'PAYMENT_STRIPE_BASE_URL', 'PAYMENT_STRIPE_API_KEY'],
    connectorSettings: ['baseUrl', 'apiKey'],
    smoke: 'npm run qa:stripe:smoke',
  },
};

function hasValue(key) {
  const value = process.env[key];
  return Boolean(value && String(value).trim());
}

const provider = String(process.env.PAYMENT_GATEWAY_TARGET ?? '').trim().toLowerCase();
const selected = PROVIDERS[provider];

if (!selected) {
  console.error(
    JSON.stringify(
      {
        status: 'FAIL',
        reason: 'invalid_or_missing_PAYMENT_GATEWAY_TARGET',
        expected: Object.keys(PROVIDERS),
        got: provider || null,
      },
      null,
      2
    )
  );
  process.exit(1);
}

const missingEnv = selected.env.filter((key) => !hasValue(key));
console.log(
  JSON.stringify(
    {
      status: missingEnv.length === 0 ? 'READY_FOR_SMOKE' : 'MISSING_ENV',
      provider,
      label: selected.label,
      missingEnv,
      connectorSettings: selected.connectorSettings,
      nextCommands: ['npm run qa:providers:ready', selected.smoke, 'npm run qa:provider:activate'],
    },
    null,
    2
  )
);
