# P3 Env Ready-To-Fill (Copiar e Colar)

Regra de nomenclatura:
- `P3` neste arquivo significa readiness operacional de pagamento real.
- `P3` aqui nao significa Fase 3 de produto.
- A Fase 3 oficial de produto esta definida separadamente em:
  - `docs/FASE_3_CATALOGO_ESCALAVEL_ARTE_CURADORIA_E_COMPOSICAO_CONTROLADA.md`

Objetivo: deixar o ambiente pronto para ativar cutover real assim que as credenciais existirem e `HML_BASE_URL` apontar para a homolog final real.

Atalho pronto:
- Template copiavel: `infra/env/.env.p3.template`
- Dry-run da sequencia: `npm run p3:plug`
- Execucao automatica da sequencia: `npm run p3:plug:run`

Leitura obrigatoria:
- enquanto `HML_BASE_URL` continuar em `localhost`, o resultado correto de `npm run p3:plug` e `BLOCKED_EXTERNAL_BASE_URL`
- `npm run p3:plug:run` e `npm run go:preflight:run` so fazem sentido quando a janela externa real estiver aberta

## 0) Checklist Rapido (Admin Tecnico)

1. Copiar `infra/env/.env.p3.template` para `.env`.
2. Usar `stripe` como provider real inicial da Fase 1.
3. Preencher bloco global e somente 1 bloco de credencial.
4. Confirmar que `PAYMENT_PERSISTENCE=mysql` e `DATABASE_URL` comecam com `mysql://`.
5. Se `HML_BASE_URL` ainda for local, rodar apenas `npm run p3:plug` e confirmar `BLOCKED_EXTERNAL_BASE_URL`.
6. Rodar `npm run p3:plug:run` e `npm run go:preflight:run` somente quando `HML_BASE_URL` estiver fora de `localhost`.

## 1) Bloco global obrigatorio

Copie este bloco para `.env`:

```env
# Base homolog
HML_BASE_URL=https://SEU_HOST_HML_FINAL

# Modo escolhido:
# - stripe como provider oficial inicial da Fase 1
# - outros providers diretos ou `gateway_real` generico ficam para recortes futuros
PAYMENT_PROVIDER=stripe
PAYMENT_GATEWAY_TARGET=

# Seguranca webhook
PAYMENT_STRIPE_WEBHOOK_SECRET=SEU_SEGREDO_WEBHOOK_STRIPE

# Persistencia final
PAYMENT_PERSISTENCE=mysql
DATABASE_URL=mysql://USUARIO:SENHA@HOST:3306/BANCO
```

## 2) Bloco por provider (preencher apenas 1)

### Gateway real (generico)
```env
# Planejado para bridge futura. Nao usar neste recorte inicial da Fase 1.
PAYMENT_GATEWAY_BASE_URL=
PAYMENT_GATEWAY_API_KEY=
PAYMENT_GATEWAY_MERCHANT_ID=
```

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
PAYMENT_ENABLE_STRIPE=true
PAYMENT_STRIPE_BASE_URL=
PAYMENT_STRIPE_API_KEY=
```

## 3) Sequencia de validacao imediata

Apos preencher `.env`, rodar:

```bash
npm run p3:precheck
npm run qa:provider:requirements
npm run qa:providers:ready
npm run qa:stripe:smoke
npm run qa:payments21
npm run qa:coreops
```

Ou executar tudo em sequencia:

```bash
npm run p3:plug:run
```

Se a URL final ainda nao existir, validar apenas o bloqueio honesto:

```bash
npm run p3:plug
```

Onde o smoke pode ser:
- `qa:gateway-real:smoke`
- `qa:inter:smoke`
- `qa:infinitepay:smoke`
- `qa:mercadopago:smoke`
- `qa:pagarme:smoke`
- `qa:cielo:smoke`
- `qa:stripe:smoke`

Exemplo:

```bash
npm run qa:stripe:smoke
```

## 4) Criterio de pronto

- `p3:precheck`: PASS somente fora de localhost
- `qa:provider:requirements`: provider resolvido corretamente e sem `missing_env`
- `qa:providers:ready`: `stripe` pronto para o recorte ativo
- smoke do modo/provider: PASS
- `qa:payments21`: PASS
- `qa:coreops`: PASS
- `p3:plug`: `BLOCKED_EXTERNAL_BASE_URL` enquanto a janela externa ainda nao existir

Leitura obrigatoria para este ciclo:
- o relatorio global pode continuar `PARTIAL_READY` se outros providers permanecerem fora do recorte ativo
- a validacao operacional deste ciclo deve seguir `docs/FOLHA_OPERACIONAL_HOMOLOGACAO_GATEWAY_REAL.md`
- `gateway_real` generico fica `PLANEJADO`, nao como bloqueio oficial atual
- `pix` fica fora do escopo imediato, salvo decisao comercial explicita

Com isso, o cutover fica pronto para execucao operacional conforme:
- `docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md`
- `docs/RUNBOOK_GO_LIVE.md`
