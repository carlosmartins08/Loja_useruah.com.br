# Precondicao Operacional - Pagamento Real e Persistencia Financeira

Data de revisao: 2026-06-05

## Objetivo
Definir a trilha transversal de readiness que prepara pagamento real, persistencia financeira e cutover operacional sem redefinir a fase oficial de produto.

## Regra de precedencia
- `docs/FASE_1_VENDA_DE_PRODUTO.md` continua mandando na Fase 1.
- `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md` continua mandando na passagem oficial da Fase 1 para a Fase 2.
- `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md` continua mandando no escopo funcional da Fase 2.
- `docs/PAYMENTS_DEFINITION_OF_DONE.md` continua sendo a fonte normativa do dominio de pagamentos.
- Este documento nao abre uma fase paralela. Ele define apenas a pre-condicao operacional de pagamentos para sustentar a evolucao oficial.

## Classificacao
- Tipo: `readiness transversal`
- Dominio: `pagamento real e persistencia financeira`
- Veredito atual: `READY CONDICIONADO`

`READY CONDICIONADO` significa:
- discovery, especificacao e preparacao tecnica podem seguir agora
- implementacao e cutover so podem avancar apos rerodar os gates do freeze da Fase 1 no ciclo atual

## Problema que resolve
A Fase 1 provou venda local/homologada controlada, mas ainda nao fecha o risco de operacao real porque pagamento, webhook e conciliacao dependem de homologacao final do provider e evidencias formais de cutover.

## Papel desta trilha
Esta trilha:
- prepara o dominio de pagamentos para operacao real
- reduz risco de go-live
- fortalece a base que sera reutilizada pela Fase 2 oficial

Esta trilha nao:
- substitui a Fase 2 oficial
- altera a sequencia `Fase 1 -> handoff -> Fase 2`
- autoriza abrir comunidade, campanha ou afiliacao sem a documentacao propria desses dominios

## Ator ativo novo
Novo papel ativo desta trilha:
- `finance_admin`

O que pode fazer:
- configurar e validar conectores de pagamento
- acompanhar conciliacao por `providerReference`
- operar evidencias de cutover e rollback com backend

O que ainda nao pode fazer:
- alterar contrato publico de checkout
- redefinir estados canonicos de `payment` ou `order`
- contaminar a navegacao principal da Fase 1

## O que entra
- homologacao de `PAYMENT_PROVIDER=gateway_real`
- validacao de segredos e requisitos por ambiente
- persistencia financeira reproduzivel em banco alvo
- reconciliacao por `providerReference`
- validacao de webhook real com assinatura
- observabilidade minima de pagamento
- runbook executavel de cutover e rollback
- superficies operacionais internas estritamente necessarias para o dominio

## O que fica fora
- redesenho de checkout
- novas jornadas publicas para cliente
- mudanca de semantica de `/account` ou `/admin`
- expansao de catalogo, curadoria, comunidade, campanhas ou payouts como frente primaria
- qualquer mudanca que reabra ownership, rastreio, suporte basico ou RBAC da Fase 1

## Regra de nao-regressao da Fase 1
Esta trilha nao pode alterar:
- loja publica
- `/shop`, `/product/[id]`, `/cart`, `/checkout`
- ownership do pedido
- status/rastreio do pedido para o cliente
- suporte basico
- RBAC entre `customer` e `admin_master`
- contrato publico:
  - `POST /api/payments/checkout`
  - `GET /api/payments/status/[paymentId]`
  - `POST /api/payments/webhook`

## Superficies permitidas
Superficies internas:
- `/admin/payments/connectors`
- `POST /api/admin/payment-connectors`
- `POST /api/admin/payment-connectors/test`

Rotas publicas congeladas, com evolucao apenas interna:
- `POST /api/payments/checkout`
- `GET /api/payments/status/[paymentId]`
- `POST /api/payments/webhook`

## Estados e contratos
Estados canonicos:
- continuam obrigatoriamente em `docs/STATE_MACHINES.md`

Contratos congelados:
- `paymentId`
- `orderId`
- `providerReference`
- `status`
- `method`
- `amount`
- `currency`

Compatibilidade obrigatoria:
- `x-idempotency-key` continua obrigatorio no checkout
- `x-signature` continua obrigatorio no webhook quando houver segredo configurado

## Criterio de aceite
- 10 transacoes reais consecutivas homologadas sem divergencia de estado
- reenvio de webhook nao duplica efeito financeiro
- `GET /api/payments/status/[paymentId]` retorna timeline coerente
- nenhum pedido fica sem conciliacao por `providerReference`
- falha do provider retorna fallback seguro sem perda de pedido
- logs e rastreio interno permitem investigar incidente por `paymentId` e `providerReference`
- nenhum gate da Fase 1 regressa

## Dependencias obrigatorias antes da implementacao
Executar em serie:

```text
npm run check
npm run build
npm run qa:functional
npm run qa:coreops
npm run qa:matrix:audit
```

Depois disso:
- executar `npm run qa:payments21`
- executar o runbook `docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md`
- registrar evidencias e decisao em `docs/CHANGELOG_GOVERNANCE.md`

## Plano executavel
1. revalidar freeze da Fase 1
2. confirmar provider real oficial
3. validar requisitos e segredos por ambiente
4. homologar checkout real + status + webhook
5. provar conciliacao e idempotencia
6. publicar evidencias de cutover e rollback

## Riscos conhecidos
- tratar esta trilha como fase oficial cria conflito de precedencia
- mexer em UX publica para acomodar operacao financeira reabre a Fase 1
- cutover sem evidencias formais vira opiniao, nao readiness

## Ultimo ciclo executado
Data: `2026-06-05`

Veredito do bloco:
- `BLOCKED-ENV`

Evidencias:
- `npm run check`: PASS
- `npm run build`: PASS
- `npm run qa:functional`: PASS
- `qa-core-operations`: PASS
- `qa-matrix-audit`: PASS
- `npm run qa:provider:requirements`: `MISSING_ENV` explicito para `gateway_real`
- `npm run qa:providers:ready`: `PARTIAL_READY`
- `npm run p3:precheck`: `FAIL/missing_provider_env` explicito para `gateway_real`
- `qa-payments-2-1`: FAIL por falta explicita de:
  - `PAYMENT_GATEWAY_BASE_URL`
  - `PAYMENT_GATEWAY_API_KEY`
  - `PAYMENT_GATEWAY_MERCHANT_ID`
- `qa-gateway-real-smoke`: FAIL por falta de:
  - `PAYMENT_GATEWAY_BASE_URL`
  - `PAYMENT_GATEWAY_API_KEY`
  - `PAYMENT_GATEWAY_MERCHANT_ID`

Leitura objetiva:
- a Fase 1 permaneceu integra no ciclo
- a trilha de pagamentos esta coerente em codigo, gates e superficie administrativa
- o bloqueio atual e de ambiente/configuracao, nao de regressao funcional da Fase 1
- o ambiente ativo foi alinhado para `gateway_real` generico
- a trilha de homologacao agora falha de forma explicita e consistente em todos os gates de readiness
- o checkout `gateway_real` generico ainda nao pode ser homologado sem as tres credenciais minimas

## Referencias oficiais
- `docs/FASE_2_READINESS_CHECKLIST.md`
- `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md`
- `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`
- `docs/MVP_ROADMAP.md`
- `docs/PAYMENTS_DEFINITION_OF_DONE.md`
- `docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md`
- `docs/EXECUTION_CONSOLIDATED_MASTER.md`
- `docs/CODEBASE_MAP.md`
