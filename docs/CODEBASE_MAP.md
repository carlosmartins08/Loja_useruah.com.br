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
- Frontend:
  - `app/account/orders/page.tsx`
  - `app/account/orders/[id]/page.tsx`
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
  - `app/api/admin/impact-reviews/route.ts`
  - `app/api/admin/impact-reviews/[id]/approve/route.ts`
  - `app/api/admin/impact-reviews/[id]/reject/route.ts`
  - `app/api/admin/impact-reviews/notifications/route.ts`
- Frontend:
  - `app/shop/page.tsx`
  - `app/product/[id]/page.tsx`
  - `app/admin/catalog/page.tsx`
  - `app/admin/impact-reviews/page.tsx`
  - `components/product/ProductPageView.tsx`
  - `components/product/product-data.ts`
- Persistencia:
  - `lib/artwork-store.ts`
  - `lib/catalog-item-store.ts`
  - `lib/impact-review-store.ts`
  - `lib/impact-notification-service.ts`
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
- Frontend:
  - `app/admin/support/page.tsx`
  - `app/admin/support/[orderId]/page.tsx`
- QA/automacao:
  - `scripts/qa-core-operations.mjs`

### Alertas Operacionais
- API:
  - `app/api/admin/ops-alerts/route.ts`
  - `app/api/admin/ops-alerts/[id]/route.ts`
- Frontend:
  - `app/admin/ops-alerts/page.tsx`
- Persistencia:
  - `lib/integration-log-store.ts`
  - `lib/ops-alert-state-store.ts`
  - `lib/ops-alert-sla.ts`
  - `lib/ops-alert-overdue-alerts.ts`

### Financeiro (Comissoes e Saques)
- API:
  - `app/api/admin/payouts/route.ts`
  - `app/api/admin/payouts/batch-settlement/route.ts`
  - `app/api/admin/payouts/batch-settlement/history/route.ts`
  - `app/api/admin/payouts/batch-settlement/history/export/route.ts`
  - `app/api/admin/payouts/batch-settlement/metrics/route.ts`
  - `app/api/commissions/me/route.ts`
  - `app/api/payouts/route.ts`
  - `app/api/payouts/[id]/start-review/route.ts`
  - `app/api/payouts/[id]/approve/route.ts`
  - `app/api/payouts/[id]/reject/route.ts`
  - `app/api/payouts/[id]/reconciliation/route.ts`
  - `app/api/payouts/[id]/mark-paid/route.ts`
  - `app/api/refunds/route.ts`
  - `app/api/refunds/[refundId]/approve/route.ts`
  - `app/api/refunds/[refundId]/reject/route.ts`
  - `app/api/chargebacks/webhook/route.ts`
- Persistencia:
  - `lib/commission-store.ts`
  - `lib/payout-store.ts`
  - `lib/payout-reconciliation.ts`
  - `lib/payout-reconciliation-codes.ts`
  - `lib/payout-reconciliation-playbook.ts`
  - `lib/payout-failure-thresholds.ts`
  - `lib/payout-risk-alerts.ts`
  - `lib/payout-settlement-service.ts`
  - `lib/payment-split-store.ts`
  - `lib/license-event-store.ts`
  - `lib/terms-acceptance-store.ts`
  - `lib/impact-review-store.ts`
  - `lib/impact-notification-service.ts`
- Frontend:
  - `app/admin/finance/payouts/page.tsx`

### Comunidade e Campanhas
- API:
  - `app/api/campaigns/route.ts`
  - `app/api/campaigns/[id]/submit/route.ts`
  - `app/api/campaigns/[id]/approve/route.ts`
  - `app/api/campaigns/[id]/reject/route.ts`
  - `app/api/campaigns/[id]/pause/route.ts`
  - `app/api/campaigns/[id]/close/route.ts`
  - `app/api/campaigns/[id]/cancel/route.ts`
- Persistencia:
  - `lib/campaign-store.ts`
  - `lib/impact-review-store.ts`
  - `lib/impact-notification-service.ts`
- QA/automacao:
  - `scripts/qa-campaign-impact.mjs`
  - `scripts/qa-finance-impact.mjs`
  - `scripts/qa-payout-ledger-paid.mjs`

### RBAC, Auditoria e Utilitarios Criticos
- Seguranca/autorizacao:
  - `app/api/auth/session/active-role/route.ts`
  - `lib/rbac.ts`
  - `lib/auth*.ts`
  - `lib/role-matrix/permission-matrix.ts`
  - `lib/role-matrix/registration-matrix.ts`
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
