# Runbook Go-Live (D-7 a D+2)

Data de revisao: 2026-05-21  
Status: ativo  
Objetivo: colocar o projeto em producao comercial com controle de risco operacional e financeiro.

## Regras de bloqueio
- `CRIT-PAY-REAL-001` deve estar resolvido antes de venda real.
- `CRIT-PAY-REAL-002` deve estar resolvido antes de venda real.
- Sem esses dois itens, pode haver vitrine/pre-lancamento, mas sem captura financeira real.
- Sem `docs/EXECUTION_TRACKING.md` atualizado com status + evidencias P0, release bloqueado.
- Sem plano de rollback testado (<30 min), release bloqueado.

## Quadro de Status (preencher diariamente)
| Etapa | Dono | Status (`TODO`/`DOING`/`DONE`/`BLOCKED`) | Evidencia |
| --- | --- | --- | --- |
| Gateway real homologado | Produto + Financeiro + Engenharia | TODO | |
| Persistencia final gerenciada validada | Engenharia | TODO | |
| Recipients reais aprovados | Operacoes + Financeiro | TODO | |
| Segredos e variaveis de producao travados | Engenharia | TODO | |
| Cutover runbook executado em ambiente espelho | Engenharia | TODO | |
| Gates QA obrigatorios em PASS | Engenharia + QA | TODO | |
| Rollback testado (<30 min) | Engenharia | TODO | |
| Simulacao de incidentes criticos | Engenharia + Suporte | TODO | |
| Go/No-Go aprovado | Lideranca + Engenharia + Financeiro | TODO | |
| Go-live com monitoramento ativo | Engenharia | TODO | |
| Conciliacao D+1 e D+2 sem divergencia critica | Financeiro + Engenharia | TODO | |

## D-7 a D-5 (pre-corte tecnico)
1. Definir provedor oficial real de pagamento.
- Dono: Produto + Financeiro + Engenharia
- Aceite:
  - conta de producao criada
  - credenciais emitidas
  - URL de webhook de producao definida
  - regra de split confirmada

2. Fechar persistencia final em ambiente gerenciado.
- Dono: Engenharia
- Aceite:
  - banco final provisionado
  - backup e restore testados
  - politicas de acesso revisadas

3. Cadastrar e validar recipients reais.
- Dono: Operacoes + Financeiro
- Aceite:
  - recebedores `platform`, `supplier`, `artist` mapeados
  - status aprovado quando aplicavel

4. Congelar segredos e variaveis de producao.
- Dono: Engenharia
- Aceite:
  - variaveis obrigatorias revisadas
  - sem segredo em codigo ou log
  - plano de rotacao definido

## D-4 a D-2 (homologacao espelho de producao)
1. Executar cutover tecnico em ambiente espelho.
- Dono: Engenharia
- Aceite:
  - `checkout -> webhook -> split -> license_event` validado ponta a ponta
  - reconciliacao por `providerReference` validada

2. Rodar gates obrigatorios.
- Dono: Engenharia + QA
- Atalho automatizado (preflight completo):
  - dry-run: `npm run go:preflight`
  - execucao: `npm run go:preflight:run`
- Comandos:
  - `npm run qa:providers:ready`
  - smoke dedicado do provider escolhido (`qa:inter:smoke|qa:infinitepay:smoke|qa:mercadopago:smoke|qa:pagarme:smoke|qa:cielo:smoke|qa:stripe:smoke`)
  - `npm run alert:critical`
  - `npm run check`
  - `npm run qa:payments21`
  - `npm run qa:exceptions`
  - `npm run qa:coreops`
  - `npm run qa:full`
- Aceite:
  - todos em PASS

3. Testar rollback operacional.
- Dono: Engenharia
- Aceite:
  - retorno ao modo seguro executavel em ate 30 minutos
  - passo a passo documentado

4. Simular incidentes de alto risco.
- Dono: Engenharia + Suporte
- Casos minimos:
  - webhook duplicado
  - `payment_not_found`
  - cancelamento em estado invalido
  - refund approve/reject
  - chargeback duplicado
- Aceite:
  - resposta operacional definida por caso

## D-1 (Go/No-Go)
1. Reuniao final de liberacao.
- Dono: Lideranca do projeto
- Aceite:
  - sem bloqueadores criticos
  - sem regressao critica aberta
  - evidencias atualizadas em docs

2. Congelamento de mudanca critica.
- Dono: Engenharia
- Aceite:
  - somente hotfix com aprovacao explicita

## D0 (Go-Live)
1. Publicar com monitoramento ativo.
- Dono: Engenharia
- Aceite:
  - observacao continua de webhooks, erros e status de pedidos

2. Ramp-up de vendas em ondas.
- Dono: Produto
- Aceite:
  - liberar volume gradualmente
  - aumentar somente apos estabilidade

## D+1 e D+2 (estabilizacao)
1. Conciliacao financeira diaria.
- Dono: Financeiro + Engenharia
- Aceite:
  - pedidos, pagamentos, splits e licencas sem divergencia critica

2. Revisao de incidentes e backlog.
- Dono: Engenharia + Suporte
- Aceite:
  - pendencias classificadas por impacto
  - plano de correcao priorizado

3. Decisao de escala.
- Dono: Lideranca do projeto
- Aceite:
  - escalar trafego ou manter rampa com base em dados dos 2 primeiros dias

## Evidencias obrigatorias
- `docs/EXECUTION_TRACKING.md` atualizado
- `docs/CHANGELOG_GOVERNANCE.md` atualizado
- Referencia operacional: `docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md`

## Gate COBIT/ITIL de liberacao (Go/No-Go)
- [ ] Tipo de mudanca declarado (`standard|normal|emergency`) no PR principal.
- [ ] Risco e rollback documentados no PR principal.
- [ ] `docs/EXECUTION_TRACKING.md` atualizado no mesmo ciclo.
- [ ] Evidencia P0 vinculada ao escopo da release.
- [ ] Se houve `emergency`, RCA aberta em ate 24h.
