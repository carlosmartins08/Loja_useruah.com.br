# P0 Evidence Log

Data de revisao: 2026-05-19

## P0 â€” Order + Payment + Webhook Sandbox

Status: PASS  
Data: 2026-05-19  
Ambiente: local/dev  
Escopo: order + payment checkout + webhook sandbox

### Resultado
- P0-01 Criar pedido em `placed`: PASS
- P0-02 Checkout com idempotÃªncia: PASS
- P0-03 Bloquear checkout para order invÃ¡lida: PASS
- P0-04 Webhook approved: PASS
- P0-05 Webhook approved duplicado: PASS
- P0-06 Webhook failed: PASS
- P0-07 Assinatura invÃ¡lida: PASS
- P0-08 TransiÃ§Ã£o invÃ¡lida: PASS
- P0-09 ProduÃ§Ã£o sÃ³ apÃ³s `order.paid`: PASS
- P0-10 AuditLog crÃ­tico: PASS

### EvidÃªncias tÃ©cnicas
- `POST /api/orders` retornou `201` com `order.status = placed`.
- `POST /api/payments/checkout` com `x-idempotency-key` criou `payment.status = processing`.
- Webhook `approved` atualizou `payment -> approved`, `order -> paid` e criou `ProductionJob` em `queued`.
- Webhook duplicado retornou `already_processed`.
- Webhook `failed` manteve `order` em `placed` e nÃ£o criou produÃ§Ã£o.
- Assinatura invÃ¡lida retornou `401`.
- TransiÃ§Ã£o invÃ¡lida retornou `409 invalid_transition`.
- `production.created = 1`.
- `order.paid = 1`.

### Qualidade
- `npm run check`: PASS.
- `npm run build`: FAIL por encoding invÃ¡lido UTF-8 em arquivos legados fora do recorte.

### ObservaÃ§Ã£o
A persistÃªncia local via `dev-store.ts` Ã© recurso de desenvolvimento/teste e nÃ£o deve ser tratada como persistÃªncia final de produÃ§Ã£o.

## DÃ­vida tÃ©cnica aberta (P1)
Tema: corrigir arquivos legados com encoding invÃ¡lido UTF-8 que impedem `npm run build`.

CritÃ©rio de aceite:
- `npm run build` passa.
- Arquivos legados convertidos para UTF-8.
- Textos em portuguÃªs preservados sem mojibake.
- Nenhuma alteraÃ§Ã£o funcional colateral.

## P0 â€” Production Lifecycle (`queued -> in_production -> shipped`)

Status: PASS  
Data: 2026-05-19  
Ambiente: local/dev  
Escopo: lifecycle mÃ­nimo de produÃ§Ã£o sem `delivered`

### Resultado
- P0-PROD-01 Listar ProductionJob criado apÃ³s `order.paid`: PASS
- P0-PROD-02 Iniciar produÃ§Ã£o `queued -> in_production`: PASS
- P0-PROD-03 Bloquear start fora de `queued`: PASS (`409 invalid_transition`)
- P0-PROD-04 Bloquear ship direto de `queued`: PASS (`409 invalid_transition`)
- P0-PROD-05 Enviar produÃ§Ã£o `in_production -> shipped` com `trackingCode + carrier`: PASS
- P0-PROD-06 Criar Shipment exatamente 1 vez por order: PASS
- P0-PROD-07 Refletir `order -> shipped`: PASS
- P0-PROD-08 AuditLog de `production.started`, `production.shipped`, `shipment.created`, `order.shipped`: PASS
- P0-PROD-09 Ship duplicado nÃ£o duplica Shipment: PASS (`already_shipped`)
- P0-PROD-10 `npm run check`: PASS

### EvidÃªncias tÃ©cnicas
- `GET /api/production-jobs` retornou lista com job criado por fluxo pago.
- `GET /api/production-jobs/:id` retornou estado inicial `queued`.
- `POST /api/production-jobs/:id/start` atualizou para `in_progress` e `order` para `in_production`.
- Segunda tentativa de `start` retornou `409 invalid_transition`.
- `POST /api/production-jobs/:id/ship` (fora de estado) retornou `409 invalid_transition`.
- `POST /api/production-jobs/:id/ship` em `in_progress` gerou:
  - `ProductionJob.status = shipped`
  - `Shipment` criado com `trackingCode` e `carrier`
  - `Order.status = shipped`
- RepetiÃ§Ã£o de `ship` retornou `already_shipped` e manteve `shipmentId` estÃ¡vel.

### ReferÃªncias
- `docs/STATE_MACHINES.md`
- `docs/API_CONTRACTS.md`
- `docs/QA_ACCEPTANCE_TESTS.md`

### ObservaÃ§Ã£o
Sem incluir `delivered` neste recorte, por depender de confirmaÃ§Ã£o logÃ­stica externa/manual.

## P0 — Order Status Visibility + Shipment Tracking

Status: PASS  
Escopo: consulta consolidada de status do pedido e rastreio por pedido  
Ambiente: local/dev  
Referências:
- `GET /api/orders/:orderId/status`
- `GET /api/shipments/:orderId`
- `STATE_MACHINES.md`
- `API_CONTRACTS.md`
- `QA_ACCEPTANCE_TESTS.md`

### Casos executados

- P0-STATUS-01 — Pedido `placed`: PASS
- P0-STATUS-02 — Pedido `paid`: PASS
- P0-STATUS-03 — Pedido `in_production`: PASS
- P0-STATUS-04 — Pedido `shipped` com `trackingCode` + `carrier`: PASS
- P0-STATUS-05 — Acesso cruzado bloqueado com RBAC ativo: PASS
- P0-STATUS-06 — Suporte/admin consulta por `orderId`: PASS
- P0-STATUS-07 — Pedido inexistente retorna `404`: PASS
- P0-STATUS-08 — `npm run check`: PASS

### Evidências técnicas

- Endpoints `GET` não alteram estado.
- Pedido inexistente retorna `404`.
- Shipment inexistente para pedido existente retorna `200` com `shipment: null`.
- Cliente só consulta pedido próprio quando RBAC está ativo.
- Suporte/admin consulta pedido por `orderId`.
- Acesso cruzado retorna `403`.
- Pedido `shipped` retorna dados de rastreio.

### Observações

Este recorte fecha a visibilidade mínima do cliente e suporte sobre o ciclo operacional já validado: pedido, pagamento, produção e envio.

## P0 — Support 360 - Order Context

Status: PASS  
Escopo: contexto consolidado de suporte por pedido + fluxo minimo de tickets  
Ambiente: local/dev  
Referencias:
- `GET /api/support/orders/:orderId/context`
- `POST /api/tickets`
- `GET /api/tickets/:id`
- `POST /api/tickets/:id/reply`
- `STATE_MACHINES.md`
- `API_CONTRACTS.md`
- `QA_ACCEPTANCE_TESTS.md`

### Casos executados

- P0-SUP-01 — support_agent consulta contexto completo por `orderId`: PASS
- P0-SUP-02 — Contexto inclui `order`, `payment`, `production`, `shipment`, `tickets`, `auditSummary`: PASS
- P0-SUP-03 — GET de contexto nao altera estado operacional: PASS
- P0-SUP-04 — customer cria ticket vinculado ao proprio pedido: PASS
- P0-SUP-05 — customer nao cria ticket para pedido de outro cliente: PASS
- P0-SUP-06 — support_agent responde ticket: PASS
- P0-SUP-07 — customer le proprio ticket e resposta: PASS
- P0-SUP-08 — customer nao le ticket de outro cliente: PASS
- P0-SUP-09 — pedido inexistente no contexto retorna `404`: PASS
- P0-SUP-10 — `npm run check`: PASS

### Evidencias tecnicas

- `GET /api/support/orders/:orderId/context` e estritamente leitura e nao cria/muta entidades.
- Endpoint de contexto bloqueia `customer` com `403`.
- `POST /api/tickets` so permite customer dono do pedido.
- `POST /api/tickets/:id/reply` evolui `open -> in_progress` na primeira resposta de suporte.
- Resposta de ticket nao altera estados de `order`, `payment`, `production` ou `shipment`.
- Pedido inexistente no contexto retorna `404`.

### Observacoes

Este recorte fecha diagnostico operacional minimo de suporte sem violar isolamento de dominios de order, payment, production e shipment.

## P0 — Commission Ledger + Payout Request

Status: PASS  
Escopo: ledger inicial de comissao + solicitacao de saque (`requested`)  
Ambiente: local/dev  
Referencias:
- `POST /api/payments/webhook`
- `GET /api/commissions/me`
- `POST /api/payouts`
- `STATE_MACHINES.md`
- `API_CONTRACTS.md`
- `QA_ACCEPTANCE_TESTS.md`

### Casos executados

- P0-FIN-01 — `order.paid` cria CommissionLedger `pending`: PASS
- P0-FIN-02 — `commission.pending` nao pode ser sacada: PASS
- P0-FIN-03 — `commission.available` aparece em `GET /api/commissions/me`: PASS
- P0-FIN-04 — `customer` nao acessa ledger financeiro: PASS
- P0-FIN-05 — `artist/community_manager` acessam apenas proprio ledger: PASS
- P0-FIN-06 — `POST /api/payouts` cria `payout.requested` com saldo `available`: PASS
- P0-FIN-07 — payout acima do saldo retorna `409 insufficient_available_balance`: PASS
- P0-FIN-08 — `payout.requested` nao marca comissao como `paid`: PASS
- P0-FIN-09 — AuditLog registra `commission.created` e `payout.requested`: PASS
- P0-FIN-10 — `npm run check`: PASS

### Evidencias tecnicas

- Criacao de comissao idempotente por `order.paid:{orderId}`.
- Ledger separa saldo `pending`, `availableGross`, `requested`, `availableToWithdraw`.
- Disponibilidade e reconciliada sem mutar fluxo operacional de venda.
- `POST /api/payouts` exige `x-idempotency-key` e bloqueia saldo insuficiente.
- Solicitacao de saque nao executa pagamento nem marca comissao como `paid`.

### Observacoes

Este recorte inicia o dominio financeiro com separacao entre venda, comissao e saque, mantendo idempotencia, RBAC e trilha de auditoria.

## P0 - Catalog Lifecycle (`draft -> ready -> published -> archived -> draft`)

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: ciclo operacional de publicacao e manutencao de `CatalogItem`

### Casos executados

- P0-CAT-01 - bootstrap de catalogo publicado: PASS
- P0-CAT-02 - publish idempotente em item ja publicado: PASS
- P0-CAT-03 - unpublish `published -> archived`: PASS
- P0-CAT-04 - reopen `archived -> draft`: PASS
- P0-CAT-05 - bloqueio `draft -> published` sem `ready`: PASS (`409`)
- P0-CAT-06 - ready `draft -> ready`: PASS
- P0-CAT-07 - publish `ready -> published`: PASS

### Evidencias tecnicas

- Execucao do script `scripts/qa-catalog-lifecycle.mjs` com `status: PASS`.
- Endpoint `POST /api/catalog-items/bootstrap` compatibilizou IDs legados e manteve fluxo `shop -> product`.
- Publicacao agora exige etapa intermediaria `ready`.
- Reabertura de item arquivado exige `reason`.

### Referencias

- `docs/STATE_MACHINES.md`
- `docs/API_CONTRACTS.md`
- `scripts/qa-catalog-lifecycle.mjs`

## P0 - Payments 2.1 (sqlite + gateway_sandbox)

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: persistencia relacional de pagamentos + adapter homologado de gateway sandbox

### Casos executados

- P0-PAY21-01 - order created: PASS
- P0-PAY21-02 - checkout processing via gateway_sandbox adapter: PASS
- P0-PAY21-03 - relational sqlite file created: PASS
- P0-PAY21-04 - payment status query ok: PASS
- P0-PAY21-05 - webhook approved processed: PASS
- P0-PAY21-06 - webhook duplicate handled: PASS

### Evidencias tecnicas

- Execucao do script `scripts/qa-payments-2-1.mjs` com `status: PASS`.
- Persistencia em `.tmp-store/payments.sqlite` criada e utilizada no fluxo de pagamento.
- Adapter `PAYMENT_PROVIDER=gateway_sandbox` utilizado no checkout sem quebra de contrato.
- Reprocessamento de webhook com mesmo `eventId` tratado sem duplicar efeito operacional.

### Referencias

- `lib/payment-store.ts`
- `lib/payment-provider.ts`
- `scripts/qa-payments-2-1.mjs`
- `docs/PAYMENTS_DEFINITION_OF_DONE.md`

## P0 - Payments status timeline events

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: trilha de eventos de pagamento no endpoint de status

### Casos executados

- P0-PAY21-EVT-01 - checkout grava evento `payment.checkout_started`: PASS
- P0-PAY21-EVT-02 - webhook approved grava evento `payment.approved`: PASS
- P0-PAY21-EVT-03 - `GET /api/payments/status/[paymentId]` retorna `events` ordenado: PASS
- P0-PAY21-EVT-04 - `npm run check`: PASS

### Evidencias tecnicas

- `lib/payment-service.ts` grava eventos em cada transicao relevante de status.
- `lib/payment-store.ts` persiste trilha em `payment_events` (sqlite) com fallback em store local.
- `app/api/payments/status/[paymentId]/route.ts` retorna `{ ok, payment, events }`.
- Execucao de `npm run qa:payments21` segue PASS apos o wiring de eventos.

### Referencias

- `lib/payment-service.ts`
- `lib/payment-store.ts`
- `app/api/payments/status/[paymentId]/route.ts`
- `docs/PAYMENTS_DEFINITION_OF_DONE.md`

## P0 - Webhook retry controlado + retencao operacional

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: robustez de processamento webhook sem alterar contrato

### Casos executados

- P0-PAY21-RET-01 - webhook com retry controlado por `PAYMENT_WEBHOOK_MAX_RETRIES`: PASS
- P0-PAY21-RET-02 - idempotencia de webhook com janela de retencao: PASS
- P0-PAY21-RET-03 - trilha de eventos com retencao automatica: PASS
- P0-PAY21-RET-04 - `npm run check` e `npm run qa:payments21`: PASS

### Evidencias tecnicas

- `app/api/payments/webhook/route.ts` aplica tentativas controladas para erros internos nao deterministas.
- `lib/webhook-event-store.ts` migrou para registro com `processedAt` + limpeza por `WEBHOOK_IDEMPOTENCY_RETENTION_DAYS`.
- `lib/payment-store.ts` aplica limpeza de `payment_events` por `PAYMENT_EVENTS_RETENTION_DAYS`.
- Contrato publico de API de pagamento permaneceu inalterado.

### Referencias

- `app/api/payments/webhook/route.ts`
- `lib/webhook-event-store.ts`
- `lib/payment-store.ts`
- `docs/ARCHITECTURE.md`
- `docs/LOCAL_DOCKER_DATABASE_RUNBOOK.md`

## P0 - Payments adapter MySQL ativo (homologacao local)

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev (Docker Desktop)  
Escopo: persistencia de pagamentos, eventos e idempotencia de webhook em MySQL

### Casos executados

- P0-PAY21-MY-01 - servidor iniciado com `PAYMENT_PERSISTENCE=mysql`: PASS
- P0-PAY21-MY-02 - checkout/status/webhook com `QA_BASE_URL=http://localhost:3211`: PASS
- P0-PAY21-MY-03 - idempotencia de webhook no backend MySQL: PASS
- P0-PAY21-MY-04 - persistencia validada no banco (`payments`, `payment_events`, `webhook_events`): PASS

### Evidencias tecnicas

- `npm run qa:payments21` com `QA_EXPECT_PERSISTENCE=mysql` retornou PASS.
- Query direta no container MySQL apos o fluxo:
  - `payments_count = 1`
  - `events_count = 2`
  - `webhook_count = 1`
- Contrato de API permaneceu inalterado.

### Referencias

- `lib/payment-store.ts`
- `lib/webhook-event-store.ts`
- `lib/payment-service.ts`
- `scripts/qa-payments-2-1.mjs`

## P0 - MySQL para Orders + Production + Shipments

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: adaptadores MySQL com fallback para dominio operacional de fulfilment

### Casos executados

- P0-MY-OPS-01 - `npm run typecheck` apos migracao async dos stores/rotas: PASS
- P0-MY-OPS-02 - `npm run check` apos migracao: PASS
- P0-MY-OPS-03 - schema de init MySQL atualizado com tabelas de operacao: PASS

### Evidencias tecnicas

- `lib/order-store.ts` migrado para async com suporte MySQL.
- `lib/production-store.ts` migrado para async com suporte MySQL.
- `lib/shipment-store.ts` migrado para async com suporte MySQL.
- Rotas que consomem esses dominios ajustadas para `await`.
- `infra/mysql/init/001_payments.sql` agora inclui `orders`, `production_jobs` e `shipments`.

### Referencias

- `lib/order-store.ts`
- `lib/production-store.ts`
- `lib/shipment-store.ts`
- `app/api/orders/[orderId]/status/route.ts`
- `app/api/production-jobs/[id]/start/route.ts`
- `app/api/production-jobs/[id]/ship/route.ts`
- `app/api/shipments/[orderId]/route.ts`
- `infra/mysql/init/001_payments.sql`

## P0 - MySQL para Tickets + Commissions + Payouts

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: suporte e financeiro migrados para adapter MySQL com fallback

### Casos executados

- P0-MY-SUPFIN-01 - stores migrados para async com suporte MySQL: PASS
- P0-MY-SUPFIN-02 - rotas ajustadas para `await` sem quebra de contrato: PASS
- P0-MY-SUPFIN-03 - `npm run typecheck`: PASS
- P0-MY-SUPFIN-04 - `npm run check`: PASS

### Evidencias tecnicas

- `lib/ticket-store.ts` com persistencia MySQL (`tickets`).
- `lib/commission-store.ts` com persistencia MySQL (`commissions`).
- `lib/payout-store.ts` com persistencia MySQL (`payouts`).
- `lib/payment-service.ts` atualizado para `createCommissionPending` async.
- `infra/mysql/init/001_payments.sql` atualizado com tabelas e indices de suporte/financeiro.

### Referencias

- `lib/ticket-store.ts`
- `lib/commission-store.ts`
- `lib/payout-store.ts`
- `app/api/tickets/route.ts`
- `app/api/tickets/[id]/route.ts`
- `app/api/tickets/[id]/reply/route.ts`
- `app/api/commissions/me/route.ts`
- `app/api/payouts/route.ts`
- `infra/mysql/init/001_payments.sql`

## P0 - Core Operations Cross-Domain (`order -> payment -> production -> shipment -> support`)

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: fluxo operacional cruzado com RBAC em acoes de producao

### Casos executados

- P0-CORE-01 - bootstrap catalog ready: PASS
- P0-CORE-02 - production creation blocked for non-paid order: PASS
- P0-CORE-03 - paid order created via checkout+webhook: PASS
- P0-CORE-04 - production create idempotent for paid order: PASS
- P0-CORE-05 - production start protected by RBAC: PASS
- P0-CORE-06 - production start queued->in_progress: PASS
- P0-CORE-07 - production ship in_progress->shipped: PASS
- P0-CORE-08 - customer sees shipped order status: PASS
- P0-CORE-09 - shipment tracking available: PASS
- P0-CORE-10 - customer ticket opened: PASS
- P0-CORE-11 - support replied ticket: PASS
- P0-CORE-12 - support context consolidated: PASS

### Evidencias tecnicas

- `POST /api/production-jobs` implementado e validado com:
  - `409 invalid_transition` para `order.status != paid`
  - `201|200` controlado para criacao/idempotencia
- `POST /api/production-jobs/:id/start` e `POST /api/production-jobs/:id/ship` exigem actor de operacao com RBAC ativo.
- `GET /api/orders/:id/status` e `GET /api/shipments/:orderId` refletem estado final `shipped`.
- `POST /api/tickets` + `POST /api/tickets/:id/reply` + `GET /api/support/orders/:orderId/context` validados no mesmo fluxo.

### Referencias

- `scripts/qa-core-operations.mjs`
- `app/api/production-jobs/route.ts`
- `app/api/production-jobs/[id]/start/route.ts`
- `app/api/production-jobs/[id]/ship/route.ts`

## P0 � Base Enxuta Operacional (Fase 1)

Status: PASS  
Data: 2026-05-21  
Ambiente: local/dev  
Escopo: decomposicao financeira por item + license_events + terms_acceptances + gates opcionais

### Resultado
- P0-F1-01 `npm run alert:critical`: PASS
- P0-F1-02 `npm run check`: PASS
- P0-F1-03 Regressao de contratos publicos (`orders/payments/catalog`) sem quebra: PASS
- P0-F1-04 Persistencia interna de `payment_splits`: PASS
- P0-F1-05 Geracao interna de `license_events` em pagamento aprovado: PASS
- P0-F1-06 Gate de aceite de termos por feature flag: PASS

### Evidencias tecnicas
- Criadas tabelas internas: `terms_acceptances`, `payment_splits`, `license_events`.
- Criado endpoint `POST /api/terms/accept` para versionamento de aceite.
- `POST /api/catalog-items` pode exigir termo de industria (`TERMS_ENFORCE_INDUSTRY=true`).
- `POST /api/artworks` pode exigir termo de artista (`TERMS_ENFORCE_ARTIST=true`).
- `POST /api/orders` pode exigir termo de consumidor (`TERMS_ENFORCE_CONSUMER=true`).
- Webhook de pagamento aprovado registra split e evento de licenciamento sem mudar payload publico.
