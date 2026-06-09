#!/usr/bin/env node
import process from 'node:process';
import { providerConfigState } from '../lib/provider-config.mjs';

const PROVIDERS = {
  gateway_real: {
    label: 'Gateway real (generico)',
    required: [
      { env: 'PAYMENT_GATEWAY_BASE_URL', setting: 'baseUrl' },
      { env: 'PAYMENT_GATEWAY_API_KEY', setting: 'apiKey' },
      { env: 'PAYMENT_GATEWAY_MERCHANT_ID', setting: 'merchantId' },
    ],
    connectorSettings: ['baseUrl', 'apiKey', 'merchantId', 'chargePath'],
    smoke: 'npm run qa:gateway-real:smoke',
  },
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
      { env: 'PAYMENT_ENABLE_STRIPE', setting: 'enabled' },
      { env: 'PAYMENT_STRIPE_BASE_URL', setting: 'baseUrl' },
      { env: 'PAYMENT_STRIPE_API_KEY', setting: 'apiKey' },
      { env: 'PAYMENT_STRIPE_WEBHOOK_SECRET', setting: 'webhookSecret' },
    ],
    connectorSettings: ['enabled', 'baseUrl', 'apiKey', 'webhookSecret'],
    smoke: 'npm run qa:stripe:smoke',
  },
};

const DIRECT_PROVIDERS = ['inter', 'infinitepay', 'mercadopago', 'pagarme', 'cielo', 'stripe'];
const providerMode = String(process.env.PAYMENT_PROVIDER ?? '').trim().toLowerCase();
const rawTargetProvider = String(process.env.PAYMENT_GATEWAY_TARGET ?? '').trim().toLowerCase();
const provider =
  providerMode === 'gateway_real'
    ? DIRECT_PROVIDERS.includes(rawTargetProvider)
      ? rawTargetProvider
      : 'gateway_real'
    : DIRECT_PROVIDERS.includes(providerMode)
      ? providerMode
      : rawTargetProvider;

const selected = PROVIDERS[provider];

if (!selected) {
  console.error(
    JSON.stringify(
      {
        status: 'FAIL',
        reason: 'invalid_provider_selection',
        expected: Object.keys(PROVIDERS),
        paymentProvider: providerMode || null,
        paymentGatewayTarget: rawTargetProvider || null,
        resolvedProvider: provider || null,
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
      paymentProvider: providerMode || null,
      paymentGatewayTarget: rawTargetProvider || null,
      missingEnv,
      connectorSettings: selected.connectorSettings,
      nextCommands: ['npm run qa:providers:ready', selected.smoke, 'npm run qa:provider:activate'],
    },
    null,
    2
  )
);
