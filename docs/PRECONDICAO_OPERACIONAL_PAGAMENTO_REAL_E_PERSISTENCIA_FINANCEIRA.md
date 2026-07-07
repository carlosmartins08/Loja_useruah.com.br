# Precondicao Operacional - Pagamento Real e Persistencia Financeira

Data de revisao: 2026-07-07

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

## Evidencia operacional registrada
- `npm run check`: `PASS`
- `npm run build`: `PASS`
- `npm run qa:payments21:readiness`: `PASS`
- gate forte de payments/readiness: roda com `ALLOW_HEADER_ACTOR_FALLBACK=false`
- prova tecnica: `ruah_session` real reconhecido em `auth/session`
- recorte forte validado: `Stripe/mysql`
- webhook e idempotencia: `payment.approved` processado e duplicado tratado
- `npm run qa:payments21` permanece como QA local/sandbox e nao deve ser usado como prova forte de readiness
- `Stripe/readiness` permanece `GO CONDICIONADO` ate a janela real de homologacao final

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

## Checklist operacional de aceite final

Status atual:
- Fase 1 funcional: fechada
- `Stripe`: `GO CONDICIONADO`
- Condicionante atual: aceite final de producao

Objetivo:
- provar operacao real segura antes de emitir `GO`

Nao e objetivo:
- criar feature nova
- abrir Fase 2
- replanejar pagamento
- reabrir discussao de provider, metodo ou gateway

Escopo deste checklist:
- provider inicial: `Stripe`
- metodos no recorte atual: `card` e `wallet`
- `pix`: fora do escopo imediato salvo decisao comercial explicita
- contratos canonicos de rastreio:
  - `orderId`
  - `paymentId`
  - `providerReference`

Blocos minimos:
1. Infra e ambiente
   - ambiente alvo confirmado
   - segredos corretos no ambiente seguro
   - banco alvo validado
2. Pagamento e persistencia
   - venda real concluida no recorte atual
   - persistencia financeira coerente no banco alvo
   - `providerReference` salvo e rastreavel
3. Webhook e reconciliacao
   - assinatura validada
   - reenvio sem duplicidade
   - reconciliacao coerente entre pedido interno e provider
4. Observabilidade minima
   - rastreio objetivo por `orderId`, `paymentId` e `providerReference`
   - falha relevante deixa evidencia operacional suficiente
5. Cutover e rollback
   - caminho de ativacao conhecido
   - caminho de rollback conhecido
   - rollback nao perde pedido nem mascara pendencia financeira
6. Veredito final
   - `GO`
   - `GO CONDICIONADO`
   - `NO-GO`

Regra de uso:
- este checklist operacionaliza o aceite final e nao substitui esta pre-condicao como fonte normativa
- item ja consolidado neste documento pode funcionar como gate
- item util, mas nao consolidado aqui, vale como apoio operacional e nao como bloqueador novo

Modelo preenchivel da janela real:

```text
Janela:
- Data:
- Ambiente alvo:
- Base URL homolog final:
- Dono do go-live:

Responsaveis:
- Engenharia:
- Financeiro:
- Produto:

Status inicial:
- Fase 1 funcional: FECHADA
- Stripe: GO CONDICIONADO
- Auth/session: APROVADO

Pre-janela:
- [ ] Segredos corretos no ambiente seguro
- [ ] Webhook Stripe apontando para /api/payments/webhook
- [ ] Banco alvo confirmado
- [ ] Backup minimo confirmado
- [ ] Caminho de rollback conhecido
- [ ] Evidencia armazenada fora do repositorio

Baseline obrigatoria:
- [ ] npm run check
- [ ] npm run build
- [ ] npm run qa:functional
- [ ] npm run qa:coreops
- [ ] npm run qa:matrix:audit
- [ ] npm run qa:auth:cookie
- [ ] npm run p3:precheck em PASS fora de localhost
- [ ] npm run qa:provider:requirements
- [ ] npm run qa:providers:ready
- [ ] npm run qa:stripe:smoke
- [ ] npm run qa:payments21
- [ ] npm run qa:provider:activate

Validacao operacional final:
- [ ] Pedido criado no ambiente alvo
- [ ] PaymentIntent Stripe criado
- [ ] orderId registrado:
- [ ] paymentId registrado:
- [ ] providerReference registrado:
- [ ] Persistencia financeira correta no banco alvo
- [ ] Webhook assinado recebido
- [ ] Evento approved processado
- [ ] Reenvio sem duplicidade
- [ ] Reconciliacao coerente entre pedido interno e provider
- [ ] Rastreio por orderId/paymentId/providerReference disponivel
- [ ] Nenhum segredo exposto em log
- [ ] Cutover conhecido
- [ ] Rollback conhecido
- [ ] Rollback nao perde pedido nem mascara pendencia financeira

Serie final de homolog:
- Quantidade de transacoes reais executadas:
- Divergencias encontradas:
- Amostras auditadas:

Veredito:
- [ ] GO
- [ ] GO CONDICIONADO
- [ ] NO-GO

Pendencia residual, se houver:
- Descricao:
- Dono:
- Prazo:

Motivo objetivo do veredito:
- 
```

## Janela real de homolog final - preenchimento atual
Data de abertura: `2026-06-09`

Leitura operacional:
- este preenchimento continua o `GOV-0078`
- a baseline tecnica ja aprovada no repositorio e herdada aqui e nao deve ser reaberta sem regressao objetiva
- a Fase 1 continua fechada e segue em `GO CONDICIONADO` ate a execucao real fora de `localhost`

```text
Janela:
- Data: 2026-06-09 (preenchimento inicial; execucao real pendente)
- Ambiente alvo: homolog final
- Base URL homolog final: BLOQUEADA (`HML_BASE_URL` atual aponta para `http://localhost:3000`)
- Dono do go-live: PENDENTE

Responsaveis:
- Engenharia: PENDENTE
- Financeiro: PENDENTE
- Produto: PENDENTE

Status inicial:
- Fase 1 funcional: FECHADA
- Stripe: GO CONDICIONADO
- Auth/session: APROVADO

Pre-janela:
- [ ] Segredos corretos no ambiente seguro
- [ ] Webhook Stripe apontando para /api/payments/webhook
- [ ] Banco alvo confirmado
- [ ] Backup minimo confirmado
- [ ] Caminho de rollback conhecido
- [ ] Evidencia armazenada fora do repositorio

Baseline obrigatoria:
- [x] npm run check
- [x] npm run build
- [x] npm run qa:functional
- [x] npm run qa:coreops
- [x] npm run qa:matrix:audit
- [x] npm run qa:auth:cookie
- [ ] npm run p3:precheck em PASS fora de localhost
- [x] npm run qa:provider:requirements
- [x] npm run qa:providers:ready
- [x] npm run qa:stripe:smoke
- [x] npm run qa:payments21
- [x] npm run qa:provider:activate
- [ ] npm run go:preflight:run fora de localhost
- [ ] npm run go:e2e:proof:run fora de localhost

Execucao da janela real:
- [ ] Checkout real criado em homolog final fora de localhost
- [ ] Pagamento aprovado pela Stripe
- [ ] Pedido persistido com status coerente
- [ ] Webhook recebido e assinado
- [ ] Evento approved processado
- [ ] Reenvio sem duplicidade
- [ ] Reconciliacao coerente entre pedido interno e provider
- [ ] Rastreio por orderId/paymentId/providerReference disponivel
- [ ] Nenhum segredo exposto em log
- [ ] Cutover conhecido
- [ ] Rollback conhecido
- [ ] Rollback nao perde pedido nem mascara pendencia financeira

Serie final de homolog:
- Quantidade de transacoes reais executadas: 0/10
- Divergencias encontradas: janela ainda nao executada
- Amostras auditadas: baseline tecnica do repositorio concluida; amostra real pendente

Veredito:
- [ ] GO
- [x] GO CONDICIONADO
- [ ] NO-GO

Pendencia residual, se houver:
- Descricao: falta abrir e concluir a janela real em homolog final fora de localhost com 10 transacoes reais consecutivas e evidencia operacional assinada por Produto, Engenharia e Financeiro
- Dono: Produto + Engenharia + Financeiro
- Prazo: definir na abertura formal da janela

Motivo objetivo do veredito:
- A baseline tecnica completa foi aprovada no repositorio, mas a janela real de homolog final ainda nao foi executada.
- Desde `2026-06-21`, `p3:precheck`, `p3:plug`, `go:preflight` e `go:e2e:proof` bloqueiam explicitamente `localhost`; portanto baseline local aprovada nao equivale a janela real liberada.
```

Tentativa objetiva de execucao:
- `2026-06-09`
- `npm run p3:precheck`: `BLOCKED_EXTERNAL_BASE_URL`
- leitura do gate: provider `stripe` pronto no recorte local, mas `HML_BASE_URL=http://localhost:3000`
- conclusao: a janela real fora de `localhost` nao foi iniciada; o bloqueio atual e ambiente final de homolog ainda nao apontado

Preenchimento parcial ja provado no repositorio:
- [x] npm run check
- [x] npm run build
- [x] npm run qa:functional
- [x] npm run qa:coreops
- [x] npm run qa:matrix:audit
- [x] npm run qa:auth:cookie
- [x] npm run qa:provider:requirements
- [x] npm run qa:providers:ready
- [x] npm run qa:stripe:smoke
- [x] npm run qa:payments21
- [x] npm run qa:provider:activate
- [x] npm run p3:precheck bloqueia localhost com `BLOCKED_EXTERNAL_BASE_URL`
- [x] npm run p3:plug bloqueia localhost com `BLOCKED_EXTERNAL_BASE_URL`
- [x] npm run go:preflight bloqueia localhost com `BLOCKED_EXTERNAL_BASE_URL`
- [x] npm run go:e2e:proof bloqueia localhost com `BLOCKED_EXTERNAL_BASE_URL`
- [ ] npm run p3:precheck em PASS fora de localhost
- [ ] npm run go:preflight:run fora de localhost
- [ ] npm run go:e2e:proof:run fora de localhost
- [ ] Janela real em homolog final fora de localhost
- [ ] 10 transacoes reais consecutivas homologadas sem divergencia
- [ ] Evidencia operacional final de reconciliacao, observabilidade e rollback com os responsaveis da operacao

Criterio principal:
- se venda, pagamento, persistencia, webhook, reconciliacao, rastreabilidade e rollback estiverem provados: `GO`
- se o fluxo principal estiver seguro, mas houver pendencia operacional controlada sem risco financeiro: `GO CONDICIONADO`
- se houver falha financeira, divergencia de `providerReference`, webhook inseguro, duplicidade, ausencia de rollback ou falta de rastreabilidade minima: `NO-GO`

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
- `npm run qa:coreops`: PASS
- `npm run qa:matrix:audit`: PASS
- `npm run p3:precheck`: PASS no ciclo anterior, antes do bloqueio explicito de `localhost` virar contrato do gate
- `npm run qa:provider:requirements`: READY_FOR_SMOKE
- `npm run qa:providers:ready`: PARTIAL_READY global com `stripe` pronta no recorte ativo
- `npm run qa:stripe:smoke`: PASS
- `npm run qa:payments21`: PASS
- `npm run qa:provider:activate`: PASS
- `npm run check`: PASS
- `npm run build`: PASS
- `npm run qa:functional`: PASS
- `npm run go:preflight:run`: PASS no ciclo anterior, antes do bloqueio explicito de `localhost` virar contrato do gate
- `npm run go:e2e:proof:run`: PASS no ciclo anterior, antes do bloqueio explicito de `localhost` virar contrato do gate

Leitura objetiva:
- `auth/session` deixou de ser impeditivo tecnico da Fase 1
- a trilha Stripe passou nos gates de homologacao definidos para o recorte atual
- a baseline tecnica completa do aceite final passou no repositorio local
- desde `2026-06-21`, os gates de cutover e go-live deixaram de aceitar `localhost` como se fosse janela real
- o estado `GO CONDICIONADO` nao decorre de falha de auth, credencial ou integracao do provider no ciclo homologado
- a condicionante atual e ausencia de janela real em homolog final, aceite final de producao e cutover real
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
- `docs/DOCS_CLASSIFICATION.md`
- `docs/README_DOCS_HIERARCHY.md`
- `docs/CODEBASE_MAP.md`
