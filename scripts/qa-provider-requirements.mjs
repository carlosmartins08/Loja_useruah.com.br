#!/usr/bin/env node
import process from 'node:process';
import { providerConfigState } from './_provider-config.mjs';

const PROVIDERS = {
  inter: {
    label: 'Inter',
    required: [
      { env: 'PAYMENT_INTER_BASE_URL', setting: 'baseUrl' },
      { env: 'PAYMENT_INTER_TOKEN_URL', setting: 'tokenUrl' },
      { env: 'PAYMENT_INTER_CLIENT_ID', setting: 'clientId' },
      { env: 'PAYMENT_INTER_CLIENT_SECRET', setting: 'clientSecret' },
    ],
    connectorSettings: ['tokenUrl', 'clientId', 'clientSecret'],
    smoke: 'npm run qa:inter:smoke',
  },
  infinitepay: {
    label: 'InfinitePay',
    required: [
      { env: 'PAYMENT_INFINITEPAY_BASE_URL', setting: 'baseUrl' },
      { env: 'PAYMENT_INFINITEPAY_API_KEY', setting: 'apiKey' },
    ],
    connectorSettings: ['baseUrl', 'apiKey'],
    smoke: 'npm run qa:infinitepay:smoke',
  },
  mercadopago: {
    label: 'Mercado Pago',
    required: [
      { env: 'PAYMENT_MERCADOPAGO_BASE_URL', setting: 'baseUrl' },
      { env: 'PAYMENT_MERCADOPAGO_API_KEY', setting: 'apiKey' },
    ],
    connectorSettings: ['baseUrl', 'apiKey'],
    smoke: 'npm run qa:mercadopago:smoke',
  },
  pagarme: {
    label: 'Pagar.me',
    required: [
      { env: 'PAYMENT_PAGARME_BASE_URL', setting: 'baseUrl' },
      { env: 'PAYMENT_PAGARME_API_KEY', setting: 'apiKey' },
    ],
    connectorSettings: ['baseUrl', 'apiKey'],
    smoke: 'npm run qa:pagarme:smoke',
  },
  cielo: {
    label: 'Cielo',
    required: [
      { env: 'PAYMENT_CIELO_BASE_URL', setting: 'baseUrl' },
      { env: 'PAYMENT_CIELO_API_KEY', setting: 'apiKey' },
      { env: 'PAYMENT_CIELO_MERCHANT_ID', setting: 'merchantId' },
    ],
    connectorSettings: ['baseUrl', 'apiKey', 'merchantId'],
    smoke: 'npm run qa:cielo:smoke',
  },
  stripe: {
    label: 'Stripe',
    required: [
      { env: 'PAYMENT_STRIPE_BASE_URL', setting: 'baseUrl' },
      { env: 'PAYMENT_STRIPE_API_KEY', setting: 'apiKey' },
    ],
    connectorSettings: ['baseUrl', 'apiKey'],
    smoke: 'npm run qa:stripe:smoke',
  },
};

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

const config = providerConfigState(provider, selected.required);
const missingEnv = config.missing;
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
