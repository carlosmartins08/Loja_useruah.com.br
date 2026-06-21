# Payments Stripe Cutover Runbook

Data de revisao: 2026-06-21

## Objetivo
Executar migracao controlada de `gateway_sandbox` para `stripe` como provider real inicial da Fase 1 sem quebrar o contrato atual de API:
- `POST /api/payments/checkout`
- `GET /api/payments/status/[paymentId]`
- `POST /api/payments/webhook`

## Pre-condicoes obrigatorias
- `npm run check` em `PASS`.
- `npm run qa:provider:requirements` em `READY_FOR_SMOKE`.
- `npm run qa:providers:ready` com `stripe` pronta para o recorte ativo.
- `npm run p3:precheck` em `PASS` somente fora de `localhost`.
- `npm run qa:stripe:smoke` em `PASS`.
- `npm run qa:payments21` em `PASS`.
- `npm run qa:provider:activate` em `PASS`.
- `npm run qa:coreops` em `PASS`.
- `HML_BASE_URL` apontando para a homolog final real.
- dono da janela de cutover definido.
- chaves e segredos configurados por ambiente:
  - `PAYMENT_PROVIDER`
  - `PAYMENT_ENABLE_STRIPE`
  - `PAYMENT_STRIPE_WEBHOOK_SECRET`
  - `PAYMENT_STRIPE_BASE_URL`
  - `PAYMENT_STRIPE_API_KEY`
- endpoint de webhook do provider apontando para o ambiente correto.
- time de suporte avisado da janela de cutover.

Leitura obrigatoria para este ciclo:
- `qa:providers:ready` pode continuar `PARTIAL_READY` globalmente se outros providers permanecerem fora do escopo ativo.
- `p3:precheck`, `p3:plug`, `go:preflight` e `go:e2e:proof` devem bloquear `localhost`; isso nao e regressao, e o comportamento correto.
- a interpretacao operacional do gate esta consolidada em `docs/FOLHA_OPERACIONAL_HOMOLOGACAO_GATEWAY_REAL.md`.
- o preenchimento da janela real deve usar o modelo executavel em `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md`.

## Politica de risco
- nao alterar payload ou shape dos endpoints publicos.
- nao alterar estados canonicos da machine de payment/order.
- mudar apenas adaptador interno e configuracao.
- rollout progressivo com validacao por lote pequeno inicial.

## Sequencia de cutover
1. Validar baseline no ambiente alvo:
   - `npm run p3:precheck`
   - `npm run qa:stripe:smoke`
   - `npm run qa:payments21`
   - `npm run qa:provider:activate`
2. Confirmar variaveis de ambiente:
   - `HML_BASE_URL` fora de `localhost`
   - `PAYMENT_PROVIDER=stripe`
   - `PAYMENT_ENABLE_STRIPE=true`
   - `PAYMENT_STRIPE_WEBHOOK_SECRET` ativo
   - `PAYMENT_STRIPE_BASE_URL` com endpoint HTTPS da Stripe
   - `PAYMENT_STRIPE_API_KEY`
3. Publicar versao com feature ativa para baixo volume inicial.
4. Executar smoke funcional:
   - checkout real
   - status por `paymentId`
   - webhook `approved`
   - webhook duplicado
5. Monitorar 30-60 minutos:
   - taxa de erro em checkout
   - mismatch entre `providerReference` e status local
   - eventos de webhook invalido
6. Expandir volume de forma progressiva.

## Criterios de aceite do cutover
- 10 transacoes reais consecutivas sem divergencia de estado.
- reenvio de webhook nao duplica efeito financeiro.
- `GET /api/payments/status/[paymentId]` retorna timeline coerente.
- nenhum pedido fica sem conciliacao por `providerReference`.
- suporte consegue rastrear incidente com `paymentId` e `providerReference`.

## Rollback imediato
Gatilhos:
- aumento de erro 5xx em checkout ou webhook
- divergencia de status entre provider e API local
- perda de idempotencia

Passos:
1. Voltar `PAYMENT_PROVIDER` para `gateway_sandbox`.
2. Reaplicar deploy com configuracao anterior.
3. Reexecutar `npm run qa:payments21`.
4. Registrar incidente e decisao no changelog de governanca.
5. Abrir RCA com amostra de `paymentId` e `providerReference` afetados.

## Evidencias obrigatorias no cutover
- logs de smoke do checkout, status e webhook.
- resultado dos gates `p3:precheck`, `qa:stripe:smoke`, `qa:payments21`, `qa:provider:activate` e `qa:coreops`.
- print ou registro de configuracao por ambiente, sem expor segredo.
- registro de decisao em `docs/CHANGELOG_GOVERNANCE.md`.
