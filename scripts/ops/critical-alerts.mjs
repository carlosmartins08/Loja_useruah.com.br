import { providerConfigState } from '../lib/provider-config.mjs';

const PROVIDERS = ['gateway_real', 'inter', 'infinitepay', 'mercadopago', 'pagarme', 'cielo', 'stripe'];

function hasValue(key) {
  const value = process.env[key];
  return Boolean(value && String(value).trim());
}

function isProviderReady(provider) {
  const required =
    provider === 'gateway_real'
      ? [
          { env: 'PAYMENT_GATEWAY_BASE_URL', setting: 'baseUrl' },
          { env: 'PAYMENT_GATEWAY_API_KEY', setting: 'apiKey' },
          { env: 'PAYMENT_GATEWAY_MERCHANT_ID', setting: 'merchantId' },
        ]
      : provider === 'inter'
      ? [
          { env: 'PAYMENT_INTER_BASE_URL', setting: 'baseUrl' },
          { env: 'PAYMENT_INTER_TOKEN_URL', setting: 'tokenUrl' },
          { env: 'PAYMENT_INTER_CLIENT_ID', setting: 'clientId' },
          { env: 'PAYMENT_INTER_CLIENT_SECRET', setting: 'clientSecret' },
        ]
      : provider === 'cielo'
        ? [
            { env: 'PAYMENT_CIELO_BASE_URL', setting: 'baseUrl' },
            { env: 'PAYMENT_CIELO_API_KEY', setting: 'apiKey' },
            { env: 'PAYMENT_CIELO_MERCHANT_ID', setting: 'merchantId' },
          ]
        : [
            { env: `PAYMENT_${provider.toUpperCase()}_BASE_URL`, setting: 'baseUrl' },
            { env: `PAYMENT_${provider.toUpperCase()}_API_KEY`, setting: 'apiKey' },
          ];
  return providerConfigState(provider, required).configured;
}

const readyProviders = PROVIDERS.filter(isProviderReady);
const mysqlConfigured = String(process.env.PAYMENT_PERSISTENCE ?? '').toLowerCase() === 'mysql';
const mysqlUrlValid = String(process.env.DATABASE_URL ?? '').startsWith('mysql://');

const alerts = [];
if (readyProviders.length === 0) {
  alerts.push({
    id: 'CRIT-PAY-REAL-001',
    title: 'Gateway real ainda nao pronto para homologacao',
    why: 'Nenhum provider real com credenciais completas no ambiente atual.',
    unblock: [
      'Preencher variaveis obrigatorias do provider escolhido',
      'Rodar smoke dedicado do provider e depois qa:payments21',
    ],
  });
}

if (!mysqlConfigured || !mysqlUrlValid) {
  alerts.push({
    id: 'CRIT-PAY-REAL-002',
    title: 'Persistencia final de pagamentos nao configurada para MySQL',
    why: 'Sem PAYMENT_PERSISTENCE=mysql + DATABASE_URL mysql://, conciliacao em ambiente gerenciado fica fraca.',
    unblock: [
      'Definir PAYMENT_PERSISTENCE=mysql',
      'Definir DATABASE_URL com protocolo mysql://',
      'Executar validacao operacional e reconciliacao por providerReference',
    ],
  });
}

const status = alerts.length === 0 ? 'PASS' : 'FAIL';
const payload = {
  status,
  checkedAt: new Date().toISOString(),
  summary: {
    readyProviders,
    mysqlConfigured,
    mysqlUrlValid,
  },
  alerts,
  reference: 'docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md',
};

if (status === 'PASS') {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

console.error(JSON.stringify(payload, null, 2));
process.exit(1);
