# Docs Unification Plan (Reducao de Volume sem Perder Controle)

Data de revisao: 2026-05-21

## DiagnÃ³stico honesto
Hoje a base estÃ¡ forte, mas hÃ¡ sobreposiÃ§Ã£o real em checklists e gates. Se continuar crescendo assim, o time vai cumprir documento em vez de cumprir resultado.

## Regra de unificaÃ§Ã£o
Mesclar somente quando:
1. dois docs exigem o mesmo gate;
2. um doc repete regra normativa jÃ¡ definida em outro;
3. o merge nÃ£o remove rastreabilidade de decisÃ£o.

## Proposta objetiva por prioridade

### Prioridade 1 (executar jÃ¡)
1. Mesclar `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md` dentro de `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md`.
- Motivo: ambos sÃ£o gates de PR e hoje geram dupla checagem.
- Resultado: um Ãºnico template de aprovaÃ§Ã£o de PR.
- AÃ§Ã£o pÃ³s-merge: manter `PR_TEMPLATE_EXECUTION_GOVERNANCE.md` como stub curto apontando para o template Ãºnico por 1 ciclo; depois remover.
- Status: `CONCLUIDO em 2026-05-21` (GOV-0018)

2. Consolidar checkpoints semanais em `docs/EXECUTION_OPERATING_TEMPLATE.md`.
- Motivo: parte do que estÃ¡ em `docs/EXECUTION_CONSOLIDATED_MASTER.md` sobre ritual semanal jÃ¡ estÃ¡ operacional aqui.
- Resultado: consolidado vira regra de precedÃªncia e anti-conflito; template vira regra de execuÃ§Ã£o.

### Prioridade 2 (apÃ³s 1 ciclo de uso)
3. Fundir `docs/P0_EVIDENCE_LOG.md` + seÃ§Ã£o de progresso do `docs/EXECUTION_STATUS_MATRIX.md` em uma visÃ£o Ãºnica de execuÃ§Ã£o.
- Nome sugerido: `docs/EXECUTION_TRACKING.md`.
- Motivo: status e evidÃªncia se complementam; separados aumentam divergÃªncia.
- Regra: manter matriz por domÃ­nio + anexo de evidÃªncias no mesmo arquivo.

4. Revisar sobreposiÃ§Ã£o entre `docs/ROUTE_DEFINITION_OF_DONE.md` e partes de UX do `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md` (apÃ³s merge da prioridade 1).
- Motivo: hoje hÃ¡ itens repetidos de acessibilidade, responsividade e CTA.

### Prioridade 3 (nÃ£o mesclar agora)
5. Manter separados os DoDs de domÃ­nio:
- `PAYMENTS_DEFINITION_OF_DONE.md`
- `ORDERS_LOGISTICS_DEFINITION_OF_DONE.md`
- `CATALOG_CURATION_DEFINITION_OF_DONE.md`
- `SUPPORT_TICKETS_DEFINITION_OF_DONE.md`
- Motivo: aqui a separaÃ§Ã£o ajuda foco e ownership.

6. Manter `docs/API_CONTRACTS.md` separado de `docs/STATE_MACHINES.md`.
- Motivo: contrato e estado tÃªm ciclos de mudanÃ§a diferentes.

## Plano de execuÃ§Ã£o da unificaÃ§Ã£o
Semana 1:
- Mesclar checklist frontend no template de PR.
- Ajustar hierarquia de docs e classificaÃ§Ã£o normativa.
- Aplicar baseline de controle `COBIT + ITIL` com mapeamento explÃ­cito de mudanÃ§a, risco, incidente e problema.

Semana 2:
- Executar 1 ciclo real usando o template Ãºnico de PR.
- Medir ruÃ­do: PRs reabertos por falta de checklist.

Semana 3:
- Consolidar status + evidÃªncias em `EXECUTION_TRACKING.md`.

## CritÃ©rio de sucesso
- ReduÃ§Ã£o de pelo menos 25% no nÃºmero de documentos consultados por PR crÃ­tico.
- Nenhuma perda de gate obrigatÃ³rio (estado, contrato, RBAC, audit log, QA P0).
- Queda de retrabalho por divergÃªncia doc x cÃ³digo.

