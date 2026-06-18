# Document Classification (Normativo x Referencial)

Data de revisao: 2026-06-08

## Objetivo
Eliminar ambiguidade de uso documental, classificando cada arquivo como fonte de verdade (`normativo`) ou material de contexto (`referencial`).

## Regras
- `normativo`: define regra executavel de produto, realidade implementada, gate operacional ou operacao ativa. Em caso de conflito, prevalece.
- `referencial`: apoia entendimento e contexto atual. Nao pode sobrescrever documento normativo.
- `redirecionador legado`: permanece em `docs/` apenas para apontar explicitamente a fonte atual correta e evitar consulta em arquivo superado.
- `arquivo morto`: deve viver em `docs/archive/` e nao participa da camada ativa de decisao.
- Todo documento novo entra como `referencial` por padrao ate revisao de governanca.

## Hierarquia pratica
- Documento de fase define escopo e corte.
- Matriz de implementação define realidade e maturidade do runtime.
- Runbook e folha operacional definem execução e readiness do ciclo ativo.
- Changelog preserva histórico; não redefine regra primária.

## Classificação oficial (docs atuais)

### Normativos
- `docs/EXECUTION_CONSOLIDATED_MASTER.md`
- `docs/README_DOCS_HIERARCHY.md`
- `docs/EXECUTION_OPERATING_TEMPLATE.md`
- `docs/GOVERNANCE_COBIT_ITIL_BASELINE.md`
- `docs/MVP_ROADMAP.md`
- `docs/FASE_1_VENDA_DE_PRODUTO.md`
- `docs/FRONTEND_FASE_1_VENDA_DE_PRODUTO.md`
- `docs/FASE_1_MATRIZ_EXECUCAO.md`
- `docs/FASE_1_FREEZE_CHECKLIST.md`
- `docs/FASE_1_GO_NO_GO_CHECKLIST.md`
- `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md`
- `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`
- `docs/FRONTEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`
- `docs/BACKEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`
- `docs/PHASE_HANDOFF_FASE_2_PARA_FASE_3.md`
- `docs/FASE_3_CATALOGO_ESCALAVEL_ARTE_CURADORIA_E_COMPOSICAO_CONTROLADA.md`
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
- `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md`
- `docs/FOLHA_OPERACIONAL_HOMOLOGACAO_GATEWAY_REAL.md`
- `docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md`
- `docs/ROLES_MATRIX.md`
- `docs/ROUTE_DEFINITION_OF_DONE.md`
- `docs/PAYMENTS_DEFINITION_OF_DONE.md`
- `docs/ORDERS_LOGISTICS_DEFINITION_OF_DONE.md`
- `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`
- `docs/SUPPORT_TICKETS_DEFINITION_OF_DONE.md`
- `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md`

### Referenciais
- `docs/EXECUTION_TRACKING.md` (snapshot ativo de status e evidencias recentes; nao define regra primÃ¡ria)
- `docs/CHANGELOG_GOVERNANCE.md` (histórico de decisão; não define regra primária)
- `docs/FASE_2_1_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md` (ponte de compatibilidade; nao abre fase oficial)
- `docs/PAYMENTS_MULTI_GATEWAY_SETUP.md` (arquitetura e evolucao futura multi-provider; nao e a trilha ativa da Fase 1)

### Redirecionadores legados
- `docs/EXECUTION_STATUS_MATRIX.md` (redireciona para `docs/EXECUTION_TRACKING.md`)

### Arquivo morto
- `docs/archive/**`
- `docs/archive/EXECUTION_TRACKING_HISTORY_2026-06-17.md`

## Documentos citados e não localizados no repositório atual
- `docs/USERUAH_360_ARCHITECTURE.md`
- `docs/FRONT_BACK_FUNCTION_MAP.md`

Tratamento quando forem adicionados:
- Entram como `referencial` por padrão.
- Só viram `normativo` após decisão registrada em `docs/CHANGELOG_GOVERNANCE.md`.

## Gate de mudança de classificação
Para mudar um documento de `referencial` para `normativo`, é obrigatório:
- [ ] Atualizar este arquivo.
- [ ] Atualizar `docs/EXECUTION_CONSOLIDATED_MASTER.md` (fonte única por domínio).
- [ ] Registrar decisão no `docs/CHANGELOG_GOVERNANCE.md`.

## Gate de arquivamento
Para mover documento de `docs/` para `docs/archive/`, e obrigatorio:
- [ ] garantir que ele nao seja fonte normativa nem redirecionador legado ativo
- [ ] atualizar links em `README.md` e `docs/README_DOCS_HIERARCHY.md` quando aplicavel
- [ ] registrar a decisao no `docs/CHANGELOG_GOVERNANCE.md`
