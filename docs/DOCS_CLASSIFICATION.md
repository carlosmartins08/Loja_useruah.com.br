# Document Classification (Normativo x Referencial)

Data de revisao: 2026-05-21

## Objetivo
Eliminar ambiguidade de uso documental, classificando cada arquivo como fonte de verdade (`normativo`) ou material de contexto (`referencial`).

## Regras
- `normativo`: define regra executável de produto/engenharia/operação. Em caso de conflito, prevalece.
- `referencial`: apoia entendimento e contexto. Não pode sobrescrever documento normativo.
- Todo documento novo entra como `referencial` por padrão até revisão de governança.

## Classificação oficial (docs atuais)

### Normativos
- `docs/EXECUTION_CONSOLIDATED_MASTER.md`
- `docs/README_DOCS_HIERARCHY.md`
- `docs/EXECUTION_OPERATING_TEMPLATE.md`
- `docs/GOVERNANCE_COBIT_ITIL_BASELINE.md`
- `docs/MVP_ROADMAP.md`
- `docs/ROLES_MATRIX.md`
- `docs/ROUTE_DEFINITION_OF_DONE.md`
- `docs/PAYMENTS_DEFINITION_OF_DONE.md`
- `docs/ORDERS_LOGISTICS_DEFINITION_OF_DONE.md`
- `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`
- `docs/SUPPORT_TICKETS_DEFINITION_OF_DONE.md`
- `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md`

### Referenciais
- `docs/CHANGELOG_GOVERNANCE.md` (histórico de decisão; não define regra primária)

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
