# API Route Classification

Data de revisao: 2026-05-29

## Regra de classificacao

- `public`: sem autenticacao, sem dados sensiveis por usuario.
- `authenticated`: exige ator autenticado e escopo por role/ownership.
- `admin`: exige role administrativa explicita.
- `webhook`: endpoint tecnico com assinatura e idempotencia obrigatorias.

## Mapa por grupo

- `public`
  - `/api/auth/login`
  - `/api/auth/register`
  - `/api/auth/session` (GET sem sessao retorna `authenticated=false`)
  - `/api/payments/providers`

- `authenticated`
  - `/api/orders` (GET/POST com escopo por ator)
  - `/api/orders/:orderId/*`
  - `/api/payments/status/:paymentId`
  - `/api/production-jobs/by-order/:orderId`
  - `/api/shipments/:orderId`
  - `/api/tickets*`
  - `/api/commissions/me`
  - `/api/payouts*`
  - `/api/terms/accept`

- `admin`
  - `/api/admin/*`
  - `/api/audit-logs`

- `webhook`
  - `/api/payments/webhook`
  - `/api/chargebacks/webhook`

## Guardrails obrigatorios

- Toda rota nova deve ser classificada neste documento no mesmo PR.
- Rotas `authenticated` e `admin` devem padronizar:
  - `401 unauthorized` quando sem ator autenticado.
  - `403 forbidden` quando ator sem permissao.
- Rotas `webhook` devem falhar quando segredo de assinatura estiver ausente fora de QA controlado.
