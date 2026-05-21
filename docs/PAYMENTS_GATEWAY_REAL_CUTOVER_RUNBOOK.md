# Payments Gateway Real Cutover Runbook

Data de revisao: 2026-05-21

## Objetivo
Executar migracao controlada de `gateway_sandbox` para provedor real sem quebrar contrato atual de API:
- `POST /api/payments/checkout`
- `GET /api/payments/status/[paymentId]`
- `POST /api/payments/webhook`

## Pre-condicoes obrigatorias
- `npm run check` em PASS.
- `npm run qa:payments21` em PASS.
- `npm run qa:coreops` em PASS.
- Chaves e segredos configurados por ambiente:
  - `PAYMENT_PROVIDER`
  - `PAYMENT_WEBHOOK_SECRET`
  - credenciais do provedor real
- Endpoint de webhook do provedor apontando para ambiente correto.
- Time de suporte avisado da janela de cutover.

## Politica de risco
- Nao alterar payload/shape dos endpoints publicos.
- Nao alterar estados canonicos da machine de payment/order.
- Mudar apenas adaptador interno e configuracao.
- Rollout progressivo com validacao por lote pequeno inicial.

## Sequencia de cutover (execucao)
1. Validar baseline no ambiente alvo:
   - `npm run check`
   - `npm run qa:payments21`
2. Configurar variaveis de ambiente:
   - `PAYMENT_PROVIDER` para provedor real
   - `PAYMENT_WEBHOOK_SECRET` ativo
3. Publicar versao com feature ativa para baixo volume inicial.
4. Executar smoke funcional:
   - checkout real
   - status por `paymentId`
   - webhook `approved`
   - webhook duplicado (idempotencia)
5. Monitorar 30-60 minutos:
   - taxa de erro checkout
   - mismatch entre `providerReference` e status local
   - eventos de webhook invalido
6. Expandir volume de forma progressiva.

## Criterios de aceite do cutover
- 10 transacoes reais consecutivas sem divergencia de estado.
- Reenvio de webhook nao duplica efeito financeiro.
- `GET /api/payments/status/[paymentId]` retorna timeline coerente.
- Nenhum pedido fica sem conciliacao por `providerReference`.
- Suporte consegue rastrear incidente com `paymentId` e `providerReference`.

## Rollback imediato
Gatilhos:
- aumento de erro 5xx em checkout/webhook
- divergencia de status entre provedor e API local
- perda de idempotencia

Passos:
1. Voltar `PAYMENT_PROVIDER` para `gateway_sandbox`.
2. Reaplicar deploy com configuracao anterior.
3. Reexecutar `npm run qa:payments21`.
4. Registrar incidente e decisao no changelog de governanca.
5. Abrir RCA com amostra de `paymentId`/`providerReference` afetados.

## Evidencias obrigatorias no PR de cutover
- Logs de smoke do checkout/status/webhook.
- Resultado dos gates (`check`, `qa:payments21`, `qa:coreops`).
- Print/registro de configuracao por ambiente (sem expor segredo).
- Registro de decisao em `docs/CHANGELOG_GOVERNANCE.md`.
