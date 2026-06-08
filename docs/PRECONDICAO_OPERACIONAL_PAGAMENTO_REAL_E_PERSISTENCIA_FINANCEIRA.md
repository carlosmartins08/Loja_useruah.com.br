# Precondicao Operacional - Pagamento Real e Persistencia Financeira

Data de revisao: 2026-06-08

## Objetivo
Definir a trilha transversal de readiness que prepara pagamento real, persistencia financeira e cutover operacional sem redefinir a fase oficial de produto.

## Regra de precedencia
- `docs/FASE_1_VENDA_DE_PRODUTO.md` continua mandando na Fase 1.
- `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md` continua mandando na passagem oficial da Fase 1 para a Fase 2.
- `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md` continua mandando no escopo funcional da Fase 2.
- `docs/PAYMENTS_DEFINITION_OF_DONE.md` continua sendo a fonte normativa do dominio de pagamentos.
- Este documento nao abre uma fase paralela. Ele define apenas a pre-condicao operacional de pagamentos para sustentar a evolucao oficial.
- Arquivos `P3_*` associados a esta trilha significam readiness operacional do provider real inicial da Fase 1, nao Fase 3 de produto.

## Classificacao
- Tipo: `readiness transversal`
- Dominio: `pagamento real e persistencia financeira`
- Veredito atual: `GO CONDICIONADO`

`GO CONDICIONADO` significa:
- a homologacao da trilha Stripe passou nos gates definidos do ciclo atual
- `auth/session` deixou de ser impeditivo tecnico da Fase 1
- o provider real inicial deixou de estar bloqueado por credencial ou integracao no recorte homologado
- o aceite final de producao e o cutover real continuam pendentes

## Problema que resolve
A Fase 1 provou venda local e homologacao controlada com `Stripe`, mas ainda nao fecha o risco de operacao real porque aceite final de producao, cutover e evidencias formais de operacao ainda nao foram concluídos.

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
- homologacao de `PAYMENT_PROVIDER=stripe`
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
2. confirmar `Stripe` como provider real oficial inicial
3. validar requisitos e segredos por ambiente
4. homologar checkout real + status + webhook
5. provar conciliacao e idempotencia
6. publicar evidencias de cutover e rollback

## Riscos conhecidos
- tratar esta trilha como fase oficial cria conflito de precedencia
- mexer em UX publica para acomodar operacao financeira reabre a Fase 1
- cutover sem evidencias formais vira opiniao, nao readiness

## Ultimo ciclo executado
Data: `2026-06-08`

Veredito do bloco:
- `GO CONDICIONADO`

Evidencias:
- `npm run qa:auth:cookie`: PASS
- contrato do `ruah_session`: APROVADO
- fundacao de `auth/session` da Fase 1: LIBERADA
- `npm run p3:precheck`: PASS
- `npm run qa:stripe:smoke`: PASS
- `npm run qa:provider:activate`: PASS
- `npm run check`: PASS
- `npm run build`: PASS
- `npm run qa:functional`: PASS

Leitura objetiva:
- `auth/session` deixou de ser impeditivo tecnico da Fase 1
- a trilha Stripe passou nos gates de homologacao definidos para o recorte atual
- o estado `GO CONDICIONADO` nao decorre de falha de auth, credencial ou integracao do provider no ciclo homologado
- a condicionante atual e ausencia de aceite final de producao e cutover real
- a Fase 1 permaneceu integra no ciclo
- `gateway_real` generico continua fora do bloqueio atual e fica como bridge futura `PLANEJADO`
- `pix` continua fora do escopo imediato desta trilha, salvo decisao comercial explicita

## Referencias oficiais
- `docs/FASE_2_READINESS_CHECKLIST.md`
- `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md`
- `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`
- `docs/MVP_ROADMAP.md`
- `docs/PAYMENTS_DEFINITION_OF_DONE.md`
- `docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md`
- `docs/EXECUTION_CONSOLIDATED_MASTER.md`
- `docs/CODEBASE_MAP.md`
