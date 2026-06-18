# Execution Consolidated Master (Fonte Unica de Governanca)

Data de revisao: 2026-05-21

## Objetivo
Eliminar conflitos e duplicidades entre documentos, definindo fonte única por domínio, estados canônicos e regras de precedência para execução.

## Regra de precedencia documental
1. `docs/FASE_1_VENDA_DE_PRODUTO.md` para tudo que define escopo, objetivo, corte de fase e sequencia de execucao da fase comercial atual.
2. Documento de dominio especifico para regras normativas do dominio.
3. `docs/MVP_ROADMAP.md` como mapa macro de evolucao, sem autoridade para redefinir a Fase 1 oficial.
4. `docs/ROUTE_DEFINITION_OF_DONE.md` (qualidade por rota/interface).
5. `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md` (gate unico de PR).
6. `docs/GOVERNANCE_COBIT_ITIL_BASELINE.md` (baseline de controle e operacao).

Se houver divergencia entre documentos, prevalece a fonte mais alta na lista acima.

## Precedência normativa — Máquinas de Estado
O documento `docs/STATE_MACHINES.md` é a fonte normativa única para estados, transições, bloqueios e eventos de auditoria das entidades operacionais críticas.

Em caso de conflito entre DoDs, checklists, documentação de rota ou qualquer outro documento, prevalece `docs/STATE_MACHINES.md`.

Os demais documentos devem apenas referenciar a máquina de estados aplicável, sem duplicar regras de transição.

## Fonte unica por dominio
- Passagem oficial Fase 1 -> Fase 2: `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md`
- Escopo funcional oficial da Fase 2: `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`
- Frontend oficial da Fase 2: `docs/FRONTEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`
- Backend oficial da Fase 2: `docs/BACKEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`
- Passagem oficial Fase 2 -> Fase 3: `docs/PHASE_HANDOFF_FASE_2_PARA_FASE_3.md`
- Escopo funcional oficial da Fase 3: `docs/FASE_3_CATALOGO_ESCALAVEL_ARTE_CURADORIA_E_COMPOSICAO_CONTROLADA.md`
- Pre-condicao operacional de pagamentos: `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md`
- Folha operacional de homologacao Stripe Fase 1: `docs/FOLHA_OPERACIONAL_HOMOLOGACAO_GATEWAY_REAL.md`
- Pagamentos: `docs/PAYMENTS_DEFINITION_OF_DONE.md`
- Pedidos e logística: `docs/ORDERS_LOGISTICS_DEFINITION_OF_DONE.md`
- Catálogo e curadoria: `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`
- Suporte e tickets: `docs/SUPPORT_TICKETS_DEFINITION_OF_DONE.md`
- Contratos de API críticos: `docs/API_CONTRACTS.md`
- Aceite e validacao QA: `docs/QA_ACCEPTANCE_TESTS.md`
- Permissões (RBAC): `docs/ROLES_MATRIX.md`
- Sequenciamento oficial da fase atual: `docs/FASE_1_VENDA_DE_PRODUTO.md`
- Sequenciamento macro posterior: `docs/MVP_ROADMAP.md`
- Qualidade de rota/UI: `docs/ROUTE_DEFINITION_OF_DONE.md`
- Localizacao tecnica no codigo: `docs/CODEBASE_MAP.md`

## Estados canonicos oficiais
Estados e transições canônicas das entidades operacionais devem seguir `docs/STATE_MACHINES.md`.

## Contratos congelados (fase atual)
Pagamento (Payment Deferred ativo):
- Endpoints:
  - `POST /api/payments/checkout`
  - `GET /api/payments/status/[paymentId]`
  - `POST /api/payments/webhook`
- Campos obrigatórios:
  - `paymentId`, `orderId`, `providerReference`, `status`, `method`, `amount`, `currency`
- Segurança mínima:
  - `x-idempotency-key` em checkout
  - assinatura de webhook conforme provider ativo; no recorte atual, usar `PAYMENT_STRIPE_WEBHOOK_SECRET`

## Anticonflito (obrigatorio)
- Não replicar backlog de domínio dentro de `ROUTE_DEFINITION_OF_DONE.md`.
- Não introduzir novo status sem atualizar explicitamente o documento de domínio correspondente.
- Não alterar contrato de pagamento sem migration formal documentada.
- Todo PR que tocar estados/contratos deve citar seção alterada do documento fonte.
- Toda alteracao estrutural de codigo deve atualizar `docs/CODEBASE_MAP.md` no mesmo PR.

## Checklist de consistencia (antes de merge)
- [ ] PR aponta documento fonte do domínio alterado.
- [ ] Estados e nomes de campo permanecem canônicos.
- [ ] Sem duplicar regra em dois docs diferentes com textos conflitantes.
- [ ] Se houver exceção, decisão registrada com data e owner.

## Owners sugeridos
- RBAC/segurança: `platform_admin` + engenharia backend
- Pagamentos: `finance_admin` + engenharia backend
- Pedidos/logística: `production_operator` + operação
- Catálogo/curadoria: `curator` + produto
- Suporte/tickets: `support_agent` + operação

## Observacao final
Se um requisito novo não se encaixar claramente em um domínio, ele não deve ser implementado até o domínio responsável ser definido neste documento.

## Regra de classificacao entre fase e readiness
- `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md` nao redefine a Fase 2.
- Pagamentos reais, cutover e persistencia financeira sao trilha transversal de readiness.
- A Fase 2 oficial continua sendo `movimentos, campanhas e afiliados`.
- Arquivos com prefixo `P3_` no repositorio atual referem-se ao readiness operacional de pagamentos reais, com `Stripe` como provider inicial da Fase 1, nao a Fase 3 de produto.
- `gateway_real` generico fica rebaixado para bridge futura `PLANEJADO`, sem papel de bloqueio oficial no ciclo atual.
- A reconciliacao entre fase, dominio e runtime deve usar `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` antes de abrir fase nova ou handoff novo.

Template oficial de PR para governança de execução: docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md
Baseline oficial de governança operacional (COBIT + ITIL): docs/GOVERNANCE_COBIT_ITIL_BASELINE.md
Template operacional oficial de execução semanal: docs/EXECUTION_OPERATING_TEMPLATE.md

Registro oficial de decisoes: docs/CHANGELOG_GOVERNANCE.md

Indice de navegacao documental: docs/README_DOCS_HIERARCHY.md

Classificacao oficial de documentos: docs/DOCS_CLASSIFICATION.md

Matriz de status atual (`IMPLEMENTADO/PARCIAL/PLANEJADO/AUSENTE/NAO PRESUMIR/BLOQUEADO`): `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
Snapshot ativo e evidencias recentes: `docs/EXECUTION_TRACKING.md`
Historico detalhado de execucao: `docs/archive/EXECUTION_TRACKING_HISTORY_2026-06-17.md`
Plano mestre de continuidade tecnica: docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md
Checklist oficial de revisao de telas frontend: docs/FRONTEND_SCREEN_REVIEW_CHECKLIST.md

## Sistema anti-perda de execução (obrigatorio)
Objetivo: impedir dispersão, conflito de prioridade e retrabalho por troca de contexto.

### Regra 1: um domínio por vez
- Limite de WIP: apenas 1 domínio ativo por sprint curta.
- Domínio ativo atual deve ser explicitado no início de cada ciclo.
- Itens de outros domínios entram somente como backlog, não como execução paralela.

### Regra 2: sequencia oficial de execucao
1. `docs/FASE_1_VENDA_DE_PRODUTO.md`
2. `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`
3. `docs/ORDERS_LOGISTICS_DEFINITION_OF_DONE.md`
4. `docs/PAYMENTS_DEFINITION_OF_DONE.md`

Motivo: fechar o fluxo mestre vendavel primeiro, depois endurecer os dominios que o sustentam.

### Regra 3: ritual semanal fixo
Segunda (planejamento):
- Escolher domínio da semana.
- Selecionar no máximo 10 itens do domínio.
- Classificar cada item em `IMPLEMENTADO`, `PARCIAL`, `PLANEJADO`, `AUSENTE`, `NAO PRESUMIR` ou `BLOQUEADO`.
- Priorizar execução em `PARCIAL` antes de `PLANEJADO` e `AUSENTE`.

Terça a quinta (execução):
- Entregar em blocos pequenos (1 PR por bloco funcional).
- Proibido misturar domínio no mesmo PR.
- Toda mudança sensível deve referenciar documento-fonte de domínio.

Sexta (fechamento):
- Atualizar `docs/EXECUTION_TRACKING.md` com snapshot e evidencias recentes.
- Atualizar dominio executado com progresso real na fonte normativa correspondente.
- Registrar decisões e exceções em `docs/CHANGELOG_GOVERNANCE.md`.

### Regra 4: definição de pronto por bloco
- Código implementado.
- Critério de aceite do domínio marcado.
- Evidência mínima de teste (unit/integration/e2e conforme domínio).
- Documentação sincronizada (domínio + status matrix + changelog quando houver decisão).

### Regra 5: gatilhos de bloqueio (não executar)
- Requisito sem domínio definido.
- Mudança de status/contrato sem atualização do documento fonte.
- PR com escopo misto entre domínios.

## Gate mínimo de PR/Release para fluxos críticos
Mudanças nos seguintes domínios exigem validação dos testes P0 aplicáveis em `docs/QA_ACCEPTANCE_TESTS.md`:

- orders
- payments
- webhooks
- production
- payouts
- refunds
- chargebacks
- checkout
- PDP
- RBAC
- AuditLog
- idempotência

### Regras
1. PR com alteração em fluxo crítico não pode ser aprovado com teste P0 aplicável pendente.
2. Caso P0 seja considerado não aplicável, a justificativa deve ser objetiva e registrada no PR.
3. Alterações em checkout, pagamento, webhook, produção ou financeiro exigem evidência mínima anexada.
4. Falha em teste P0 bloqueia merge/release.
5. Correções emergenciais podem seguir com exceção apenas se houver registro explícito do risco, responsável e plano de correção.
6. Release sem `docs/EXECUTION_TRACKING.md` atualizado no ciclo e sem documento de dominio coerente é bloqueado.
7. Mudanca `emergency` exige RCA registrada em ate 24h.
