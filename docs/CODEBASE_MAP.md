# Codebase Map (Fonte Unica de Localizacao Tecnica)

Data de revisao: 2026-05-23

## Objetivo
Evitar perda de contexto no codigo com um mapa unico de localizacao por dominio.

## Regra de uso
- Este arquivo e obrigatorio para navegar no codigo antes de mudancas estruturais.
- Todo PR que alterar fluxo, estado, contrato, RBAC ou persistencia deve atualizar este mapa.
- Nao duplicar explicacao de regra de negocio aqui; este documento aponta caminhos tecnicos.

## Mapa por dominio

### Pagamentos
- API:
  - `app/api/payments/checkout/route.ts`
  - `app/api/payments/status/[paymentId]/route.ts`
  - `app/api/payments/webhook/route.ts`
- Servicos:
  - `lib/payment-service.ts`
  - `lib/payment-provider.ts`
- Persistencia:
  - `lib/payment-store.ts`
  - `lib/webhook-event-store.ts`
  - `lib/provider-webhook-event-store.ts`
  - `lib/provider-recipient-store.ts`
  - `lib/integration-log-store.ts`
- QA/automacao:
  - `scripts/qa-payments-2-1.mjs`
  - `scripts/qa-exceptions.mjs`

### Pedidos e Logistica
- API:
  - `app/api/orders/route.ts`
  - `app/api/orders/[orderId]/status/route.ts`
  - `app/api/orders/[orderId]/cancel/route.ts`
  - `app/api/production-jobs/route.ts`
  - `app/api/production-jobs/[id]/start/route.ts`
  - `app/api/production-jobs/[id]/ship/route.ts`
  - `app/api/shipments/[orderId]/route.ts`
- Servicos:
  - `lib/payment-exception-service.ts`
- Persistencia:
  - `lib/order-store.ts`
  - `lib/production-store.ts`
  - `lib/shipment-store.ts`
- QA/automacao:
  - `scripts/qa-core-operations.mjs`

### Catalogo e Curadoria
- API:
  - `app/api/artworks/route.ts`
  - `app/api/artworks/[id]/approve/route.ts`
  - `app/api/artworks/[id]/reject/route.ts`
  - `app/api/catalog-items/route.ts`
  - `app/api/catalog-items/[id]/ready/route.ts`
  - `app/api/catalog-items/[id]/publish/route.ts`
  - `app/api/catalog-items/[id]/unpublish/route.ts`
  - `app/api/catalog-items/[id]/reopen/route.ts`
  - `app/api/catalog-items/bootstrap/route.ts`
- Frontend:
  - `app/shop/page.tsx`
  - `app/product/[id]/page.tsx`
  - `components/product/ProductPageView.tsx`
  - `components/product/product-data.ts`
- Persistencia:
  - `lib/artwork-store.ts`
  - `lib/catalog-item-store.ts`
- QA/automacao:
  - `scripts/qa-catalog-lifecycle.mjs`

### Suporte e Tickets
- API:
  - `app/api/tickets/route.ts`
  - `app/api/tickets/[id]/route.ts`
  - `app/api/tickets/[id]/reply/route.ts`
  - `app/api/support/orders/[orderId]/context/route.ts`
- Persistencia:
  - `lib/ticket-store.ts`
- QA/automacao:
  - `scripts/qa-core-operations.mjs`

### Financeiro (Comissoes e Saques)
- API:
  - `app/api/commissions/me/route.ts`
  - `app/api/payouts/route.ts`
  - `app/api/refunds/route.ts`
  - `app/api/refunds/[refundId]/approve/route.ts`
  - `app/api/refunds/[refundId]/reject/route.ts`
  - `app/api/chargebacks/webhook/route.ts`
- Persistencia:
  - `lib/commission-store.ts`
  - `lib/payout-store.ts`
  - `lib/payment-split-store.ts`
  - `lib/license-event-store.ts`
  - `lib/terms-acceptance-store.ts`

### RBAC, Auditoria e Utilitarios Criticos
- Seguranca/autorizacao:
  - `lib/rbac.ts`
  - `lib/auth*.ts`
- Auditoria:
  - `lib/audit-log*.ts`
- Persistencia de desenvolvimento:
  - `lib/dev-store.ts`

## Infra e banco
- Schema/init MySQL:
  - `infra/mysql/init/001_payments.sql`
- Runbook local:
  - `docs/LOCAL_DOCKER_DATABASE_RUNBOOK.md`

## Como manter atualizado (obrigatorio)
- Ao criar endpoint novo: adicionar em "API" do dominio.
- Ao mover regra de persistencia: atualizar secao "Persistencia".
- Ao trocar fluxo de QA: atualizar secao "QA/automacao".
- Ao remover arquivo: remover referencia neste mapa no mesmo PR.
