# Execution Operating Template (Anti-retrabalho)

Data de revisao: 2026-06-09

## Objetivo
Executar com foco, sem tarefa incompleta, sem conflito entre documentacao e codigo, e sem patch iniciado por impulso.

## Como usar
1. Escolher 1 dominio ativo da semana (WIP 1), conforme `docs/EXECUTION_CONSOLIDATED_MASTER.md`.
2. Classificar a mudanca antes de qualquer patch usando a trava pre-patch abaixo.
3. Planejar ate 10 itens pequenos (cada item com entrega verificavel em 1-2 dias).
4. Executar um item por vez usando o cartao operacional abaixo.
5. Fechar a semana atualizando execution tracking e changelog.

## Regra de Classificacao Pre-Patch
Antes de qualquer patch, o agente deve responder objetivamente.

### 1) Tipo da mudanca
Escolher apenas uma categoria:
- `Fase 1 funcional`
- `Readiness transversal`
- `Fase 2 funcional`
- `Incidente-Correcao`
- `Divida tecnica explicita`
- `Documentacao`
- `Ruido`

### 2) Fonte que autoriza
Indicar a fonte real de autorizacao:
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
- documento de fase
- readiness/precondicao operacional
- handoff entre fases
- tracking como evidencia + bug real
- incidente real de producao/homologacao

Observacao:
- `docs/EXECUTION_TRACKING.md` registra evidencia, mas nao autoriza mudanca sozinho.

### 3) Regra para divida tecnica
So classificar como `Divida tecnica explicita` se houver pelo menos um destes fatores:
- bloqueio real
- regressao real
- simplificacao comprovada com impacto direto
- risco objetivo para producao
- evidencia em teste, log, incidente ou matriz

Caso contrario, classificar como `Ruido`.

### 4) Incidente-Correcao
Usar `Incidente-Correcao` quando a mudanca responder a falha real em homologacao ou producao.

Exigir:
- causa observada
- impacto
- rollback
- teste de contencao
- RCA curto depois da correcao, se aplicavel

### 5) O que NAO sera tocado
Declarar explicitamente os limites do patch.

Exemplos:
- nao alterar checkout
- nao alterar pagamento
- nao alterar auth
- nao abrir Fase 2
- nao mexer em documentacao sem conflito novo

### 6) Criterio de aceite
Definir evidencia objetiva:
- teste
- gate
- log
- veredito
- validacao manual controlada
- ausencia de regressao

### 7) Estado atual da Fase 1
Registrar a ordem correta atual:
1. Execucao da janela real de homologacao final da Fase 1.
2. Correcao objetiva de causa bloqueante encontrada nessa janela.
3. Aceite final de producao somente depois da homologacao final aprovada.
4. Preparacao formal do primeiro recorte pos-Fase 1 somente depois disso.

### 8) Trava
Se o agente nao conseguir preencher tipo, fonte autorizadora, escopo proibido e criterio de aceite, o patch nao deve comecar.

Escopo proibido desta regra:
- nao reescrever matriz
- nao reabrir Fase 1 funcional
- nao alterar readiness ja consolidado
- nao abrir Fase 2
- nao criar nova camada documental longa
- nao transformar essa regra em plano de produto

## Cartao operacional unico (copiar e preencher)

### 1) Classificacao pre-patch
- Tipo da mudanca:
- Fonte que autoriza:
- O que NAO sera tocado:
- Criterio de aceite:

### 2) Escopo
- Titulo:
- Dominio:
- Owner:
- Prazo:
- Problema real:
- Resultado esperado:
- Fora de escopo (obrigatorio):

### 3) Fonte unica (obrigatorio)
- Documento fonte do dominio:
- Trecho/secao usada:
- Estado canonico aplicado:
- Contrato/API afetado:

### 4) Definicao de pronto (obrigatorio)
- [ ] Codigo implementado
- [ ] Criterio de aceite do dominio atendido
- [ ] Teste funcional do fluxo principal passou
- [ ] Teste de erro/edge-case passou
- [ ] Evidencia registrada (print/log)
- [ ] Documentacao sincronizada

### 5) 6 gates de execucao (bloqueia avanco se falhar)
- Gate 1 - Dominio unico: item nao mistura dominios.
- Gate 2 - Estado: transicao respeita a maquina de estados ou a classificacao vigente da matriz.
- Gate 3 - Contrato: entrada/saida e compatibilidade claros.
- Gate 4 - Seguranca: RBAC e AuditLog quando aplicavel.
- Gate 5 - Qualidade: P0 aplicavel do criterio oficial do dominio.
- Gate 6 - Documentacao: docs de fonte + status atualizados.

### 6) Evidencias minimas
- Arquivos alterados:
- Endpoints testados:
- Resultado dos testes:
- Risco residual:
- Plano de rollback:

### 7) Fechamento
- Status final: `IMPLEMENTADO | PARCIAL | PLANEJADO | AUSENTE | NAO PRESUMIR | BLOQUEADO`
- Atualizacoes obrigatorias feitas:
  - [ ] `docs/EXECUTION_TRACKING.md`
  - [ ] documento de dominio
  - [ ] `docs/CHANGELOG_GOVERNANCE.md` (se decisao)

## Ritual semanal fixo
- Segunda: escolher dominio + top 10 itens + classificar `IMPLEMENTADO/PARCIAL/PLANEJADO/AUSENTE/NAO PRESUMIR/BLOQUEADO`.
- Terca a quinta: executar blocos pequenos, 1 PR por bloco, sem PR misto.
- Sexta: reconciliar docs x codigo + atualizar matriz + registrar decisoes.

## Ritual diario (operacao de impacto)
- Rodar `npm run ops:impact:daily`.
- Anexar/consultar `docs/ops/IMPACT_REVIEW_DAILY_SUMMARY.md`.
- Se `Overdue pending (SLA 2h) > 0`, abrir escalacao operacional no mesmo ciclo.
- Horario configuravel pelo responsavel:
  - arquivo: `config/ops-impact-schedule.json`
  - comando de janela: `npm run ops:impact:window`
  - o responsavel pode alterar `runTimes` (ex: `["09:00","14:00","18:00"]`) sem mudar codigo
  - para janelas por papel, definir `ownerRunTimes` no arquivo e executar com `OPS_IMPACT_OWNER` (ex: `OPS_IMPACT_OWNER=finance_admin npm run ops:impact:window`)

## Bloco obrigatorio de reconciliacao (docs x codigo)
Rodar antes de fechar semana:

```powershell
rg --files app/api
rg -n "IMPLEMENTADO|PARCIAL|PLANEJADO|AUSENTE|NAO PRESUMIR|BLOQUEADO" docs/EXECUTION_TRACKING.md
rg -n "getMockProduct|readStoreFile|writeStoreFile|idempotency|webhook|AuditLog" app lib components
```

Se houver conflito entre o que a matriz diz e o que o codigo mostra:
- atualizar `docs/EXECUTION_TRACKING.md` no mesmo ciclo
- registrar decisao em `docs/CHANGELOG_GOVERNANCE.md` se houver mudanca de interpretacao

## Pontas soltas ja detectadas (2026-05-21)
1. `docs/EXECUTION_TRACKING.md` marca pedidos/logistica backend como ausente, mas ja existem APIs de pedido/producao/envio.
2. O mesmo arquivo marca suporte/tickets backend como ausente, mas ja existem endpoints de ticket e contexto de suporte.
3. Persistencia existe hoje por arquivo local (`.tmp-store`), nao por banco relacional; classificacao correta e `PARCIAL`, nao `AUSENTE`.

## Regra de ouro
Se a decisao nao cabe claramente em um dominio, nao tem fonte autorizadora clara ou nao tem criterio de aceite escrito, nao executar.
