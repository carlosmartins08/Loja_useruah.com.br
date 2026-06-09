# Docs Hierarchy (Fonte Unica de Navegacao)

Data de revisao: 2026-06-09

## Objetivo
Evitar retrabalho, duplicidade e conflito de interpretacao sobre qual documento usar em cada decisao de produto, engenharia e operacao.

## Ordem de consulta obrigatoria para mudanca critica
1. `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
2. `docs/EXECUTION_OPERATING_TEMPLATE.md`
3. documento de fase, readiness ou dominio que autoriza a mudanca
4. `docs/ARCHITECTURE.md`
5. `docs/CODEBASE_MAP.md`
6. `docs/CHANGELOG_GOVERNANCE.md`
7. `docs/EXECUTION_TRACKING.md` como evidencia, nunca como autorizacao isolada

## Ordem de consulta para onboarding tecnico
1. `README.md`
2. `docs/ARCHITECTURE.md`
3. `docs/CODEBASE_MAP.md`
4. `docs/README_DOCS_HIERARCHY.md`
5. documento do dominio em que vai atuar

## Qual documento usar por tipo de decisao

### Onboarding tecnico e entendimento da estrutura
- Usar: `README.md`
- Quando: precisar entender rapidamente pastas, comandos e fluxos principais.
- Usar em conjunto: `docs/ARCHITECTURE.md`
- Quando: precisar entender camadas, responsabilidades e limites entre UI, API, dominio e persistencia.
- Usar em conjunto: `docs/CODEBASE_MAP.md`
- Quando: precisar localizar arquivos reais por dominio.

### Governanca e conflito documental
- Usar: `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
- Quando: houver duvida sobre o estado real implementado, parcial, planejado, ausente ou proibido de presumir.
- Usar em conjunto: `docs/EXECUTION_OPERATING_TEMPLATE.md`
- Quando: for classificar a mudanca antes de abrir patch.

### Localizacao tecnica no codigo
- Usar: `docs/CODEBASE_MAP.md`
- Quando: precisar localizar rapidamente endpoint, servico, store, componente ou script de QA por dominio.

### Sequenciamento por fase
- Usar: `docs/MVP_ROADMAP.md`
- Quando: decidir o que entra agora vs depois.
- Usar em conjunto: `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
- Quando: validar se a maturidade descrita na fase ja existe no runtime ou se ainda e apenas parcial.

### Passagem entre fases
- Usar: `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md`
- Quando: a decisao envolver passagem da Fase 1 para a Fase 2.
- Usar: `docs/PHASE_HANDOFF_FASE_2_PARA_FASE_3.md`
- Quando: a decisao envolver passagem da Fase 2 para a Fase 3.

### Fase 3
- Usar: `docs/FASE_3_CATALOGO_ESCALAVEL_ARTE_CURADORIA_E_COMPOSICAO_CONTROLADA.md`
- Quando: definir escopo, restricoes e criterio de corte da Fase 3 realista ao runtime atual.

### Pagamentos
- Usar: `docs/PAYMENTS_DEFINITION_OF_DONE.md`
- Quando: alterar checkout, webhook, status de pagamento, idempotencia ou seguranca de pagamento.
- Usar em conjunto: `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md`
- Quando: preparar ou executar a homologacao final real de pagamento sem reabrir escopo.

### Pedidos e logistica
- Usar: `docs/ORDERS_LOGISTICS_DEFINITION_OF_DONE.md`
- Quando: alterar estados de pedido, producao, envio, tracking e excecoes.

### Catalogo e curadoria
- Usar: `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`
- Quando: alterar submissao de arte, revisao, publicacao e qualidade de catalogo.

### Suporte e tickets
- Usar: `docs/SUPPORT_TICKETS_DEFINITION_OF_DONE.md`
- Quando: alterar intake, triagem, escalonamento, resolucao e SLA.

### Permissoes e escopo de acesso
- Usar: `docs/ROLES_MATRIX.md`
- Quando: alterar RBAC, escopos de leitura/escrita, aprovacoes e auditoria de acoes criticas.
- Usar em conjunto: `docs/REGISTRATION_MATRIX_BY_ROLE.md`
- Quando: alterar campos de cadastro por papel, responsabilidade operacional e fluxo `editar != publicar`.
- Usar em conjunto: `docs/USER_360_ROLE_ALIGNMENT.md`
- Quando: reconciliar diferencas entre papel de dominio, sessao/runtime, rotas e contratos antes de evolucao.
- Usar em conjunto: `docs/SENSITIVE_FIELDS_MATRIX.md`
- Quando: alterar campo sensivel em catalogo, payout, campanha, frete, comissao ou regra financeira.

### Qualidade por rota e UX
- Usar: `docs/ROUTE_DEFINITION_OF_DONE.md`
- Quando: validar completude de rota e qualidade de experiencia por pagina.
- Usar em conjunto: `docs/FRONTEND_SCREEN_REVIEW_CHECKLIST.md`
- Quando: a mudanca tocar layout, componente visual, copy institucional, navegacao, grid, tokens, overlay ou responsividade.

### Template obrigatorio de PR critico
- Usar: `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md`
- Quando: PR tocar estado, contrato, permissao, fluxo operacional ou regra de dominio.

### Baseline de controle
- Usar: `docs/GOVERNANCE_COBIT_ITIL_BASELINE.md`
- Quando: classificar mudanca, incidente, risco, problema, rollback e melhoria continua.

### Historico de decisao
- Usar: `docs/CHANGELOG_GOVERNANCE.md`
- Quando: registrar decisao aprovada, impacto, risco e rollback.

## Regra para criacao de novo documento
Criar novo documento apenas se:
- [ ] o conteudo nao couber em nenhum documento de dominio ja existente
- [ ] houver owner explicito do novo documento
- [ ] houver impacto recorrente e nao pontual
- [ ] o novo documento entrar no fluxo de consulta real

Se nao atender os 4 criterios, atualizar documento existente.

## Regra de atualizacao anti-retrabalho
- toda mudanca que melhore a navegacao tecnica do repositorio deve priorizar:
  - `README.md`
  - `docs/ARCHITECTURE.md`
  - `docs/CODEBASE_MAP.md`
- toda mudanca de estado canonico deve atualizar primeiro o documento de dominio
- toda mudanca de contrato deve registrar compatibilidade ou migration
- toda decisao relevante deve entrar no `docs/CHANGELOG_GOVERNANCE.md`
- toda mudanca estrutural no codigo deve atualizar `docs/CODEBASE_MAP.md`

## Sinais de alerta
Se qualquer item abaixo acontecer, pausar implementacao e corrigir documentacao:
- dois documentos definindo o mesmo estado com nomes diferentes
- PR sem documento fonte declarado
- mudanca de API sem plano de compatibilidade
- regra de permissao definida so no frontend
- mapa de codigo apontando para arquivo removido ou inexistente

## Resultado esperado
- menos retrabalho por interpretacao
- menos bug de fluxo por estado divergente
- menos regressao por mudanca nao auditada
- mais velocidade para onboarding e manutencao

Classificacao normativo/referencial: `docs/DOCS_CLASSIFICATION.md`
