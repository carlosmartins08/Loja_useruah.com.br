# Docs Hierarchy (Fonte Unica de Navegacao)

Data de revisao: 2026-06-21

## Objetivo
Evitar retrabalho, duplicidade e conflito de interpretacao sobre qual documento usar em cada decisao de produto, engenharia e operacao.

## Regra de camada documental
- `docs/`
  - camada ativa de consulta
- `docs/archive/`
  - camada historica sem autoridade atual
- documento em `docs/` com aviso de redirecionamento
  - continua ativo apenas para apontar a fonte certa

## Ordem de consulta obrigatoria para retomada e execucao serial
1. `docs/ACTIVE_FRONT.md`
2. `docs/NEXT_SESSION_TRIGGER.md`
3. `docs/DOCS_CLASSIFICATION.md`
4. `docs/EXECUTION_TRACKING.md`
5. `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`
6. `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
7. documento de fase, readiness ou dominio que autoriza a mudanca
8. `docs/ARCHITECTURE.md`
9. `docs/CODEBASE_MAP.md`
10. `docs/CHANGELOG_GOVERNANCE.md`

Leitura correta:
- esta lista define a sequencia pratica de consulta
- se dois documentos divergirem, prevalece a hierarquia de autoridade definida em `docs/DOCS_CLASSIFICATION.md`

Regra:
- `ACTIVE_FRONT` define a frente ativa
- `NEXT_SESSION_TRIGGER` define a ordem de retomada
- `DOCS_CLASSIFICATION` define a autoridade entre documentos
- `EXECUTION_TRACKING` mostra snapshot e evidencia recente
- `PLANO_MESTRE_CONTINUIDADE_TECNICA` define continuidade macro e plano executavel consolidado
- `PHASE_DOMAIN_IMPLEMENTATION_MATRIX` define maturidade real

## Ordem de consulta para onboarding tecnico
1. `README.md`
2. `docs/ARCHITECTURE.md`
3. `docs/CODEBASE_MAP.md`
4. `docs/README_DOCS_HIERARCHY.md`
5. documento do dominio em que vai atuar

## Qual documento usar por tipo de decisao

### Agentes e continuidade
- Usar: `docs/AI_AGENTS_ROUTING_MATRIX.md`
- Quando: precisar mapear os agentes do projeto para o fluxo real sem quebrar a frente ativa.
- Usar em conjunto: `docs/ACTIVE_FRONT.md` e `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`
- Quando: o objetivo for continuar com a cadeia certa de responsabilidade, sem improviso.

### Consolidado de navegacao
- Usar: `docs/EXECUTION_CONSOLIDATED_MASTER.md`
- Quando: precisar de um crosswalk amplo entre os documentos ativos.
- Regra:
  - nao usar este arquivo para decidir precedencia
  - para conflito documental, usar `docs/DOCS_CLASSIFICATION.md`

### Frente ativa e continuidade
- Usar: `docs/ACTIVE_FRONT.md`
- Quando: precisar saber exatamente qual frente esta aberta e qual passo pode ou nao pode ser executado.
- Usar em conjunto: `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`
- Quando: precisar transformar levantamento em plano de execucao sem abrir documento paralelo.

### Snapshot e prova recente
- Usar: `docs/EXECUTION_TRACKING.md`
- Quando: precisar ver o que foi revalidado recentemente e qual risco residual ainda existe.
- Regra:
  - nao usar este arquivo sozinho para autorizar mudanca

### Governanca e conflito documental
- Usar: `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
- Quando: houver duvida sobre o estado real implementado, parcial, planejado, ausente ou bloqueado.
- Usar em conjunto: `docs/DOCS_CLASSIFICATION.md`
- Quando: houver duvida sobre qual documento e normativo vs apenas referencial.

### Sequenciamento por fase
- Usar: `docs/FASE_1_VENDA_DE_PRODUTO.md`
- Quando: decidir escopo oficial da base comercial atual.
- Usar em conjunto: `docs/PLANO_MESTRE_CONTINUIDADE_TECNICA.md`
- Quando: decidir ordem serial real de continuidade.
- Leitura importante:
  - `docs/MVP_ROADMAP.md` e mapa macro referencial, nao autoridade de execucao serial ativa

### Pagamentos
- Usar: `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md`
- Quando: preparar ou executar a janela real de pagamento.
- Usar em conjunto: `docs/FOLHA_OPERACIONAL_HOMOLOGACAO_GATEWAY_REAL.md`
- Quando: precisar da folha operacional da homolog final.
- Usar em conjunto: `docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md`
- Quando: precisar da sequencia de cutover.
- Leitura importante:
  - `docs/P3_ENV_READY_TO_FILL.md`, `docs/P3_HOMOLOG_CUTOVER_EVIDENCE_TEMPLATE.md` e `docs/CHECKLIST_RELEASE_PAGAMENTOS.md` apoiam a operacao, mas nao redefinem readiness por conta propria

### Catalogo e curadoria
- Usar: `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`
- Quando: alterar submissao de arte, revisao, publicacao e qualidade de catalogo.

### Permissoes e escopo de acesso
- Usar: `docs/ROLES_MATRIX.md`
- Quando: alterar RBAC, escopos de leitura/escrita, aprovacoes e auditoria.
- Usar em conjunto: `docs/REGISTRATION_MATRIX_BY_ROLE.md`
- Quando: alterar campos de cadastro por papel.
- Usar em conjunto: `docs/USER_360_ROLE_ALIGNMENT.md`
- Quando: reconciliar papel de dominio, sessao, rotas e contratos.

### Qualidade por rota e UX
- Usar: `docs/ROUTE_DEFINITION_OF_DONE.md`
- Quando: validar completude de rota e experiencia por pagina.
- Usar em conjunto: `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md`
- Quando: a mudanca tocar layout, copy, navegacao, grid, tokens ou responsividade.

## Regra para criacao de novo documento
Criar novo documento apenas se:
- [ ] o conteudo nao couber em nenhum documento existente
- [ ] houver owner explicito
- [ ] houver impacto recorrente, nao pontual
- [ ] o novo documento entrar no fluxo real de consulta

Se nao atender os 4 criterios, atualizar documento existente.

## Sinais de alerta
Se qualquer item abaixo acontecer, pausar implementacao e corrigir documentacao:
- dois documentos disputando a frente ativa
- dois documentos definindo maturidade diferente para o mesmo dominio
- runbook auxiliar prometendo readiness acima do documento de pre-condicao
- roadmap sendo usado como autorizacao de execucao
- snapshot sendo tratado como regra primaria

Classificacao normativo/referencial: `docs/DOCS_CLASSIFICATION.md`
