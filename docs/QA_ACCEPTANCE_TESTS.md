# QA Acceptance Tests (Fonte de Validacao Operacional)

Data de revisao: 2026-05-19

## Objetivo
Definir testes de aceite minimos para validar que implementacao segue:
- `docs/STATE_MACHINES.md`
- `docs/API_CONTRACTS.md`
- `docs/ROUTE_DEFINITION_OF_DONE.md`
- `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md`

## Regra normativa
- Este documento nao define novos estados ou transicoes.
- Cada teste deve referenciar machine/transicao do `STATE_MACHINES.md` e endpoint do `API_CONTRACTS.md`.

## Legenda
- Tipo: `manual | funcional | integracao | regressao`
- Severidade: `P0 | P1 | P2`

---

### QA-ORD-001 â€” Criacao de pedido valida
Fluxo: Orders  
Tipo: funcional  
Severidade: P0

Pre-condicao:
- CatalogItem valido e disponivel.
- Usuario `customer` autenticado.

Acao:
- Executar `POST /api/orders` com payload valido.

Resultado esperado:
- Pedido criado com `status=placed`.
- Evento `order.placed` emitido.
- `AuditLog` criado sem campos faltantes.

Referencias:
- Machine/transicao: `order`, `draft -> placed`
- Endpoint: `POST /api/orders`
- Evento: `order.placed`
- AuditLog: obrigatorio

---

### QA-ORD-002 â€” Cancelamento com transicao invalida retorna 409
Fluxo: Orders  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Pedido em `delivered`.
- Usuario autenticado com role `customer`.

Acao:
- Executar `POST /api/orders/:id/cancel`.

Resultado esperado:
- Resposta `409 invalid_transition`.
- Nenhuma alteracao de estado no pedido.
- Nao cria evento `order.cancelled`.

Referencias:
- Machine/transicao: `order`, `delivered -> cancelled` (proibida)
- Endpoint: `POST /api/orders/:id/cancel`
- Evento: `order.cancelled` (nao deve ocorrer)
- AuditLog: nao deve registrar transicao invalida como sucesso

---

### QA-PAY-001 â€” Checkout inicia payment com idempotencia
Fluxo: Payments  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Pedido em `placed`.
- Header `x-idempotency-key` disponivel.

Acao:
- Enviar `POST /api/payments/checkout`.
- Reenviar a mesma requisicao com mesma chave.

Resultado esperado:
- Primeira chamada cria `payment` em `processing`.
- Segunda chamada nao cria nova cobranca.
- Evento `payment.checkout_started` sem duplicacao operacional.

Referencias:
- Machine/transicao: `payment`, `created -> processing`
- Endpoint: `POST /api/payments/checkout`
- Evento: `payment.checkout_started`
- AuditLog: obrigatorio

---

### QA-PAY-003 â€” Webhook duplicado nao duplica pagamento
Fluxo: Payments/Webhook  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Existe `Payment` em `processing`.
- Evento `payment.approved` valido do provedor.

Acao:
- Enviar o mesmo webhook duas vezes para `POST /api/payments/webhook` com mesmo `eventId`.

Resultado esperado:
- Primeiro webhook processa e atualiza pagamento.
- Segundo webhook retorna `duplicate_event` ou sucesso controlado `already_processed`.
- Nao cria novo `Order`, `Payment` ou `ProductionJob`.
- `AuditLog` sem duplicacao operacional.

Referencias:
- Machine/transicao: `payment`, `processing -> approved`
- Endpoint: `POST /api/payments/webhook`
- Evento: `payment.approved`
- AuditLog: obrigatorio

---

### QA-WEB-001 â€” Webhook sem assinatura falha com 401
Fluxo: Webhooks  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Endpoint webhook ativo.

Acao:
- Enviar webhook sem `x-signature`.

Resultado esperado:
- Resposta `401 unauthorized`.
- Nenhuma transicao de estado aplicada.

Referencias:
- Machine/transicao: `payment` (nao deve transicionar)
- Endpoint: `POST /api/payments/webhook`
- Evento: nenhum
- AuditLog: registrar tentativa invalida conforme politica interna

---

### QA-PROD-001 â€” ProductionJob so nasce apos order.paid
Fluxo: Production  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Pedido A em `placed`.
- Pedido B em `paid`.

Acao:
- Tentar `POST /api/production-jobs` para pedido A e B.

Resultado esperado:
- Pedido A: `409 invalid_transition`.
- Pedido B: sucesso com `status=queued`.
- Evento `production.created` apenas para pedido B.

Referencias:
- Machine/transicao: `production` (criacao apos `order.paid`)
- Endpoint: `POST /api/production-jobs`
- Evento: `production.created`
- AuditLog: obrigatorio

---

### QA-PAYOUT-001 â€” Aprovacao de payout exige role e reason
### QA-PROD-002 â€” Start de producao faz queued -> in_progress
Fluxo: Production  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Existe `ProductionJob` em `queued`.
- `Order` vinculado em `paid`.

Acao:
- Executar `POST /api/production-jobs/:id/start`.

Resultado esperado:
- `ProductionJob` muda para `in_progress`.
- `Order` muda para `in_production`.
- Evento `production.started` registrado.

Referencias:
- Machine/transicao: `production`, `queued -> in_progress`
- Endpoint: `POST /api/production-jobs/:id/start`
- Evento: `production.started`
- AuditLog: obrigatorio

---

### QA-PROD-003 â€” Bloquear start fora de queued
Fluxo: Production  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- `ProductionJob` em estado diferente de `queued`.

Acao:
- Executar `POST /api/production-jobs/:id/start`.

Resultado esperado:
- Retorna `409 invalid_transition`.
- Estado do job nao altera.

Referencias:
- Machine/transicao: `production` (bloqueio fora de `queued`)
- Endpoint: `POST /api/production-jobs/:id/start`
- Evento: nenhum de transicao
- AuditLog: sem transicao de sucesso

---

### QA-PROD-004 â€” Bloquear ship direto de queued
Fluxo: Production  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- `ProductionJob` em `queued`.

Acao:
- Executar `POST /api/production-jobs/:id/ship`.

Resultado esperado:
- Retorna `409 invalid_transition`.
- Nenhum `Shipment` criado.

Referencias:
- Machine/transicao: `production` (proibido `queued -> shipped`)
- Endpoint: `POST /api/production-jobs/:id/ship`
- Evento: nenhum de envio
- AuditLog: sem transicao de sucesso

---

### QA-PROD-005 â€” Ship faz in_progress -> shipped com tracking
Fluxo: Production/Shipment  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- `ProductionJob` em `in_progress`.

Acao:
- Executar `POST /api/production-jobs/:id/ship` com `trackingCode` e `carrier`.

Resultado esperado:
- `ProductionJob` muda para `shipped`.
- `Shipment` criado.
- `Order` muda para `shipped`.

Referencias:
- Machine/transicao: `production`, `in_progress -> shipped`
- Endpoint: `POST /api/production-jobs/:id/ship`
- Evento: `production.shipped`, `shipment.created`, `order.shipped`
- AuditLog: obrigatorio

---

### QA-PROD-006 â€” Ship duplicado nao duplica shipment
Fluxo: Production/Shipment  
Tipo: regressao  
Severidade: P0

Pre-condicao:
- `ProductionJob` ja em `shipped`.
- `Shipment` ja criado.

Acao:
- Reexecutar `POST /api/production-jobs/:id/ship` com mesmo payload.

Resultado esperado:
- Retorno controlado `already_shipped`.
- Mesmo `shipmentId`.
- Nenhum novo shipment criado.

Referencias:
- Machine/transicao: `production` (idempotencia em shipped)
- Endpoint: `POST /api/production-jobs/:id/ship`
- Evento: sem duplicacao de `shipment.created`
- AuditLog: sem duplicacao operacional

---

Fluxo: Payouts  
Tipo: funcional  
Severidade: P0

Pre-condicao:
- Payout em `under_review`.

Acao:
- Tentar aprovar com role sem permissao.
- Aprovar com `finance_admin` sem `reason` quando exigido.
- Aprovar com role/payload corretos.

Resultado esperado:
- Sem permissao: `403 forbidden`.
- Sem `reason`: `422 validation_error`.
- Correto: transicao para `approved` e evento emitido.

Referencias:
- Machine/transicao: `payout`, `under_review -> approved`
- Endpoint: `POST /api/payouts/:id/approve`
- Evento: `payout.approved`
- AuditLog: obrigatorio

---

### QA-REF-001 â€” Refund e chargeback separados
Fluxo: Refunds/Chargebacks  
Tipo: regressao  
Severidade: P0

Pre-condicao:
- Refund em `under_review`.
- Chargeback `received`.

Acao:
- Aprovar refund.
- Processar evento de chargeback.

Resultado esperado:
- Refund segue machine `refund` sem alterar machine `chargeback`.
- Chargeback segue machine `chargeback` sem sobrescrever refund.

Referencias:
- Machine/transicao: `refund` e `chargeback` (separadas)
- Endpoints: `POST /api/refunds/:id/approve`, `POST /api/chargebacks/webhook`
- Evento: `refund.approved`, `chargeback.received`
- AuditLog: obrigatorio

---

### QA-CHB-001 â€” Resolve chargeback com transicao valida
Fluxo: Chargebacks  
Tipo: integracao  
Severidade: P1

Pre-condicao:
- Chargeback em `under_review`.

Acao:
- `POST /api/chargebacks/:id/resolve` com `resolution=contested` e `reason`.

Resultado esperado:
- Estado atualizado conforme transicao permitida.
- Evento `chargeback.contested` emitido.
- `AuditLog` com `previous_status`, `new_status` e `reason`.

Referencias:
- Machine/transicao: `chargeback`, `under_review -> contested`
- Endpoint: `POST /api/chargebacks/:id/resolve`
- Evento: `chargeback.contested`
- AuditLog: obrigatorio

---

### QA-PDP-001 â€” Variacao indisponivel bloqueia compra
Fluxo: PDP  
Tipo: manual  
Severidade: P0

Pre-condicao:
- Produto com ao menos uma variacao indisponivel.

Acao:
- Abrir `/product/[id]` e selecionar variacao indisponivel.

Resultado esperado:
- Variacao sinalizada como indisponivel.
- CTA de compra bloqueado para combinacao invalida.
- Mensagem acionavel exibida proxima ao seletor/CTA.
- Combinacao invalida nao enviada ao backend.

Referencias:
- Machine/transicao: n/a (regra de rota/UX)
- Endpoint relacionado: `POST /api/orders` (nao deve receber combinacao invalida)
- Evento esperado: nenhum evento de compra para combinacao invalida
- AuditLog: n/a

---

### QA-CHK-001 â€” Checkout falha sandbox com erro acionavel
Fluxo: Checkout  
Tipo: manual  
Severidade: P0

Pre-condicao:
- Carrinho com item valido.
- Ambiente sandbox com falha simulada de pagamento.

Acao:
- Executar checkout ate falha no pagamento.

Resultado esperado:
- Erro claro com proxima acao recomendada.
- Possivel tentar novamente ou trocar metodo.
- Sem duplicacao de pedido/cobranca no retry.

Referencias:
- Machine/transicao: `payment`, `processing -> failed`
- Endpoints: `POST /api/payments/checkout`, `POST /api/payments/webhook`
- Evento: `payment.failed`
- AuditLog: obrigatorio para falha processada

---

### QA-RBAC-001 â€” 401 vs 403 padronizado
Fluxo: RBAC/Permissoes  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Endpoint protegido qualquer (ex.: payout approve).

Acao:
- Requisicao sem autenticacao.
- Requisicao autenticada sem role autorizada.

Resultado esperado:
- Sem autenticacao: `401 unauthorized`.
- Sem permissao: `403 forbidden`.

Referencias:
- Machine/transicao: conforme endpoint alvo
- Endpoint: `POST /api/payouts/:id/approve` (exemplo)
- Evento: nenhum em chamadas negadas
- AuditLog: registrar negativa conforme politica

---

### QA-AUD-001 â€” Campos minimos de AuditLog em transicao critica
Fluxo: AuditLog  
Tipo: funcional  
Severidade: P0

Pre-condicao:
- Executar uma transicao critica (ex.: payout approve).

Acao:
- Consultar registro de auditoria gerado.

Resultado esperado:
- Presenca de `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `previous_status`, `new_status`, `reason`, `created_at`.

Referencias:
- Machine/transicao: conforme acao executada
- Endpoint: financeiro critico (ex.: `POST /api/payouts/:id/approve`)
- Evento: correspondente
- AuditLog: obrigatorio e completo

---

### QA-IDEMP-001 â€” Repeticao de acao nao duplica efeito
Fluxo: Idempotencia  
Tipo: regressao  
Severidade: P0

Pre-condicao:
- Endpoint com idempotencia exigida (checkout ou webhook).

Acao:
- Repetir mesma operacao com mesma chave/id de evento.

Resultado esperado:
- Nenhuma duplicacao de entidade ou transicao.
- Retorno controlado (`already_processed`/equivalente).

Referencias:
- Machine/transicao: `payment` e reflexo em `order`
- Endpoints: `POST /api/payments/checkout`, `POST /api/payments/webhook`
- Evento: `payment.checkout_started` ou `payment.approved`
- AuditLog: sem duplicacao operacional

### QA-STATUS-001 — Cliente consulta pedido em placed
Fluxo: Order Status Visibility  
Tipo: integração  
Severidade: P0

Pre-condição:
- Pedido existente em `placed` pertencente ao cliente.

Ação:
- Executar `GET /api/orders/:id/status`.

Resultado esperado:
- Retorna `200` com `status=placed`.
- Não altera estado do pedido.

Referências:
- Machine/transição: `order` (consulta sem transição)
- Endpoint: `GET /api/orders/:id/status`
- Evento: `order.status_viewed` (opcional)
- AuditLog: não obrigatório

---

### QA-STATUS-002 — Cliente consulta pedido em paid
Fluxo: Order Status Visibility  
Tipo: integração  
Severidade: P0

Pre-condição:
- Pedido existente em `paid` pertencente ao cliente.

Ação:
- Executar `GET /api/orders/:id/status`.

Resultado esperado:
- Retorna `200` com `status=paid`.

Referências:
- Machine/transição: `order` (consulta sem transição)
- Endpoint: `GET /api/orders/:id/status`
- Evento: `order.status_viewed` (opcional)
- AuditLog: não obrigatório

---

### QA-STATUS-003 — Cliente consulta pedido em in_production
Fluxo: Order Status Visibility  
Tipo: integração  
Severidade: P0

Pre-condição:
- Pedido existente em `in_production` pertencente ao cliente.

Ação:
- Executar `GET /api/orders/:id/status`.

Resultado esperado:
- Retorna `200` com `status=in_production`.

Referências:
- Machine/transição: `order` (consulta sem transição)
- Endpoint: `GET /api/orders/:id/status`
- Evento: `order.status_viewed` (opcional)
- AuditLog: não obrigatório

---

### QA-STATUS-004 — Cliente consulta pedido shipped com tracking
Fluxo: Order Status Visibility / Shipment Tracking  
Tipo: integração  
Severidade: P0

Pre-condição:
- Pedido em `shipped` com shipment criado.

Ação:
- Executar `GET /api/orders/:id/status` e `GET /api/shipments/:orderId`.

Resultado esperado:
- Status consolidado retorna shipment com `trackingCode` e `carrier`.
- Endpoint de shipment retorna dados do rastreio.

Referências:
- Machine/transição: `order` e `production` (consulta sem transição)
- Endpoint: `GET /api/orders/:id/status`, `GET /api/shipments/:orderId`
- Evento: `shipment.status_viewed` (opcional)
- AuditLog: não obrigatório

---

### QA-STATUS-005 — Bloqueio de acesso cruzado quando RBAC ativo
Fluxo: RBAC / Order Status Visibility  
Tipo: integração  
Severidade: P0

Pre-condição:
- `RBAC_ACTIVE=true`.
- Pedido do cliente A.
- Cliente B autenticado.

Ação:
- Cliente B consulta `GET /api/orders/:id/status` do cliente A.

Resultado esperado:
- Retorna `403 forbidden`.

Referências:
- Machine/transição: consulta (sem transição)
- Endpoint: `GET /api/orders/:id/status`
- Evento: nenhum
- AuditLog: opcional para tentativa negada

---

### QA-STATUS-006 — Suporte consulta visão consolidada por orderId
Fluxo: Suporte  
Tipo: integração  
Severidade: P0

Pre-condição:
- `RBAC_ACTIVE=true`.
- Pedido existente.
- Actor role `support_agent`.

Ação:
- Executar `GET /api/orders/:id/status` com cabeçalhos de actor do suporte.

Resultado esperado:
- Retorna `200` com visão consolidada de status.

Referências:
- Machine/transição: consulta (sem transição)
- Endpoint: `GET /api/orders/:id/status`
- Evento: `order.status_viewed` (opcional)
- AuditLog: não obrigatório

---

### QA-STATUS-007 — Pedido inexistente retorna 404
Fluxo: Order Status Visibility  
Tipo: integração  
Severidade: P0

Pre-condição:
- `orderId` inexistente.

Ação:
- Executar `GET /api/orders/:id/status`.

Resultado esperado:
- Retorna `404 not_found`.

Referências:
- Machine/transição: consulta (sem transição)
- Endpoint: `GET /api/orders/:id/status`
- Evento: nenhum
- AuditLog: não obrigatório

---

### QA-STATUS-008 — Gate técnico
Fluxo: Qualidade  
Tipo: regressão  
Severidade: P0

Pre-condição:
- Alterações do recorte aplicadas.

Ação:
- Executar `npm run check`.

Resultado esperado:
- `npm run check` passa sem erro.

Referências:
- Machine/transição: n/a
- Endpoint: n/a
- Evento: n/a
- AuditLog: n/a

### QA-SUP-001 — Support 360 retorna contexto completo por orderId
Fluxo: Support 360  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Pedido existente.
- Actor com role `support_agent`.

Acao:
- Executar `GET /api/support/orders/:orderId/context`.

Resultado esperado:
- Retorna `200` com `order`, `payment`, `production`, `shipment`, `tickets` e `auditSummary`.

Referencias:
- Machine/transicao: `order`, `payment`, `production`, `ticket` (consulta)
- Endpoint: `GET /api/support/orders/:orderId/context`
- Evento: `support.context_viewed` (opcional)
- AuditLog: nao obrigatorio

---

### QA-SUP-002 — GET de contexto nao altera estado operacional
Fluxo: Support 360  
Tipo: regressao  
Severidade: P0

Pre-condicao:
- Pedido com estados existentes em order/payment/production/shipment.

Acao:
- Executar `GET /api/support/orders/:orderId/context`.

Resultado esperado:
- Nenhuma mudanca de estado em `order`, `payment`, `production` e `shipment`.

Referencias:
- Machine/transicao: consulta sem transicao
- Endpoint: `GET /api/support/orders/:orderId/context`
- Evento: nenhum obrigatorio
- AuditLog: nao obrigatorio

---

### QA-SUP-003 — Customer cria ticket do proprio pedido
Fluxo: Tickets  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Pedido existente do customer autenticado.

Acao:
- Executar `POST /api/tickets` com `orderId`, `subject`, `message`.

Resultado esperado:
- Retorna `201` com `ticket.status=open`.
- Registra evento `ticket.created`.

Referencias:
- Machine/transicao: `ticket`, `none -> open`
- Endpoint: `POST /api/tickets`
- Evento: `ticket.created`
- AuditLog: obrigatorio

---

### QA-SUP-004 — Bloqueio de ticket para pedido de outro cliente
Fluxo: Tickets / RBAC  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Pedido do cliente A.
- Cliente B autenticado.

Acao:
- Cliente B executa `POST /api/tickets` para pedido do cliente A.

Resultado esperado:
- Retorna `403 forbidden`.

Referencias:
- Machine/transicao: sem transicao
- Endpoint: `POST /api/tickets`
- Evento: nenhum
- AuditLog: opcional para tentativa negada

---

### QA-SUP-005 — Suporte responde ticket
Fluxo: Tickets  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Ticket existente em `open`.
- Actor role `support_agent`.

Acao:
- Executar `POST /api/tickets/:id/reply`.

Resultado esperado:
- Retorna `200`.
- Ticket evolui para `in_progress` na primeira resposta de suporte.

Referencias:
- Machine/transicao: `ticket`, `open -> in_progress`
- Endpoint: `POST /api/tickets/:id/reply`
- Evento: `ticket.reply_by_support`
- AuditLog: obrigatorio

---

### QA-SUP-006 — Customer le proprio ticket com resposta
Fluxo: Tickets  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Ticket do customer com ao menos uma resposta.

Acao:
- Executar `GET /api/tickets/:id` como customer dono do ticket.

Resultado esperado:
- Retorna `200` com historico de mensagens.

Referencias:
- Machine/transicao: consulta sem transicao
- Endpoint: `GET /api/tickets/:id`
- Evento: `ticket.viewed` (opcional)
- AuditLog: nao obrigatorio

---

### QA-SUP-007 — Customer nao le ticket de outro cliente
Fluxo: Tickets / RBAC  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Ticket do cliente A.
- Cliente B autenticado.

Acao:
- Cliente B executa `GET /api/tickets/:id` do cliente A.

Resultado esperado:
- Retorna `403 forbidden`.

Referencias:
- Machine/transicao: consulta sem transicao
- Endpoint: `GET /api/tickets/:id`
- Evento: nenhum
- AuditLog: opcional

---

### QA-SUP-008 — Pedido inexistente no contexto retorna 404
Fluxo: Support 360  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- `orderId` inexistente.

Acao:
- Executar `GET /api/support/orders/:orderId/context`.

Resultado esperado:
- Retorna `404 not_found`.

Referencias:
- Machine/transicao: consulta sem transicao
- Endpoint: `GET /api/support/orders/:orderId/context`
- Evento: nenhum
- AuditLog: nao obrigatorio

---

### QA-SUP-009 — Customer bloqueado no endpoint Support 360
Fluxo: Support 360 / RBAC  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Pedido existente.
- Actor role `customer`.

Acao:
- Executar `GET /api/support/orders/:orderId/context`.

Resultado esperado:
- Retorna `403 forbidden`.

Referencias:
- Machine/transicao: consulta sem transicao
- Endpoint: `GET /api/support/orders/:orderId/context`
- Evento: nenhum
- AuditLog: opcional

---

### QA-SUP-010 — Gate tecnico
Fluxo: Qualidade  
Tipo: regressao  
Severidade: P0

Pre-condicao:
- Alteracoes do recorte aplicadas.

Acao:
- Executar `npm run check`.

Resultado esperado:
- `npm run check` passa sem erro.

Referencias:
- Machine/transicao: n/a
- Endpoint: n/a
- Evento: n/a
- AuditLog: n/a

### QA-FIN-001 — order.paid cria CommissionLedger pending
Fluxo: Financeiro Inicial  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Pedido em `placed` com pagamento `processing`.

Acao:
- Processar webhook `payment.approved`.

Resultado esperado:
- Cria `commission` com status `pending`.
- AuditLog inclui `commission.created`.

Referencias:
- Machine/transicao: `commission_ledger`, `none -> pending`
- Endpoint: `POST /api/payments/webhook`
- Evento: `commission.created`
- AuditLog: obrigatorio

---

### QA-FIN-002 — Commission pending nao pode ser sacada
Fluxo: Financeiro Inicial  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Comissao em `pending` para owner.

Acao:
- Executar `POST /api/payouts` com valor da comissao pendente.

Resultado esperado:
- Retorna `409 insufficient_available_balance`.

Referencias:
- Machine/transicao: `commission_ledger` (sem transicao)
- Endpoint: `POST /api/payouts`
- Evento: nenhum
- AuditLog: sem sucesso de payout

---

### QA-FIN-003 — Commission available aparece em GET /api/commissions/me
Fluxo: Financeiro Inicial  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Pedido associado a comissao em `pending` evolui para `shipped`.

Acao:
- Executar `GET /api/commissions/me` com owner correto.

Resultado esperado:
- Comissao elegivel aparece em `availableGross` e `availableToWithdraw`.

Referencias:
- Machine/transicao: `commission_ledger`, `pending -> available`
- Endpoint: `GET /api/commissions/me`
- Evento: `commission.available`
- AuditLog: obrigatorio na transicao

---

### QA-FIN-004 — Customer nao acessa ledger financeiro
Fluxo: RBAC Financeiro  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Actor role `customer`.

Acao:
- Executar `GET /api/commissions/me`.

Resultado esperado:
- Retorna `403 forbidden`.

Referencias:
- Machine/transicao: consulta sem transicao
- Endpoint: `GET /api/commissions/me`
- Evento: nenhum
- AuditLog: opcional

---

### QA-FIN-005 — Artist/community_manager acessam somente proprio ledger
Fluxo: RBAC Financeiro  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Dois owners distintos com comissoes diferentes.

Acao:
- Owner A executa `GET /api/commissions/me`.

Resultado esperado:
- Retorna somente dados do owner A.

Referencias:
- Machine/transicao: consulta sem transicao
- Endpoint: `GET /api/commissions/me`
- Evento: nenhum
- AuditLog: nao obrigatorio

---

### QA-FIN-006 — POST /api/payouts cria payout requested com saldo available
Fluxo: Financeiro Inicial  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Owner com `availableToWithdraw` suficiente.

Acao:
- Executar `POST /api/payouts` com `x-idempotency-key` e valor valido.

Resultado esperado:
- Retorna `200` com `payout.status=requested`.
- AuditLog registra `payout.requested`.

Referencias:
- Machine/transicao: `payout`, `none -> requested`
- Endpoint: `POST /api/payouts`
- Evento: `payout.requested`
- AuditLog: obrigatorio

---

### QA-FIN-007 — Payout acima do saldo retorna 409
Fluxo: Financeiro Inicial  
Tipo: integracao  
Severidade: P0

Pre-condicao:
- Owner com saldo disponivel limitado.

Acao:
- Executar `POST /api/payouts` com valor maior que `availableToWithdraw`.

Resultado esperado:
- Retorna `409 insufficient_available_balance`.

Referencias:
- Machine/transicao: sem transicao
- Endpoint: `POST /api/payouts`
- Evento: nenhum
- AuditLog: sem sucesso de payout

---

### QA-FIN-008 — Payout requested nao marca comissao como paid
Fluxo: Financeiro Inicial  
Tipo: regressao  
Severidade: P0

Pre-condicao:
- Payout criado em `requested`.

Acao:
- Reconsultar `GET /api/commissions/me`.

Resultado esperado:
- Comissoes nao mudam para `paid` por efeito colateral da solicitacao.

Referencias:
- Machine/transicao: `commission_ledger` (sem `available -> paid`)
- Endpoint: `POST /api/payouts`, `GET /api/commissions/me`
- Evento: nenhum de `commission.paid`
- AuditLog: somente `payout.requested`

---

### QA-FIN-009 — AuditLog financeiro minimo
Fluxo: AuditLog Financeiro  
Tipo: funcional  
Severidade: P0

Pre-condicao:
- Execucao de webhook aprovado e solicitacao de payout.

Acao:
- Consultar logs.

Resultado esperado:
- Presenca de `commission.created` e `payout.requested` com campos minimos de auditoria.

Referencias:
- Machine/transicao: `commission_ledger`, `payout`
- Endpoint: `POST /api/payments/webhook`, `POST /api/payouts`
- Evento: `commission.created`, `payout.requested`
- AuditLog: obrigatorio

---

### QA-FIN-010 — Gate tecnico
Fluxo: Qualidade  
Tipo: regressao  
Severidade: P0

Pre-condicao:
- Alteracoes do recorte aplicadas.

Acao:
- Executar `npm run check`.

Resultado esperado:
- `npm run check` passa sem erro.

Referencias:
- Machine/transicao: n/a
- Endpoint: n/a
- Evento: n/a
- AuditLog: n/a
