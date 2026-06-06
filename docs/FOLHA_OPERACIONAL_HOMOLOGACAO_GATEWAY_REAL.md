# Folha Operacional - Homologacao gateway_real

Data de revisao: 2026-06-05

## Objetivo
Executar a homologacao do `gateway_real` generico sem ambiguidade de ambiente, sem alterar fluxo da aplicacao e sem abrir escopo novo de produto.

## Status atual

```text
Status: BLOCKED-ENV
Causa: credenciais reais ausentes do gateway_real
Arquitetura: preservada
Fase 1: sem regressao
Fase 2: nao aberta
Proxima acao: preencher credenciais reais e validar homologacao
```

## Variaveis obrigatorias

Preencher no ambiente seguro de homologacao:

```env
PAYMENT_PROVIDER=gateway_real
PAYMENT_GATEWAY_TARGET=
PAYMENT_GATEWAY_BASE_URL=
PAYMENT_GATEWAY_API_KEY=
PAYMENT_GATEWAY_MERCHANT_ID=
PAYMENT_WEBHOOK_SECRET=
PAYMENT_PERSISTENCE=mysql
DATABASE_URL=mysql://USUARIO:SENHA@HOST:3306/BANCO
```

## O que nao pode fazer

```text
nao inventar credencial
nao usar chave de Stripe
nao usar chave de producao em homologacao
nao commitar .env com segredo real
nao alterar checkout
nao alterar webhook
nao alterar state machine
nao abrir escopo da Fase 2
```

## Ordem obrigatoria de validacao

Depois de preencher as credenciais reais:

```bash
npm run qa:provider:requirements
npm run qa:providers:ready
npm run p3:precheck
npm run qa:gateway-real:smoke
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
qa:providers:ready = gateway_real pronto
p3:precheck = PASS
qa:gateway-real:smoke = PASS
qa:payments21 = PASS
```

Leitura pratica:
- `qa:providers:ready` pode continuar `PARTIAL_READY` globalmente, desde que `gateway_real` esteja pronto
- o foco desta folha e o recorte ativo, nao todos os providers do projeto

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
