# Docs Hierarchy (Fonte Unica de Navegacao)

Data de revisao: 2026-05-21

## Objetivo
Evitar retrabalho, duplicidade e conflito de interpretação sobre qual documento usar em cada decisão de produto, engenharia e operação.

## Ordem de consulta (obrigatoria)
1. `docs/EXECUTION_CONSOLIDATED_MASTER.md`
2. `docs/EXECUTION_OPERATING_TEMPLATE.md`
3. Documento de domínio específico
4. `docs/CODEBASE_MAP.md` (localizacao tecnica no codigo)
5. `docs/MVP_ROADMAP.md`
6. `docs/ROUTE_DEFINITION_OF_DONE.md`
7. `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md`
8. `docs/GOVERNANCE_COBIT_ITIL_BASELINE.md`
9. `docs/CHANGELOG_GOVERNANCE.md`
10. `docs/DOCS_UNIFICATION_PLAN.md` (quando houver decisão de consolidar documentos)
11. `docs/EXECUTION_TRACKING.md` (planejamento e execucao semanal por dominio)

## Qual documento usar por tipo de decisão

### Governança e conflito documental
- Usar: `docs/EXECUTION_CONSOLIDATED_MASTER.md`
- Quando: houver dúvida de precedência, conflito entre docs ou criação de novo documento.

### Localizacao tecnica no codigo
- Usar: `docs/CODEBASE_MAP.md`
- Quando: precisar localizar rapidamente endpoint, servico, store, componente ou script de QA por dominio.

### Sequenciamento por fase (produto/execução)
- Usar: `docs/MVP_ROADMAP.md`
- Quando: decidir o que entra agora vs depois.

### Pagamentos
- Usar: `docs/PAYMENTS_DEFINITION_OF_DONE.md`
- Quando: alterar checkout, webhook, status de pagamento, idempotência ou segurança de pagamento.

### Pedidos e logística
- Usar: `docs/ORDERS_LOGISTICS_DEFINITION_OF_DONE.md`
- Quando: alterar estados de pedido, produção, envio, tracking e exceções.

### Catálogo e curadoria
- Usar: `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`
- Quando: alterar submissão de arte, revisão, publicação e qualidade de catálogo.

### Suporte e tickets
- Usar: `docs/SUPPORT_TICKETS_DEFINITION_OF_DONE.md`
- Quando: alterar intake, triagem, escalonamento, resolução e SLA.

### Permissões e escopo de acesso
- Usar: `docs/ROLES_MATRIX.md`
- Quando: alterar RBAC, escopos de leitura/escrita, aprovações e auditoria de ações críticas.
- Usar em conjunto: `docs/REGISTRATION_MATRIX_BY_ROLE.md`
- Quando: alterar campos de cadastro por papel, responsabilidade operacional e fluxo `editar != publicar`.
- Usar em conjunto: `docs/USER_360_ROLE_ALIGNMENT.md`
- Quando: reconciliar diferenças entre papel de dominio, sessao/runtime, rotas e contratos antes de evolucao.
- Usar em conjunto: `docs/SENSITIVE_FIELDS_MATRIX.md`
- Quando: alterar campo sensivel em catalogo, payout, campanha, frete, comissao ou regra financeira.

### Qualidade por rota e UX
- Usar: `docs/ROUTE_DEFINITION_OF_DONE.md`
- Quando: validar completude de rota e qualidade de experiência por página.

### Template obrigatório de PR crítico
- Usar: `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md`
- Quando: PR tocar estado, contrato, permissão, fluxo operacional ou regra de domínio.

### Baseline de controle (COBIT/ITIL)
- Usar: `docs/GOVERNANCE_COBIT_ITIL_BASELINE.md`
- Quando: classificar mudança, incidente, risco, problema, rollback e melhoria contínua.

### Histórico de decisão
- Usar: `docs/CHANGELOG_GOVERNANCE.md`
- Quando: registrar decisão aprovada, impacto, risco e rollback.

## Regra para criação de novo documento
Criar novo documento apenas se:
- [ ] O conteúdo não couber em nenhum documento de domínio já existente.
- [ ] Houver owner explícito do novo documento.
- [ ] Houver impacto recorrente (não pontual) no projeto.
- [ ] O novo documento for referenciado no `EXECUTION_CONSOLIDATED_MASTER.md`.

Se não atender os 4 critérios, atualizar documento existente.

## Regra de atualização (anti-retrabalho)
- Toda mudança de estado canônico deve atualizar primeiro o documento de domínio.
- Toda mudança de contrato deve registrar compatibilidade/migration.
- Toda decisão relevante deve entrar no `CHANGELOG_GOVERNANCE.md`.
- Todo PR crítico deve citar o documento fonte e usar template de governança.
- Toda mudanca estrutural no codigo (API/servico/store/componente critico) deve atualizar `docs/CODEBASE_MAP.md`.

## Sinais de alerta (erro de processo)
Se qualquer item abaixo acontecer, pausar implementação e corrigir documentação:
- Dois documentos definindo o mesmo estado com nomes diferentes.
- PR sem documento fonte declarado.
- Mudança de API sem plano de compatibilidade.
- Regra de permissão definida só no frontend.

## Resultado esperado
- Menos retrabalho por interpretação.
- Menos bug de fluxo por estado divergente.
- Menos regressão por mudança não auditada.
- Maior velocidade de evolução com disciplina de execução.

Classificacao normativo/referencial: docs/DOCS_CLASSIFICATION.md
