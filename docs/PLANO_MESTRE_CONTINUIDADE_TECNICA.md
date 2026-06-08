# Plano Mestre de Continuidade Tecnica (Anti-Retrabalho)

Data de revisao: 2026-05-23
Owner: Produto + Engenharia

## Objetivo
Manter continuidade de execucao sem perda de contexto, sem duplicidade e sem avanço fora de gate.

## Estado atual consolidado
- P0 Estrutural: `IMPLEMENTADO`
- P1 Confiabilidade QA: `IMPLEMENTADO`
- P2 Front integrado: `PARCIAL`
- P3 Pagamento real Stripe e cutover: `BLOQUEADO`
- P4 Hardening final: `PLANEJADO`

## Sequencia inteligente obrigatoria
1. Fechar P2 com evidencias funcionais ponta a ponta.
2. Iniciar P3 apenas em homologacao Stripe com rollback testado.
3. Executar P4 apenas apos P3 aprovado.

## Backlog executavel por prioridade

### P2 (prioridade alta)
- Validar `account/orders` com pedidos reais em diferentes estados (`placed`, `paid`, `in_production`, `shipped`).
- Validar `admin/production` com fila real e estados divergentes (`queued`, `in_progress`, `issue_reported`).
- Finalizar padrao de cliente HTTP unico nas telas operacionais criticas.
- Evidenciar comparacao API x banco x UI para pedidos e producao.

### P3 (prioridade critica de negocio)
- Formalizar `Stripe` como provider oficial inicial (`PAYMENT_PROVIDER=stripe`) para `card`/`wallet`.
- Rodar `PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md` em homologacao.
- Publicar evidencias de cutover e rollback em ate 30 minutos.
- Fechar reconciliacao por `providerReference` em banco gerenciado.
- Manter `gateway_real` generico como bridge futura `PLANEJADO`, sem reabrir escopo neste ciclo.

### P4 (hardening final)
- Corrigir encoding residual em metadata/UX.
- Eliminar referencia quebrada/duplicidade documental restante.
- Finalizar branding/SEO runtime (`favicon`, `apple-touch-icon`, `og-image`).

## Gates formais de continuidade (COBIT/ITIL)
- Gate de Mudanca (ITIL): nenhuma mudanca critica sem risco, owner e rollback definidos.
- Gate de Validacao (COBIT BAI): nenhuma promocao sem evidencia `check` e QA aplicavel.
- Gate de Operacao (COBIT DSS): incidente em fluxo critico exige RCA em ate 24h.
- Gate de Conhecimento (ITIL): docs e tracking atualizados no mesmo ciclo da mudanca.

## Criterios de bloqueio
- Bloquear P3 se `CRIT-PAY-REAL-001/002` estiverem abertos.
- Bloquear release critica se `npm run check` ou `npm run qa:full` falhar.
- Bloquear merge critico sem atualizacao de `docs/EXECUTION_TRACKING.md`.

## Evidencias minimas por onda
- Comandos executados e status.
- Endpoints/telas validados.
- Contratos sem quebra (referencia `docs/API_CONTRACTS.md`).
- Registro de decisao em `docs/CHANGELOG_GOVERNANCE.md` quando houver excecao.

## Referencias oficiais
- `docs/EXECUTION_TRACKING.md`
- `docs/EXECUTION_CONSOLIDATED_MASTER.md`
- `docs/GOVERNANCE_COBIT_ITIL_BASELINE.md`
- `docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md`
