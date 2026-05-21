# Execution Status Matrix (Existe / Parcial / Ausente)

Data de revisao: 2026-05-21

## Objetivo
Mostrar, de forma operacional, o que já existe no projeto, onde está implementado e o que ainda não existe por domínio.

## Legenda
- `EXISTE`: implementado e integrado no fluxo atual.
- `PARCIAL`: existe base/UX/sandbox, mas falta fechamento de produção.
- `AUSENTE`: não implementado no código atual.

## 1) Produto e Checkout (UI/UX)
- PDP com seções estratégicas: `EXISTE`
  - `components/product/ProductPageView.tsx`
- Prova social (tags + notas): `EXISTE`
  - `components/commerce/ProductSocialProof.tsx`
- Q&A público na PDP: `EXISTE`
  - `components/commerce/ProductQA.tsx`
- Zoom/mídia de detalhes: `PARCIAL` (estrutura pronta, acervo real pendente)
  - `components/commerce/ProductMediaGallery.tsx`
  - `components/product/product-data.ts`
- Provador virtual (altura/peso/caimento): `EXISTE`
  - `components/commerce/ProductSizeAdvisor.tsx`
- Checkout 1 clique (pix/carteira): `EXISTE` (fluxo sandbox)
  - `components/commerce/ProductInteractive.tsx`
  - `components/checkout/sections/CheckoutStepTwoSection.tsx`

## 2) Pagamentos
- Contrato de API checkout/status/webhook: `EXISTE`
  - `app/api/payments/checkout/route.ts`
  - `app/api/payments/status/[paymentId]/route.ts`
  - `app/api/payments/webhook/route.ts`
- Idempotência e assinatura de webhook: `EXISTE`
  - `lib/payment-service.ts`
  - `components/checkout/CheckoutPageView.tsx`
- Provider real (gateway externo): `PARCIAL` (adapter homologado `gateway_sandbox` implementado; integracao com provedor externo real pendente)
- Persistência em banco (pagamentos): `PARCIAL` (sqlite relacional local com fallback, banco gerenciado de producao pendente)
  - `lib/payment-store.ts`
  - `lib/dev-store.ts`
- Trilha de eventos de pagamento no status API: `EXISTE`
  - `lib/payment-store.ts`
  - `lib/payment-service.ts`
  - `app/api/payments/status/[paymentId]/route.ts`

## 3) Pedidos e Logística
- Fluxo UX checkout -> success: `EXISTE`
  - `components/checkout/CheckoutPageView.tsx`
- Modelo operacional de produção/envio (backend local): `PARCIAL` (APIs e estado existem com persistência local em arquivo)
  - `app/api/orders/route.ts`
  - `app/api/production-jobs/route.ts`
  - `app/api/production-jobs/[id]/start/route.ts`
  - `app/api/production-jobs/[id]/ship/route.ts`
  - `app/api/shipments/[orderId]/route.ts`
  - `lib/order-store.ts`
  - `lib/production-store.ts`
  - `lib/shipment-store.ts`
  - `lib/dev-store.ts`

## 4) Catálogo e Curadoria
- DoD completo definido: `EXISTE` (documentação)
  - `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`
- Estrutura de PDP e apresentação de item vendável: `PARCIAL` (leitura real de item publicado; acervo e curadoria ainda evoluindo)
  - `app/product/[id]/page.tsx`
  - `components/product/ProductPageView.tsx`
  - `components/product/product-data.ts`
- Implementação backend de submissão/revisão/publicação: `PARCIAL`
  - `app/api/artworks/route.ts`
  - `app/api/artworks/[id]/approve/route.ts`
  - `app/api/artworks/[id]/reject/route.ts`
  - `app/api/catalog-items/route.ts`
  - `app/api/catalog-items/[id]/publish/route.ts`
  - `app/api/catalog-items/[id]/unpublish/route.ts`
  - `app/api/catalog-items/bootstrap/route.ts`

### Sprint atual (WIP 1): Catálogo/Curadoria - 10 itens priorizados
1. Modelo canônico `Artwork` com estados `submitted|under_review|approved|rejected`: `PARCIAL`
  - `lib/artwork-store.ts`
2. Modelo canônico `CatalogItem` com estados `draft|ready|published|archived`: `PARCIAL`
  - `lib/catalog-item-store.ts`
3. API de submissão de arte com metadados mínimos e validação: `PARCIAL`
  - `app/api/artworks/route.ts` (`POST`)
4. Fila de curadoria com filtros por status/data/autor: `PARCIAL`
  - `app/api/artworks/route.ts` (`GET`)
5. Ação de aprovação de arte com `AuditLog`: `PARCIAL`
  - `app/api/artworks/[id]/approve/route.ts`
6. Ação de rejeição de arte com `reason` obrigatório e `AuditLog`: `PARCIAL`
  - `app/api/artworks/[id]/reject/route.ts`
7. Regra de bloqueio para impedir `CatalogItem published` quando arte `rejected`: `PARCIAL`
  - `app/api/catalog-items/[id]/publish/route.ts`
8. Vinculação arte aprovada -> produto base -> variantes: `PARCIAL`
  - `app/api/catalog-items/route.ts`
  - `lib/catalog-item-store.ts`
9. Publicação/despublicação com trilha (`publishedAt`, motivo e ator): `EXISTE`
  - `app/api/catalog-items/[id]/ready/route.ts`
  - `app/api/catalog-items/[id]/publish/route.ts`
  - `app/api/catalog-items/[id]/unpublish/route.ts`
  - `app/api/catalog-items/[id]/reopen/route.ts`
10. Substituir `getMockProduct` por leitura de `CatalogItem` publicado: `EXISTE`
  - estado atual:
    - `components/product/product-data.ts`
    - `app/product/[id]/page.tsx`

## 5) Suporte e Tickets
- DoD completo definido: `EXISTE` (documentação)
  - `docs/SUPPORT_TICKETS_DEFINITION_OF_DONE.md`
- Implementação backend de tickets/triagem/escalonamento: `PARCIAL` (MVP com criação, resposta e contexto consolidado; sem SLA/escalonamento completo)
  - `app/api/tickets/route.ts`
  - `app/api/tickets/[id]/route.ts`
  - `app/api/tickets/[id]/reply/route.ts`
  - `app/api/support/orders/[orderId]/context/route.ts`

## 6) Governança documental
- Precedência, fonte única, anti-conflito: `EXISTE`
  - `docs/EXECUTION_CONSOLIDATED_MASTER.md`
- Hierarquia de navegação: `EXISTE`
  - `docs/README_DOCS_HIERARCHY.md`
- Classificação normativo/referencial: `EXISTE`
  - `docs/DOCS_CLASSIFICATION.md`
- Template obrigatório de PR crítico: `EXISTE`
  - `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md`
- Histórico oficial de decisões: `EXISTE`
  - `docs/CHANGELOG_GOVERNANCE.md`

## 7) Documentos externos citados e não presentes no repositório
- `docs/USERUAH_360_ARCHITECTURE.md`: `AUSENTE NO REPO`
- `docs/FRONT_BACK_FUNCTION_MAP.md`: `AUSENTE NO REPO`

## Conclusão operacional
Base de governança e jornada de produto/checkout está forte.
Próximo bloco de execução técnica para evolução real sem retrabalho:
1. Catálogo/Curadoria backend
2. Gateway real + persistência relacional de pagamento (fase 2.1)
3. Hardening de Pedidos/Logística (sair de store local para banco + observabilidade)
4. Hardening de Suporte/Tickets (SLA, escalonamento e trilha operacional completa)

