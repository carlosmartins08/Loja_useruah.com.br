# Codebase Map

Data de revisao: 2026-06-09

## Objetivo
Ser a fonte unica de localizacao tecnica do repositorio. Este arquivo nao explica estrategia de produto; ele mostra onde cada responsabilidade vive.

## Como usar
- primeiro identifique o dominio
- depois entre pelo endpoint, pagina ou store principal
- so depois siga para componentes auxiliares

## Camadas e fronteiras

### Rotas e paginas
- `app/**/page.tsx`
- `app/**/layout.tsx`
- `app/api/**/route.ts`

### UI e composicao
- `components/**`

### Dominio, auth, RBAC, persistencia e integracoes
- `lib/**`

### QA, gates e automacao
- `scripts/qa/**`
- `scripts/release/**`
- `scripts/ops/**`
- `scripts/gates/**`
- `scripts/catalog/**`
- `scripts/lib/**`
- `scripts/check-utf8.mjs`

### Configuracao e dados versionados
- `config/**`
- `data/**`

## Mapa por dominio

### Core de navegacao e shell da aplicacao
- App shell:
  - `app/layout.tsx`
  - `app/globals.css`
- Navegacao:
  - `components/navigation/Header.tsx`
  - `components/navigation/Footer.tsx`
  - `components/navigation/BottomNav.tsx`
  - `components/navigation/SearchOverlay.tsx`
- Routing por papel:
  - `components/routing/RoleNamespaceGuard.tsx`
  - `components/routing/RoleDashboardPage.tsx`
  - `lib/role-routing/access-routing.ts`
  - `lib/role-routing/role-dashboard-config.ts`
  - `lib/role-routing/role-namespaces.ts`
- Admin shell:
  - `app/admin/layout.tsx`
  - `components/admin/layout/AdminLayoutShell.tsx`
  - `components/admin/navigation-config.tsx`

### Admin hub
- Frontend:
  - `app/admin/page.tsx`
  - `components/admin/hub/AdminHubPage.tsx`

### Auth, sessao e RBAC
- API:
  - `app/api/auth/login/route.ts`
  - `app/api/auth/register/route.ts`
  - `app/api/auth/session/route.ts`
  - `app/api/auth/session/active-role/route.ts`
  - `app/api/auth/registration/me/route.ts`
  - `app/api/auth/elevations/**`
- Dominio:
  - `lib/auth-local-users.ts`
  - `lib/auth-session.ts`
  - `lib/session-token.ts`
  - `lib/access-control.ts`
  - `lib/role-scope.ts`
  - `lib/phase-one-role.ts`
  - `lib/privilege-elevation-service.ts`
  - `lib/privilege-elevation-store.ts`
- Matrizes:
  - `lib/role-matrix/permission-matrix.ts`
  - `lib/role-matrix/registration-matrix.ts`

### Admin API handlers
- `lib/admin-api/payment-connectors.ts`
- `lib/admin-api/ops-alerts.ts`
- `lib/admin-api/cockpit-summary.ts`
- `lib/admin-api/matrix-audit.ts`
- `lib/admin-api/impact-reviews.ts`
- `lib/admin-api/elevations.ts`
- `lib/admin-api/payouts.ts`
- `lib/admin-api/supplier-intelligence.ts`
- `lib/admin-api/supplier-integrations.ts`
- `lib/admin-api/registrations.ts`
- `lib/admin-api/registrations-export.ts`
- `lib/admin-api/registration-actions.ts`
- `lib/admin-api/payout-batch-settlement.ts`

### Catalogo e curadoria
- Frontend:
  - `app/shop/page.tsx`
  - `app/product/[id]/page.tsx`
  - `app/admin/catalog/page.tsx`
  - `components/admin/catalog/AdminCatalogPage.tsx`
  - `app/admin/impact-reviews/page.tsx`
  - `components/operations/impact/ImpactReviewsPage.tsx`
  - `components/shop/ShopPageView.tsx`
  - `components/product/ProductPageView.tsx`
- API:
  - `app/api/catalog-items/**`
  - `app/api/artworks/**`
  - `app/api/admin/impact-reviews/**`
  - `lib/admin-api/impact-reviews.ts`
- Dominio e persistencia:
  - `lib/catalog-item-store.ts`
  - `lib/artwork-store.ts`
  - `lib/product-artwork.ts`
  - `lib/product-stage.ts`
  - `lib/impact-review-store.ts`
  - `lib/impact-notification-service.ts`
  - `lib/brand-assets.ts`
  - `lib/brand-discovery.ts`
- QA:
  - `scripts/qa/qa-catalog-lifecycle.mjs`
  - `scripts/qa/qa-catalog-persisted.mjs`
  - `scripts/qa/qa-content-governance.mjs`

### Loja, carrinho e checkout
- Frontend:
  - `app/cart/page.tsx`
  - `app/checkout/page.tsx`
  - `app/success/page.tsx`
  - `components/commerce/CartDrawer.tsx`
  - `components/checkout/CheckoutPageView.tsx`
  - `context/CartContext.tsx`
- API:
  - `app/api/orders/route.ts`
  - `app/api/orders/[orderId]/cancel/route.ts`
- Dominio:
  - `lib/order-store.ts`
  - `lib/order-ui.ts`
  - `lib/shop-products.ts`
  - `lib/address-book.ts`

### Pagamentos
- API:
  - `app/api/payments/checkout/route.ts`
  - `app/api/payments/status/[paymentId]/route.ts`
  - `app/api/payments/providers/route.ts`
  - `app/api/payments/webhook/route.ts`
  - `app/api/chargebacks/webhook/route.ts`
- Dominio:
  - `lib/payments.ts`
  - `lib/payment-service.ts`
  - `lib/payment-provider.ts`
  - `lib/payment-gateway-registry.ts`
  - `lib/payment-provider-requirements.ts`
  - `lib/payment-exception-service.ts`
- Persistencia e rastreio:
  - `lib/payment-store.ts`
  - `lib/payment-split-store.ts`
  - `lib/webhook-event-store.ts`
  - `lib/provider-webhook-event-store.ts`
  - `lib/provider-recipient-store.ts`
  - `lib/payment-connector-store.ts`
  - `lib/integration-log-store.ts`
- QA:
  - `scripts/qa/qa-payments-2-1.mjs`
  - `scripts/qa/qa-payments-exceptions.mjs`
  - `scripts/qa/qa-stripe-smoke.mjs`
  - `scripts/qa/qa-gateway-real-smoke.mjs`
  - `scripts/release/p3-cutover-evidence.mjs`
- Admin frontend:
  - `app/admin/payments/connectors/page.tsx`
  - `components/admin/payments/AdminPaymentConnectorsPage.tsx`
- Admin API:
  - `app/api/admin/payment-connectors/route.ts`
  - `app/api/admin/payment-connectors/test/route.ts`
  - `lib/admin-api/payment-connectors.ts`

### Pedidos, producao e envio
- Frontend:
  - `app/account/orders/page.tsx`
  - `app/account/orders/[id]/page.tsx`
  - `app/admin/orders/page.tsx`
  - `components/admin/orders/AdminOrdersPage.tsx`
  - `app/production/jobs/page.tsx`
  - `app/admin/production/page.tsx`
  - `app/admin/shipments/page.tsx`
  - `components/operations/production/ProductionJobsPage.tsx`
- API:
  - `app/api/orders/[orderId]/status/route.ts`
  - `app/api/production-jobs/**`
  - `app/api/shipments/[orderId]/route.ts`
- Dominio:
  - `lib/order-operational-view.ts`
  - `lib/production-store.ts`
  - `lib/shipment-store.ts`
  - `lib/supplier-production-dispatch.ts`
  - `lib/supplier-dispatch-store.ts`
- QA:
  - `scripts/qa/qa-core-operations.mjs`
  - `scripts/qa/qa-cross-role-impact.mjs`

### Suporte e contexto 360
- Frontend:
  - `app/account/support/page.tsx`
  - `app/support/tickets/page.tsx`
  - `app/admin/support/page.tsx`
  - `app/admin/support/[orderId]/page.tsx`
  - `components/operations/support/SupportTicketsPage.tsx`
  - `components/operations/support/SupportOrderContextPage.tsx`
- API:
  - `app/api/tickets/route.ts`
  - `app/api/tickets/[id]/route.ts`
  - `app/api/tickets/[id]/reply/route.ts`
  - `app/api/support/orders/[orderId]/context/route.ts`
- Dominio:
  - `lib/ticket-store.ts`
- QA:
  - `scripts/qa/qa-core-operations.mjs`
  - `scripts/qa/qa-cross-role-impact.mjs`

### Comunidade, campanhas e impacto
- Frontend:
  - `app/community/campaigns/page.tsx`
  - `app/community/page.tsx`
- API:
  - `app/api/campaigns/**`
- Dominio:
  - `lib/campaign-store.ts`
- QA:
  - `scripts/qa/qa-campaign-impact.mjs`
  - `scripts/qa/qa-finance-impact.mjs`
  - `scripts/qa/qa-payout-ledger-paid.mjs`

### Financeiro, payout e reconciliacao
- Frontend:
  - `app/admin/finance/payouts/page.tsx`
  - `app/finance/payouts/page.tsx`
- API:
  - `app/api/admin/payouts/**`
  - `app/api/payouts/**`
  - `app/api/refunds/**`
  - `app/api/commissions/me/route.ts`
  - `app/api/admin/payouts/route.ts`
  - `lib/admin-api/payouts.ts`
  - `app/api/admin/payouts/batch-settlement/route.ts`
  - `app/api/admin/payouts/batch-settlement/history/route.ts`
  - `app/api/admin/payouts/batch-settlement/history/export/route.ts`
  - `app/api/admin/payouts/batch-settlement/metrics/route.ts`
  - `lib/admin-api/payout-batch-settlement.ts`
- Dominio:
  - `lib/commission-store.ts`
  - `lib/payout-store.ts`
  - `lib/payout-settlement-service.ts`
  - `lib/payout-reconciliation.ts`
  - `lib/payout-reconciliation-codes.ts`
  - `lib/payout-reconciliation-playbook.ts`
  - `lib/payout-failure-thresholds.ts`
  - `lib/payout-risk-alerts.ts`
  - `lib/refund-store.ts`
  - `lib/chargeback-store.ts`

### Operacao, alertas e auditoria
- Frontend:
  - `app/admin/ops-alerts/page.tsx`
  - `components/admin/ops/OpsAlertsPage.tsx`
  - `app/admin/impact-reviews/page.tsx`
  - `app/admin/registrations/page.tsx`
  - `components/admin/registrations/AdminRegistrationsPage.tsx`
  - `app/admin/eliv/page.tsx`
  - `components/admin/eliv/ElivDashboardPage.tsx`
- API:
  - `app/api/admin/ops-alerts/**`
  - `app/api/audit-logs/route.ts`
  - `app/api/admin/cockpit/summary/route.ts`
  - `lib/admin-api/cockpit-summary.ts`
  - `app/api/admin/matrix-audit/route.ts`
  - `lib/admin-api/matrix-audit.ts`
  - `app/api/admin/elevations/route.ts`
  - `lib/admin-api/elevations.ts`
  - `lib/admin-api/ops-alerts.ts`
  - `app/api/admin/impact-reviews/**`
  - `lib/admin-api/impact-reviews.ts`
  - `app/api/admin/registrations/route.ts`
  - `lib/admin-api/registrations.ts`
  - `app/api/admin/registrations/export/route.ts`
  - `lib/admin-api/registrations-export.ts`
  - `app/api/admin/registrations/[userId]/actions/route.ts`
  - `lib/admin-api/registration-actions.ts`
- Dominio:
  - `lib/ops-alert-state-store.ts`
  - `lib/ops-alert-sla.ts`
  - `lib/ops-alert-overdue-alerts.ts`
  - `lib/audit-log-store.ts`
  - `lib/decision-log-store.ts`
  - `lib/supplier-intelligence.ts`
  - `lib/admin-api/supplier-intelligence.ts`
  - `lib/admin-api/supplier-integrations.ts`

## Infra, assets e configuracoes
- banco e bootstrap:
  - `infra/mysql/init/001_payments.sql`
  - `docs/LOCAL_DOCKER_DATABASE_RUNBOOK.md`
- configs versionadas:
  - `config/ops-alert-sla.json`
  - `config/ops-impact-schedule.json`
  - `config/payout-failure-thresholds.json`
- assets:
  - `public/assets/editorial/catalog/**`
  - `public/brand/**`

## Scripts de entrada rapida
- mapa fisico:
  - `scripts/README.md`
  - `scripts/qa/**`
  - `scripts/release/**`
  - `scripts/ops/**`
  - `scripts/gates/**`
  - `scripts/catalog/**`
  - `scripts/lib/**`
- onboarding funcional:
  - `npm run qa:functional`
  - `npm run qa:coreops`
- pagamentos:
  - `npm run qa:payments21`
  - `npm run qa:stripe:smoke`
  - `npm run p3:precheck`
- campanhas:
  - `npm run qa:campaign:impact`
- gates:
  - `npm run check`
  - `npm run build`
  - `npm run go:e2e:proof`

## Regra de manutencao
- endpoint novo: atualizar a secao de API do dominio
- store novo: atualizar a secao de dominio/persistencia
- script novo de QA ou gate: atualizar a secao de QA
- arquivo removido ou movido: corrigir o mapa no mesmo patch
