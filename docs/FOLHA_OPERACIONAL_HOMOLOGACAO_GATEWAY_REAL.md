# Folha Operacional - Homologacao Stripe Fase 1

Data de revisao: 2026-06-21

## Objetivo
Executar a homologacao da `Stripe` como provider real inicial da Fase 1 sem ambiguidade de ambiente, sem alterar fluxo da aplicacao e sem abrir escopo novo de produto.

## Status atual

```text
Status: BLOQUEADO
Causa: HML_BASE_URL ainda aponta para localhost e a janela externa de homolog final nao foi aberta
Arquitetura: preservada
Fase 1: sem regressao
Fase 2: nao aberta
Proxima acao: definir URL final de homolog, dono da janela e evidencias externas; so depois reexecutar os gates de cutover
```

## Variaveis obrigatorias

Preencher no ambiente seguro de homologacao:

```env
HML_BASE_URL=https://SEU_HOST_HML_FINAL
PAYMENT_PROVIDER=stripe
PAYMENT_ENABLE_STRIPE=true
PAYMENT_STRIPE_BASE_URL=
PAYMENT_STRIPE_API_KEY=
PAYMENT_STRIPE_WEBHOOK_SECRET=
PAYMENT_PERSISTENCE=mysql
DATABASE_URL=mysql://USUARIO:SENHA@HOST:3306/BANCO
```

## O que nao pode fazer

```text
nao inventar credencial
nao usar chave de producao em homologacao
nao commitar .env com segredo real
nao tratar localhost como homolog final
nao alterar checkout
nao alterar webhook
nao alterar state machine
nao abrir escopo da Fase 2
nao tratar Pix como incluso sem decisao comercial explicita
```

## Ordem obrigatoria de validacao

Antes de qualquer comando:

```text
confirmar dono da janela real
confirmar HML_BASE_URL fora de localhost
confirmar segredos Stripe no ambiente seguro
```

Depois:

```bash
npm run qa:provider:requirements
npm run qa:providers:ready
npm run p3:precheck
npm run qa:stripe:smoke
npm run qa:payments21
npm run qa:provider:activate
npm run go:preflight:run
npm run go:e2e:proof:run
```

Confirmacao geral:

```bash
npm run check
npm run build
npm run qa:functional
npm run qa:coreops
npm run qa:matrix:audit
```

## Criterio de aprovacao

```text
qa:provider:requirements = READY_FOR_SMOKE
qa:providers:ready = stripe pronta para smoke
p3:precheck = PASS somente fora de localhost
qa:stripe:smoke = PASS
qa:payments21 = PASS
qa:provider:activate = PASS
go:preflight:run = PASS somente fora de localhost
go:e2e:proof:run = PASS somente fora de localhost
```

Leitura pratica:
- `qa:providers:ready` pode continuar `PARTIAL_READY` globalmente, desde que `stripe` esteja pronta.
- `p3:precheck`, `p3:plug`, `go:preflight` e `go:e2e:proof` devem devolver `BLOCKED_EXTERNAL_BASE_URL` enquanto `HML_BASE_URL` continuar local.
- o foco desta folha e o recorte ativo da Fase 1: `stripe` para `card/wallet`.
- `gateway_real` generico fica planejado para bridge futura e nao e o bloqueio oficial deste ciclo.
- `pix` fica fora do escopo imediato, salvo decisao comercial explicita.

## Evidencia obrigatoria

Registrar em:

```text
docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md
docs/P3_HOMOLOG_CUTOVER_EVIDENCE_TEMPLATE.md
docs/CHANGELOG_GOVERNANCE.md
```

Com:

```text
data/hora
ambiente usado
HML_BASE_URL usada
comandos executados
resultado de cada comando
status final
responsavel pela validacao
observacoes de erro, se houver
```

## Regra final

```text
Nao fazer mais codigo de pagamento real enquanto HML_BASE_URL seguir local.
Definir URL final.
Confirmar janela.
Rodar validacao.
Registrar evidencia.
Atualizar governanca.
```
