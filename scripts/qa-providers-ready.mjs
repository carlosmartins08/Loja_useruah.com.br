#!/usr/bin/env node
import { providerConfigState } from './_provider-config.mjs';

const PROVIDERS = [
  {
    key: 'gateway_real',
    label: 'Gateway real (generico)',
    smoke: 'npm run qa:gateway-real:smoke',
    required: [
      { env: 'PAYMENT_GATEWAY_BASE_URL', setting: 'baseUrl' },
      { env: 'PAYMENT_GATEWAY_API_KEY', setting: 'apiKey' },
      { env: 'PAYMENT_GATEWAY_MERCHANT_ID', setting: 'merchantId' },
    ],
  },
  {
    key: 'inter',
    label: 'Inter',
    smoke: 'npm run qa:inter:smoke',
    required: [
      { env: 'PAYMENT_INTER_BASE_URL', setting: 'baseUrl' },
      { env: 'PAYMENT_INTER_TOKEN_URL', setting: 'tokenUrl' },
      { env: 'PAYMENT_INTER_CLIENT_ID', setting: 'clientId' },
      { env: 'PAYMENT_INTER_CLIENT_SECRET', setting: 'clientSecret' },
    ],
  },
  {
    key: 'infinitepay',
    label: 'InfinitePay',
    smoke: 'npm run qa:infinitepay:smoke',
    required: [
      { env: 'PAYMENT_INFINITEPAY_BASE_URL', setting: 'baseUrl' },
      { env: 'PAYMENT_INFINITEPAY_API_KEY', setting: 'apiKey' },
    ],
  },
  {
    key: 'mercadopago',
    label: 'Mercado Pago',
    smoke: 'npm run qa:mercadopago:smoke',
    required: [
      { env: 'PAYMENT_MERCADOPAGO_BASE_URL', setting: 'baseUrl' },
      { env: 'PAYMENT_MERCADOPAGO_API_KEY', setting: 'apiKey' },
    ],
  },
  {
    key: 'pagarme',
    label: 'Pagar.me',
    smoke: 'npm run qa:pagarme:smoke',
    required: [
      { env: 'PAYMENT_PAGARME_BASE_URL', setting: 'baseUrl' },
      { env: 'PAYMENT_PAGARME_API_KEY', setting: 'apiKey' },
    ],
  },
  {
    key: 'cielo',
    label: 'Cielo',
    smoke: 'npm run qa:cielo:smoke',
    required: [
      { env: 'PAYMENT_CIELO_BASE_URL', setting: 'baseUrl' },
      { env: 'PAYMENT_CIELO_API_KEY', setting: 'apiKey' },
      { env: 'PAYMENT_CIELO_MERCHANT_ID', setting: 'merchantId' },
    ],
  },
  {
    key: 'stripe',
    label: 'Stripe',
    smoke: 'npm run qa:stripe:smoke',
    required: [
      { env: 'PAYMENT_STRIPE_BASE_URL', setting: 'baseUrl' },
      { env: 'PAYMENT_STRIPE_API_KEY', setting: 'apiKey' },
    ],
  },
];

const report = PROVIDERS.map((provider) => {
  const state = providerConfigState(provider.key, provider.required);
  const configured = state.configured;
  return {
    provider: provider.label,
    key: provider.key,
    configured,
    ready: configured,
    missing: state.missing,
    nextCommand: provider.smoke,
  };
});

const readyCount = report.filter((row) => row.ready).length;
const configuredCount = report.filter((row) => row.configured).length;

console.log(
  JSON.stringify(
    {
      status: readyCount > 0 ? 'PARTIAL_READY' : 'NOT_READY',
      summary: {
        providers: report.length,
        configured: configuredCount,
        ready: readyCount,
      },
      report,
    },
    null,
    2
  )
);

process.exit(0);
