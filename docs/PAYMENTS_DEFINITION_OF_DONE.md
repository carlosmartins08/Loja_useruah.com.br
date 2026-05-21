# Payments Definition Of Done (Obrigatorio)

Data de revisao: 2026-05-19

## Objetivo
Garantir execução previsível do domínio de pagamentos sem retrabalho, com critérios objetivos para evoluir de sandbox para operação real.

## Politica ativa
- Payment Deferred ativo: gateway real e persistência financeira ficam para fase posterior.
- Contrato de API atual permanece congelado até migration formal.

## Máquina de estados
Este fluxo deve seguir obrigatoriamente as transições definidas em `docs/STATE_MACHINES.md` (`payment`, e reflexos em `order`).

Em caso de conflito, `docs/STATE_MACHINES.md` prevalece.

Não repetir estados ou transições neste DoD. Qualquer alteração de fluxo deve ser feita primeiro em `STATE_MACHINES.md` e depois refletida aqui apenas como referência.

## Contrato congelado (atual)
### Endpoints
- `POST /api/payments/checkout`
- `GET /api/payments/status/[paymentId]`
- `POST /api/payments/webhook`

### Campos obrigatorios (nao quebrar sem migration)
- `paymentId`
- `orderId`
- `providerReference`
- `status`
- `method`
- `amount`
- `currency`

### Regras obrigatorias
- [x] Checkout envia `x-idempotency-key`.
- [x] Webhook valida `x-signature` quando `PAYMENT_WEBHOOK_SECRET` existe.
- [x] `providerReference` é chave de reconciliação lógica no fluxo.

## Fase A: Sandbox estavel (estado atual)
### Escopo
- [x] Fluxo `product -> checkout -> payment` funcional em sandbox.
- [x] Métodos `card|pix|wallet` suportados em contrato único.
- [x] Idempotência aplicada em checkout.
- [x] Webhook com atualização de status conforme máquina `payment`.
- [x] Consulta de status por `paymentId`.

### Critérios de aceite
- [ ] 10 execuções sandbox consecutivas sem inconsistência de status.
- [ ] Reenvio do mesmo `x-idempotency-key` não cria nova cobrança.
- [ ] Evento de webhook atrasado não gera regressão de estado.

## Fase B: Gateway real
### Escopo
- [x] Implementar adapter homologado de gateway sandbox (`PAYMENT_PROVIDER=gateway_sandbox`).
- [ ] Tokenização de método de pagamento.
- [ ] Tratamento explícito de falhas transitórias e fallback seguro.
- [ ] Mapeamento de eventos reais do provedor para `payment.paid|failed|pending`.
- [ ] Executar cutover controlado seguindo `docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md`.

### Critérios de aceite
- [ ] Homologação ponta a ponta no ambiente de testes do provedor.
- [ ] Fluxo de 1 clique (pix/carteira) confirmado com retorno real do provedor.
- [ ] Falha do provedor retorna mensagem controlada sem perda de pedido.

## Fase C: Persistencia e reconciliacao
### Escopo
- [x] Persistir transacoes em sqlite relacional local (`PAYMENT_PERSISTENCE=sqlite`) com fallback controlado.
- [ ] Reconciliar por `providerReference` com idempotência.
- [x] Trilhas auditáveis de mudança de status (`payment_events` + `AuditLog`).
- [x] Política de retry para webhook/processamento assíncrono (tentativas controladas por `PAYMENT_WEBHOOK_MAX_RETRIES`).

### Critérios de aceite
- [ ] Reprocessamento do mesmo webhook não duplica efeito financeiro.
- [ ] Estado financeiro reproduzível após restart/deploy.
- [x] Consulta de pagamento retorna histórico consistente (`GET /api/payments/status/[paymentId]` com `events`).
- [x] Retenção de trilha operacional configurável para idempotência e timeline (`WEBHOOK_IDEMPOTENCY_RETENTION_DAYS`, `PAYMENT_EVENTS_RETENTION_DAYS`).

## Segurança minima
- [ ] Segredos por ambiente configurados e validados:
  - `PAYMENT_PROVIDER`
  - `PAYMENT_WEBHOOK_SECRET`
- [ ] Sem logs com dados sensíveis de cartão/token.
- [ ] Erros de pagamento com mensagem segura para cliente e detalhe técnico só em log interno.

## Observabilidade
- [ ] Eventos mínimos instrumentados:
  - `checkout_started`
  - `payment_created`
  - `payment_status_updated`
  - `payment_failed`
- [ ] Correlação por `paymentId` e `providerReference`.

## Testes obrigatorios
- [ ] Unit: validação de payload, idempotência, assinatura.
- [ ] Integração: checkout + status + webhook.
- [ ] E2E: `product -> checkout -> success/failure`.

## Referencias de implementação atual
- `lib/payments.ts`
- `lib/payment-provider.ts`
- `lib/payment-service.ts`
- `lib/payment-store.ts`
- `app/api/payments/checkout/route.ts`
- `app/api/payments/status/[paymentId]/route.ts`
- `app/api/payments/webhook/route.ts`
- `components/checkout/CheckoutPageView.tsx`
- `components/checkout/sections/CheckoutStepTwoSection.tsx`
- `docs/PAYMENTS_GATEWAY_REAL_CUTOVER_RUNBOOK.md`

