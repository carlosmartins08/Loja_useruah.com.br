# Folha Operacional - Homologacao Stripe Fase 1

Data de revisao: 2026-06-05

## Objetivo
Executar a homologacao da `Stripe` como provider real inicial da Fase 1 sem ambiguidade de ambiente, sem alterar fluxo da aplicacao e sem abrir escopo novo de produto.

## Status atual

```text
Status: BLOQUEADO
Causa: credenciais reais da Stripe ausentes ou nao validadas
Arquitetura: preservada
Fase 1: sem regressao
Fase 2: nao aberta
Proxima acao: preencher credenciais Stripe e validar homologacao
```

## Variaveis obrigatorias

Preencher no ambiente seguro de homologacao:

```env
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
nao alterar checkout
nao alterar webhook
nao alterar state machine
nao abrir escopo da Fase 2
nao tratar Pix como incluso sem decisao comercial explicita
```

## Ordem obrigatoria de validacao

Depois de preencher as credenciais reais:

```bash
npm run qa:provider:requirements
npm run qa:providers:ready
npm run p3:precheck
npm run qa:stripe:smoke
npm run qa:payments21
```

Depois, confirmacao geral:

```bash
npm run check
npm run build
npm run qa:functional
```

## Critero de aprovacao

```text
qa:provider:requirements = READY_FOR_SMOKE
qa:providers:ready = stripe pronto para smoke
p3:precheck = PASS
qa:stripe:smoke = PASS
qa:payments21 = PASS
```

Leitura pratica:
- `qa:providers:ready` pode continuar `PARTIAL_READY` globalmente, desde que `stripe` esteja pronto
- o foco desta folha e o recorte ativo da Fase 1: `stripe` para `card/wallet`
- `gateway_real` generico fica planejado para bridge futura e nao e o bloqueio oficial deste ciclo
- `pix` fica fora do escopo imediato, salvo decisao comercial explicita

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
comandos executados
resultado de cada comando
status final
responsavel pela validacao
observacoes de erro, se houver
```

## Regra final

```text
Nao fazer mais codigo agora.
Preencher credenciais reais.
Rodar validacao.
Registrar evidencia.
Atualizar governanca.
```
