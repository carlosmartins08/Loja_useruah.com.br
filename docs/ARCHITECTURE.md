# Arquitetura Tecnica (Atual + Proximo Passo)

Data de revisao: 2026-05-21

Atualizacao adicional: 2026-05-29
- Superficie de API classificada por nivel de exposicao em `docs/API_ROUTE_CLASSIFICATION.md`.
- Endpoints criticos agora exigem ator autenticado e escopo por role/ownership:
  - `GET /api/orders`
  - `GET /api/audit-logs`
  - `GET /api/payments/status/[paymentId]`
  - `GET /api/production-jobs/by-order/[orderId]`
  - `POST /api/terms/accept`
- Webhook de pagamento endurecido:
  - assinatura obrigatoria fora de QA controlado;
  - erro explicito quando segredo de webhook nao estiver configurado fora de QA.
- Gate de backend migrado para runner PowerShell sequencial para reduzir fragilidade de subprocesso em ambiente Windows/sandbox.

Atualizacao adicional: 2026-06-06
- IA removida do produto publico por decisao de coerencia e governanca.
- Busca e guia de estilo agora sao locais/deterministicos, sem provider externo no client.
- Catalogo oficial deixou de depender de `public/assets/products/mockups/**`.
- Midia oficial dos seeds publicados agora vive em `public/assets/editorial/catalog/**`.
- QA de catalogo passou a bloquear:
  - `picsum`
  - paths de `mockups` placeholder
  - asset inexistente
  - reintroducao de IA client-side no produto

## Estado atual (rodando hoje)
- App Next.js com APIs em `app/api/*`.
- Persistencia principal de dominio em store local (`lib/dev-store.ts`).
- Pagamentos fase 2.1 em `sqlite` local (`.tmp-store/payments.sqlite`) por padrao.
- Catalogo seed com fonte canonica em `lib/brand-assets.ts`.
- Descoberta de produto local em `lib/brand-discovery.ts`.
- Midia editorial gerada em `public/assets/editorial/catalog/**`.
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
- `lib/brand-assets.ts`: catalogo canonico e merchandising seed.
- `lib/product-artwork.ts`: normalizacao entre legado de mockup e asset editorial oficial.
- `lib/brand-discovery.ts`: busca e recomendacao local sem IA.

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

## Escopo explicitamente adiado
- Biblioteca visual real de produto e eventual IA server-side nao fazem parte do escopo fechado atual.
- Quando essas frentes forem retomadas, seguir `docs/PLANO_REENTRADA_IA_E_MIDIA_REAL.md`.
