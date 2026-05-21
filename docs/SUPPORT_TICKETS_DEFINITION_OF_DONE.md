# Support & Tickets Definition Of Done (Obrigatorio)

Data de revisao: 2026-05-19

## Objetivo
Padronizar operação de atendimento para garantir resposta previsível, rastreabilidade e resolução eficaz de incidentes de cliente sem duplicidade de esforço.

## Escopo do dominio
- Abertura e classificação de tickets.
- Atendimento e resolução por fila.
- Escalonamento para produção, logística, financeiro ou plataforma.
- Encerramento com confirmação e trilha de auditoria.

## Estado canonico (congelado)
Ticket:
- `open -> triaged -> in_progress -> waiting_customer | waiting_internal -> resolved -> closed`

Regras obrigatorias:
- [ ] Ticket não pode ser encerrado sem `resolutionSummary`.
- [ ] Reabertura deve criar trilha explícita (`reopenedAt`, `reason`).
- [ ] Mudança de estado registra `actor_role`, `timestamp`, `from`, `to`.

## Ownership por perfil (resumo)
- `customer`: abre ticket e interage com respostas.
- `support_agent`: triagem, resposta e resolução.
- `production_operator`: responde demandas de produção.
- `finance_admin`: responde demandas de pagamento/estorno.
- `platform_admin`: override e incidentes críticos.

Referencia completa: `docs/ROLES_MATRIX.md`

## Fase A: Intake e triagem (MVP)
### Escopo
- [ ] Formulário de abertura com categoria e prioridade.
- [ ] Fila de triagem com SLA alvo por prioridade.
- [ ] Vínculo do ticket com `orderId` quando aplicável.

### Critérios de aceite
- [ ] Ticket abre com dados mínimos e identificador único.
- [ ] Triagem define categoria e próximo responsável.
- [ ] Ticket sem contexto crítico (pedido/pagamento) é bloqueado com orientação de preenchimento.

## Fase B: Execução e escalonamento
### Escopo
- [ ] Fluxo de resposta com histórico cronológico.
- [ ] Escalonamento interno para domínio responsável.
- [ ] Sinalização de bloqueio (`waiting_customer` / `waiting_internal`).

### Critérios de aceite
- [ ] Escalonamento preserva contexto completo da conversa.
- [ ] Mudança de responsável não perde ownership.
- [ ] Ticket crítico gera alerta operacional.

## Fase C: Resolução e encerramento
### Escopo
- [ ] Encerramento com `resolutionSummary` e categoria final.
- [ ] Confirmação de resolução pelo cliente (quando aplicável).
- [ ] Reabertura controlada com motivo.

### Critérios de aceite
- [ ] Ticket resolvido sem summary é bloqueado.
- [ ] Reabertura mantém histórico íntegro.
- [ ] Métricas de tempo e resolução são atualizadas no fechamento.

## Fase D: Base de conhecimento e prevenção
### Escopo
- [ ] Converter tickets recorrentes em FAQ/KB.
- [ ] Classificar causa raiz por domínio.
- [ ] Mapear ações preventivas por tipo de ocorrência.

### Critérios de aceite
- [ ] Top 10 motivos de contato mapeados mensalmente.
- [ ] Pelo menos 1 ação preventiva por causa raiz recorrente.
- [ ] Redução progressiva de tickets repetidos por tema.

## Contratos minimos de dados
Ticket deve possuir, no mínimo:
- [ ] `ticketId`
- [ ] `customerId`
- [ ] `orderId` (quando aplicável)
- [ ] `category`
- [ ] `priority`
- [ ] `status`
- [ ] `ownerRole`
- [ ] `messages[]`
- [ ] `resolutionSummary` (obrigatório em `resolved/closed`)
- [ ] `createdAt`, `updatedAt`, `closedAt`

## SLA e prioridade
Prioridades sugeridas:
- `P1`: impacto financeiro ou bloqueio total de compra
- `P2`: atraso logístico relevante ou erro de status
- `P3`: dúvida operacional sem bloqueio

Metas mínimas iniciais:
- [ ] Tempo de primeira resposta por prioridade definido e monitorado.
- [ ] Tempo de resolução medido por categoria.

## Observabilidade obrigatoria
- [ ] Eventos mínimos:
  - `ticket_opened`
  - `ticket_triaged`
  - `ticket_escalated`
  - `ticket_resolved`
  - `ticket_reopened`
  - `ticket_closed`
- [ ] Correlação por `ticketId`, `orderId` e `paymentId` (quando houver).

## Testes obrigatorios
- [ ] Unit: transições válidas/inválidas de ticket.
- [ ] Integração: abertura -> triagem -> escalonamento -> resolução.
- [ ] E2E: ticket com vínculo de pedido e ticket sem vínculo.

## Segurança e governança
- [ ] RBAC aplicado por ação (ver/editar/encerrar/escalar).
- [ ] Ação crítica com `AuditLog` obrigatório.
- [ ] Dados sensíveis mascarados em mensagens e logs.

## Critério de pronto (go-live parcial)
- [ ] 30 tickets simulados processados em staging sem perda de contexto.
- [ ] 100% dos tickets fechados com `resolutionSummary`.
- [ ] Escalonamento entre domínios sem quebra de ownership em auditoria amostral.

## Referencias
- `docs/ROLES_MATRIX.md`
- `docs/MVP_ROADMAP.md`
- `docs/ROUTE_DEFINITION_OF_DONE.md`
- `docs/PAYMENTS_DEFINITION_OF_DONE.md`
- `docs/ORDERS_LOGISTICS_DEFINITION_OF_DONE.md`
- `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`
