# Governance Baseline (COBIT + ITIL)

Data de revisao: 2026-05-21

## Objetivo
Aplicar governanca pratica para reduzir retrabalho, mudanca sem controle e perda de rastreabilidade.

## Escopo
- Mudancas de codigo, contrato, estado, permissao e operacao.
- Fluxos criticos: orders, payments, webhooks, production, payouts, refunds, chargebacks, checkout, PDP, RBAC, AuditLog, idempotencia.

## Mapeamento objetivo (o que adotar no projeto)

### COBIT (controles de governanca)
- EDM03 (otimizacao de risco): gate de risco obrigatorio no PR critico.
- APO12 (gestao de risco): classificacao de risco por impacto/probabilidade no template de PR.
- BAI06 (gestao de mudanca): toda mudanca critica com plano de rollback e criterio de backout.
- DSS02 (incidente): incidente exige registro, impacto, workaround e dono.
- DSS03 (problema): recorrencia exige RCA e acao preventiva.
- MEA01 (monitoramento): evidencias P0 e reconciliacao docs x codigo em rotina semanal.

### ITIL (praticas operacionais)
- Change Enablement: normal, padrao e emergencial com gate claro.
- Incident Management: resposta rapida e restauracao de servico.
- Problem Management: causa raiz e prevencao de recorrencia.
- Service Validation and Testing: P0 aplicavel bloqueia merge/release quando falha.
- Knowledge Management: decisoes e excecoes registradas em changelog oficial.

## Politica minima obrigatoria
1. Nenhum PR critico sem classificacao de tipo de mudanca (`standard|normal|emergency`).
2. Nenhum PR critico sem risco declarado e plano de rollback.
3. Mudanca emergencial exige registro de incidente e follow-up de RCA.
4. Falha P0 aplicavel bloqueia merge/release.
5. Divergencia doc x codigo deve ser corrigida no mesmo ciclo.

## Artefatos oficiais do baseline
- Template de PR unico: `docs/PR_TEMPLATE_EXECUTION_GOVERNANCE.md`
- Consolidado de regras: `docs/EXECUTION_CONSOLIDATED_MASTER.md`
- Execucao semanal: `docs/EXECUTION_OPERATING_TEMPLATE.md`
- Decisoes e excecoes: `docs/CHANGELOG_GOVERNANCE.md`

## Indicadores minimos (mensal)
- Taxa de PR reaberto por falta de criterio de mudanca.
- Numero de hotfix emergencial por dominio.
- Incidentes recorrentes sem RCA fechado.
- Divergencias docs x codigo encontradas por ciclo.
- Lead time de mudanca por tipo (`standard|normal|emergency`).
