# P3 Env Ready-To-Fill (Copiar e Colar)

Objetivo: deixar o ambiente pronto para ativar cutover real assim que as credenciais existirem.

Atalho pronto:
- Template copiavel: `.env.p3.template`
- Dry-run da sequencia: `npm run p3:plug`
- Execucao automatica da sequencia: `npm run p3:plug:run`

## 0) Checklist Rapido (Admin Tecnico)

1. Copiar `.env.p3.template` para `.env`.
2. Preencher bloco global e somente 1 bloco de provider.
3. Confirmar que `PAYMENT_PERSISTENCE=mysql` e `DATABASE_URL` comecam com `mysql://`.
4. Rodar `npm run p3:plug:run`.
5. Rodar `npm run go:preflight:run`.

## 1) Bloco global obrigatorio

Copie este bloco para `.env`:

```env
# Base homolog
HML_BASE_URL=https://SEU_HOST_HML

# Provider escolhido (inter|infinitepay|mercadopago|pagarme|cielo|stripe)
PAYMENT_PROVIDER=inter

# Seguranca webhook
PAYMENT_WEBHOOK_SECRET=SEU_SEGREDO_WEBHOOK

# Persistencia final
PAYMENT_PERSISTENCE=mysql
DATABASE_URL=mysql://USUARIO:SENHA@HOST:3306/BANCO
```

## 2) Bloco por provider (preencher apenas 1)

### Inter
```env
PAYMENT_INTER_BASE_URL=
PAYMENT_INTER_TOKEN_URL=
PAYMENT_INTER_CLIENT_ID=
PAYMENT_INTER_CLIENT_SECRET=
```

### InfinitePay
```env
PAYMENT_INFINITEPAY_BASE_URL=
PAYMENT_INFINITEPAY_API_KEY=
```

### Mercado Pago
```env
PAYMENT_MERCADOPAGO_BASE_URL=
PAYMENT_MERCADOPAGO_API_KEY=
```

### Pagar.me
```env
PAYMENT_PAGARME_BASE_URL=
PAYMENT_PAGARME_API_KEY=
```

### Cielo
```env
PAYMENT_CIELO_BASE_URL=
PAYMENT_CIELO_API_KEY=
PAYMENT_CIELO_MERCHANT_ID=
```

### Stripe
```env
PAYMENT_STRIPE_BASE_URL=
PAYMENT_STRIPE_API_KEY=
```

## 3) Sequencia de validacao imediata

Apos preencher `.env`, rodar:

```bash
npm run p3:precheck
npm run qa:providers:ready
npm run qa:<provider>:smoke
npm run qa:payments21
npm run qa:coreops
```

Ou executar tudo em sequencia:

```bash
npm run p3:plug:run
```

Onde `<provider>` e um dos comandos:
- `inter`
- `infinitepay`
- `mercadopago`
- `pagarme`
- `cielo`
- `stripe`

Exemplo:

```bash
npm run qa:inter:smoke
```

## 4) Criterio de pronto

- `p3:precheck`: PASS
- `qa:providers:ready`: READY para o provider escolhido
- smoke do provider: PASS
- `qa:payments21`: PASS
- `qa:coreops`: PASS

Com isso, o cutover fica pronto para execucao operacional conforme:
- `docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md`
- `docs/RUNBOOK_GO_LIVE.md`
