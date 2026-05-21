# Arquitetura Tecnica (Atual + Proximo Passo)

Data de revisao: 2026-05-21

## Estado atual (rodando hoje)
- App Next.js com APIs em `app/api/*`.
- Persistencia principal de dominio em store local (`lib/dev-store.ts`).
- Pagamentos fase 2.1 em `sqlite` local (`.tmp-store/payments.sqlite`) por padrao.
- Adaptadores MySQL implementados para:
  - `orders`
  - `production_jobs`
  - `shipments`
  - `payments` (incluindo `payment_events` e `webhook_events`)
- Contrato publico de pagamento ativo:
  - `POST /api/payments/checkout`
  - `POST /api/payments/webhook`
  - `GET /api/payments/status/[paymentId]`

## Direcao de arquitetura (preparar agora o depois)
- Manter contrato de API estavel.
- Isolar evolucao de persistencia por `PAYMENT_PERSISTENCE`.
- Primeiro homologar infraestrutura local com MySQL em Docker Desktop.
- Depois trocar apenas o alvo de hospedagem (sem reescrever fluxo de negocio).

## Blocos de responsabilidade
- `lib/payment-service.ts`: regras de fluxo, idempotencia e transicoes.
- `lib/payment-provider.ts`: adapter de provedor (`sandbox|gateway_sandbox`).
- `lib/payment-store.ts`: persistencia (`sqlite` hoje) e trilha de eventos.
- `lib/webhook-event-store.ts`: idempotencia de webhook com retencao.

## Regras operacionais ja aplicadas
- Retry controlado no webhook por `PAYMENT_WEBHOOK_MAX_RETRIES`.
- Retencao de timeline de pagamento por `PAYMENT_EVENTS_RETENTION_DAYS`.
- Retencao de idempotencia webhook por `WEBHOOK_IDEMPOTENCY_RETENTION_DAYS`.

## Cutover planejado (sem quebra)
1. Subir MySQL local via Docker Desktop.
2. Validar schema base de pagamentos (`infra/mysql/init/001_payments.sql`).
3. Adicionar adapter MySQL no `payment-store` mantendo interface atual.
4. Rodar QA de pagamentos.
5. Promover para ambiente hospedado mantendo mesmo contrato.
