# Document Classification (Normativo x Referencial)

Data de revisao: 2026-07-28

## Objetivo
Eliminar ambiguidade documental, deixando explicito:
- o que governa a execucao atual
- o que serve como snapshot ou navegacao
- o que existe apenas como ponte para contexto legado

## Regras
- `normativo de execucao`: define frente ativa, ordem de retomada, precedencia de fase, gate ou regra operacional viva. Em caso de conflito, prevalece.
- `referencial ativo`: precisa ser lido para contexto, snapshot, localizacao ou historico recente, mas nao autoriza mudanca sozinho.
- `redirecionador legado`: permanece em `docs/` apenas para apontar explicitamente a fonte atual correta e evitar consulta em arquivo superado.
- `arquivo morto`: vive em `docs/archive/` e nao participa da camada ativa de decisao.
- `.tmp-store/**` e runtime local descartavel. Seus JSON, SQLite, logs e saidas de scripts nao sao documentos de autoridade e nao podem definir frente ativa, bloqueio, objetivo ou ordem de retomada.
- `active-agent-plan.json` e `agent-route.json`, quando gerados em `.tmp-store/`, sao apenas caches derivados. Eles podem ser recriados por comando explicito, mas nunca prevalecem sobre `ACTIVE_FRONT`, `NEXT_SESSION_TRIGGER` ou `session-state`.

## Hierarquia pratica de autoridade
1. `docs/ACTIVE_FRONT.md`
2. `docs/NEXT_SESSION_TRIGGER.md`
3. `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`
4. `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
5. documento de dominio ou readiness correspondente
6. `docs/EXECUTION_TRACKING.md` como snapshot ativo e evidencia recente, nunca como autorizacao isolada
7. documentos de navegacao e governanca referencial

Leitura correta:
- esta lista define quem prevalece em caso de conflito
- ela nao substitui a ordem de consulta operacional de `docs/README_DOCS_HIERARCHY.md` e `docs/NEXT_SESSION_TRIGGER.md`

## Classificacao oficial

### Normativos de execucao
- `docs/ACTIVE_FRONT.md`
- `docs/NEXT_SESSION_TRIGGER.md`
- `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
- `docs/FASE_1_VENDA_DE_PRODUTO.md`
- `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md`
- `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`
- `docs/FRONTEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`
- `docs/BACKEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`
- `docs/PHASE_HANDOFF_FASE_2_PARA_FASE_3.md`
- `docs/FASE_3_CATALOGO_ESCALAVEL_ARTE_CURADORIA_E_COMPOSICAO_CONTROLADA.md`
- `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md`
- `docs/FOLHA_OPERACIONAL_HOMOLOGACAO_GATEWAY_REAL.md`
- `docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md`
- `docs/GO_LIVE_E2E_PROOF_RUNBOOK.md`
- `docs/PAYMENTS_DEFINITION_OF_DONE.md`
- `docs/ORDERS_LOGISTICS_DEFINITION_OF_DONE.md`
- `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`
- `docs/SUPPORT_TICKETS_DEFINITION_OF_DONE.md`
- `docs/ROLES_MATRIX.md`
- `docs/ROUTE_DEFINITION_OF_DONE.md`
- `docs/STATE_MACHINES.md`
- `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md`

### Referenciais ativos
- `CONTRIBUTING.md` como entrada de trabalho humano; nao autoriza mudanca sozinho e deve redirecionar para documentos normativos.
- `docs/EXECUTION_TRACKING.md`
- `docs/AI_AGENTS_ROUTING_MATRIX.md`
- `docs/README_DOCS_HIERARCHY.md`
- `docs/EXECUTION_CONSOLIDATED_MASTER.md` como crosswalk consolidado e ponte de leitura; nao usar para definir precedencia nem para resolver conflito
- `docs/EXECUTION_OPERATING_TEMPLATE.md`
- `docs/GOVERNANCE_COBIT_ITIL_BASELINE.md`
- `docs/CODEBASE_MAP.md`
- `docs/ARCHITECTURE.md`
- `docs/API_CONTRACTS.md`
- `docs/JOURNEY_MATRIX_BY_ROLE.md`
- `docs/USER_360_ROLE_ALIGNMENT.md`
- `docs/REGISTRATION_MATRIX_BY_ROLE.md`
- `docs/SENSITIVE_FIELDS_MATRIX.md`
- `docs/WORKFLOW_RBAC_ACCESS_MATRIX.md`
- `docs/CHANGELOG_GOVERNANCE.md`
- `docs/MVP_ROADMAP.md`
- `docs/PAYMENTS_MULTI_GATEWAY_SETUP.md`
- `docs/P3_ENV_READY_TO_FILL.md`
- `docs/P3_HOMOLOG_CUTOVER_EVIDENCE_TEMPLATE.md`
- `docs/CHECKLIST_RELEASE_PAGAMENTOS.md`

### Redirecionadores legados
- nenhum redirecionador legado permanece na camada ativa; os stubs historicos relevantes foram movidos para `docs/archive/`

### Arquivo morto
- `docs/archive/**`
- `docs/archive/EXECUTION_STATUS_MATRIX.md`
- `docs/archive/P0_EVIDENCE_LOG.md`
- `docs/archive/FRONTEND_PR_CHECKLIST.md`
- `docs/archive/FASE_2_1_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md`

## Regras anti-dupla autoridade
- `docs/ACTIVE_FRONT.md` define a frente serial ativa.
- `docs/NEXT_SESSION_TRIGGER.md` define a ordem obrigatoria de retomada.
- `.agents/session-state.json` e espelho operacional da frente documental: serve para continuidade estruturada, mas nao vence `ACTIVE_FRONT.md` quando houver divergencia.
- Nenhum arquivo em `.tmp-store/**` participa da resolucao de conflito documental ou da escolha da frente ativa.
- `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md` define a continuidade macro e o plano executavel consolidado.
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` define maturidade real do runtime.
- `docs/EXECUTION_TRACKING.md` registra snapshot e evidencia recente, mas nao autoriza mudanca sozinho.
- `docs/README_DOCS_HIERARCHY.md` orienta navegacao e `docs/EXECUTION_CONSOLIDATED_MASTER.md` funciona como crosswalk amplo, mas nenhum dos dois pode disputar frente ativa, serializacao ou autoridade com os docs acima.

## Gate de mudanca de classificacao
Para mudar um documento entre categorias:
- [ ] atualizar este arquivo
- [ ] atualizar `docs/README_DOCS_HIERARCHY.md` se a ordem de consulta mudar
- [ ] atualizar `docs/EXECUTION_CONSOLIDATED_MASTER.md` se o crosswalk amplo precisar refletir nova fonte de dominio
- [ ] registrar decisao em `docs/CHANGELOG_GOVERNANCE.md`
