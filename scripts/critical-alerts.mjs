const PROVIDERS = ['inter', 'infinitepay', 'mercadopago', 'pagarme', 'cielo', 'stripe'];

function hasValue(key) {
  const value = process.env[key];
  return Boolean(value && String(value).trim());
}

function isTrue(key) {
  return String(process.env[key] ?? '').trim().toLowerCase() === 'true';
}

function providerVars(provider) {
  const upper = provider.toUpperCase();
  if (provider === 'inter') {
    return [`PAYMENT_ENABLE_${upper}`, `PAYMENT_${upper}_BASE_URL`, `PAYMENT_${upper}_TOKEN_URL`, `PAYMENT_${upper}_CLIENT_ID`, `PAYMENT_${upper}_CLIENT_SECRET`];
  }
  if (provider === 'cielo') {
    return [`PAYMENT_ENABLE_${upper}`, `PAYMENT_${upper}_BASE_URL`, `PAYMENT_${upper}_API_KEY`, `PAYMENT_${upper}_MERCHANT_ID`];
  }
  return [`PAYMENT_ENABLE_${upper}`, `PAYMENT_${upper}_BASE_URL`, `PAYMENT_${upper}_API_KEY`];
}

function isProviderReady(provider) {
  const vars = providerVars(provider);
  if (!isTrue(vars[0])) return false;
  return vars.every(hasValue);
}

const readyProviders = PROVIDERS.filter(isProviderReady);
const mysqlConfigured = String(process.env.PAYMENT_PERSISTENCE ?? '').toLowerCase() === 'mysql';
const mysqlUrlValid = String(process.env.DATABASE_URL ?? '').startsWith('mysql://');

const alerts = [];
if (readyProviders.length === 0) {
  alerts.push({
    id: 'CRIT-PAY-REAL-001',
    title: 'Gateway real ainda nao pronto para homologacao',
    why: 'Nenhum provider real habilitado com credenciais completas no ambiente atual.',
    unblock: [
      'Habilitar pelo menos 1 provider real com PAYMENT_ENABLE_<PROVIDER>=true',
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
