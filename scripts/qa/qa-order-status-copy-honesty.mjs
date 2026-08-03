import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const sourcePaths = {
  checkoutView: 'components/checkout/CheckoutPageView.tsx',
  checkoutSuccess: 'components/checkout/sections/CheckoutSuccessCard.tsx',
  genericSuccess: 'app/success/page.tsx',
  orderList: 'app/account/orders/page.tsx',
};

const forbiddenRouteTokens = [
  '/api/payments/webhook',
  '/api/production-jobs',
  '/api/shipments',
  '/api/affiliate',
  '/api/referral',
  'attribution',
  'commission',
  'payout',
  'dimona',
  'provider/real',
  'gateway-real',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readSource(relativePath) {
  return readFile(join(root, relativePath), 'utf8');
}

async function run() {
  const sources = Object.fromEntries(
    await Promise.all(Object.entries(sourcePaths).map(async ([key, path]) => [key, await readSource(path)]))
  );
  const report = [];

  assert(!sources.checkoutSuccess.includes('Arte Confirmada'), 'ORD-STATUS-CHECKOUT_ART_APPROVAL_COPY_FORBIDDEN');
  assert(!sources.checkoutSuccess.includes('entrou em producao'), 'ORD-STATUS-CHECKOUT_PRODUCTION_STARTED_COPY_FORBIDDEN');
  assert(sources.checkoutSuccess.includes("paymentStatus === 'approved'"), 'ORD-STATUS-CHECKOUT_MUST_DISTINGUISH_APPROVED');
  assert(
    sources.checkoutSuccess.includes("paymentStatus === 'created' || paymentStatus === 'processing'"),
    'ORD-STATUS-CHECKOUT_MUST_IDENTIFY_PROCESSING_STATE'
  );
  assert(
    sources.checkoutSuccess.includes('o pagamento esta em processamento'),
    'ORD-STATUS-CHECKOUT_PROCESSING_COPY_REQUIRED'
  );
  assert(
    sources.checkoutView.includes('paymentStatus={paymentSummary?.status}'),
    'ORD-STATUS-CHECKOUT_REAL_PAYMENT_STATUS_PROP_REQUIRED'
  );
  report.push('ORD-STATUS-01 CheckoutSuccessCard distinguishes processing from approved and does not claim production started');

  assert(!sources.genericSuccess.includes('Confirmado.'), 'ORD-STATUS-GENERIC_SUCCESS_CONFIRMATION_COPY_FORBIDDEN');
  assert(!sources.genericSuccess.includes('> processing'), 'ORD-STATUS-GENERIC_SUCCESS_HARDCODED_STATUS_FORBIDDEN');
  assert(
    sources.genericSuccess.includes('Consulte o estado atual na sua conta'),
    'ORD-STATUS-GENERIC_SUCCESS_CONSERVATIVE_STATUS_COPY_REQUIRED'
  );
  report.push('ORD-STATUS-02 /success is conservative and does not invent payment approval or processing status');

  assert(sources.orderList.includes('paymentStatus: string | null'), 'ORD-STATUS-ORDER_LIST_PAYMENT_STATUS_CONTRACT_REQUIRED');
  assert(
    sources.orderList.includes('humanizePaymentStatus(order.paymentStatus)'),
    'ORD-STATUS-ORDER_LIST_PAYMENT_STATUS_RENDER_REQUIRED'
  );
  assert(sources.orderList.includes("recebido: { label: 'Pedido criado'"), 'ORD-STATUS-ORDER_LIST_PLACED_COPY_REQUIRED');
  report.push('ORD-STATUS-03 account/orders renders paymentStatus separately from order, production and shipment state');

  for (const [sourceName, source] of Object.entries(sources)) {
    const normalized = source.toLowerCase();
    const forbiddenToken = forbiddenRouteTokens.find((token) => normalized.includes(token));
    assert(!forbiddenToken, `ORD-STATUS-FORBIDDEN_ROUTE_REFERENCE:${sourceName}:${forbiddenToken}`);
  }
  report.push('ORD-STATUS-04 changed visual surfaces do not reference webhook, production, shipping, referral, attribution, commission or payout routes');

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        classification: 'QA_ORDER_CHECKOUT_STATUS_COPY_HONESTY_PASS',
        evidenceType: 'static_source_guardrail',
        report,
        limitation: 'This guardrail inspects source contracts only; it does not prove browser rendering, runtime state transitions, webhook approval, production, shipping, or a real payment provider.',
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: 'FAIL',
        classification: 'ORDER_CHECKOUT_STATUS_COPY_HONESTY_REPAIR_REQUIRED',
        evidenceType: 'static_source_guardrail',
        error: String(error),
      },
      null,
      2
    )
  );
  process.exit(1);
});
