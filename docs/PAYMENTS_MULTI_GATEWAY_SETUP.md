# Payments Multi-Gateway Setup

Data de revisao: 2026-05-23

## Objetivo
Permitir que o usuario escolha gateway no checkout sem quebrar contrato de API.

## Gateways suportados (Fase 1)
- `sandbox`
- `gateway_sandbox`
- `gateway_real`
- `inter`
- `infinitepay`
- `mercadopago`
- `pagarme`
- `cielo`
- `stripe`

## Contrato interno mantido
- `POST /api/payments/checkout`
- `GET /api/payments/status/[paymentId]`
- `POST /api/payments/webhook`

Novo campo no checkout:
- `provider` (opcional)

## Variaveis por provider (padrao)
Cada provider pode usar:
- `PAYMENT_<PROVIDER>_BASE_URL`
- `PAYMENT_<PROVIDER>_API_KEY`
- `PAYMENT_<PROVIDER>_MERCHANT_ID`

Exemplos:
- `PAYMENT_INTER_BASE_URL`
- `PAYMENT_INFINITEPAY_API_KEY`
- `PAYMENT_MERCADOPAGO_MERCHANT_ID`

Fallback legado ainda aceito:
- `PAYMENT_GATEWAY_BASE_URL`
- `PAYMENT_GATEWAY_API_KEY`
- `PAYMENT_GATEWAY_MERCHANT_ID`

## Flags de habilitacao no checkout
- `PAYMENT_ENABLE_INTER=true`
- `PAYMENT_ENABLE_INFINITEPAY=true`
- `PAYMENT_ENABLE_MERCADOPAGO=true`
- `PAYMENT_ENABLE_PAGARME=true`
- `PAYMENT_ENABLE_CIELO=true`
- `PAYMENT_ENABLE_STRIPE=true`

Se a flag nao estiver `true`, o provider nao aparece como opcao para o usuario.

## Webhook multi-provider
Resolucao do provider em ordem:
1. Header `x-provider`
2. Campo `provider` no body
3. Prefixo de `providerReference` (`inter_`, `stripe_`, etc)
4. Fallback `PAYMENT_PROVIDER`

## Proximo passo (P3)
- Implementar adapter real individual por provider com autenticacao/assinatura nativa.
- Homologar 1 por vez com:
  - `npm run check`
  - `npm run qa:payments21`
  - smoke real `checkout -> status -> webhook -> duplicate`.

## Smoke dedicado Inter
- Comando: `npm run qa:inter:smoke`
- Valida:
  - order create
  - checkout com `provider=inter`
  - status query
  - webhook aprovado
  - webhook duplicado idempotente

Se faltar env obrigatoria (`PAYMENT_INTER_*`), o teste falha com `missing_env:*`.

## Smoke dedicado InfinitePay
- Comando: `npm run qa:infinitepay:smoke`
- Env minima:
  - `PAYMENT_ENABLE_INFINITEPAY=true`
  - `PAYMENT_INFINITEPAY_BASE_URL`
  - `PAYMENT_INFINITEPAY_API_KEY`

## Smoke dedicado Mercado Pago
- Comando: `npm run qa:mercadopago:smoke`
- Env minima:
  - `PAYMENT_ENABLE_MERCADOPAGO=true`
  - `PAYMENT_MERCADOPAGO_BASE_URL`
  - `PAYMENT_MERCADOPAGO_API_KEY`

## Smoke dedicado Pagar.me
- Comando: `npm run qa:pagarme:smoke`
- Env minima:
  - `PAYMENT_ENABLE_PAGARME=true`
  - `PAYMENT_PAGARME_BASE_URL`
  - `PAYMENT_PAGARME_API_KEY`

## Smoke dedicado Stripe
- Comando: `npm run qa:stripe:smoke`
- Env minima:
  - `PAYMENT_ENABLE_STRIPE=true`
  - `PAYMENT_STRIPE_BASE_URL`
  - `PAYMENT_STRIPE_API_KEY`

## Smoke dedicado Cielo
- Comando: `npm run qa:cielo:smoke`
- Env minima:
  - `PAYMENT_ENABLE_CIELO=true`
  - `PAYMENT_CIELO_BASE_URL`
  - `PAYMENT_CIELO_API_KEY`
  - `PAYMENT_CIELO_MERCHANT_ID`

## Prontidao unificada
- Comando: `npm run qa:providers:ready`
- Resultado: mostra por provider:
  - se esta habilitado
  - se esta pronto para smoke
  - quais envs ainda faltam
  - qual comando executar em seguida

## Sequencia minima para primeiro provider real
1. Configurar credenciais no painel `/admin/payments/connectors` e habilitar o provider.
2. Definir `PAYMENT_GATEWAY_TARGET=<provider>` no ambiente.
3. Rodar `npm run qa:provider:requirements` para ver faltas de env e campos do conector.
4. Rodar `npm run qa:provider:activate` (orquestra `check -> alert:critical -> providers:ready -> smoke -> payments21 -> exceptions`).
5. Registrar evidencias e risco residual em `docs/EXECUTION_TRACKING.md` e `docs/CHANGELOG_GOVERNANCE.md`.

Template pronto para Inter (homolog):
- `.env.hml.inter.example`

Templates prontos adicionais:
- `.env.hml.mercadopago.example`
- `.env.hml.stripe.example`
