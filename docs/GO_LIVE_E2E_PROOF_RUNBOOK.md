# Go-Live E2E Proof Runbook

Data: 2026-05-28  
Objetivo: provar, com evidência executável, que não há bloqueio crítico conhecido para subir o projeto.

## 1) Pré-condições
- `.env` sem duplicidade de chave crítica.
- `PAYMENT_PROVIDER=gateway_real`
- `PAYMENT_GATEWAY_TARGET=stripe`
- `PAYMENT_PERSISTENCE=mysql`
- `DATABASE_URL=mysql://...`
- Webhook Stripe configurado no endpoint final do ambiente avaliado.

## 2) Prova única (comando)
- Dry-run:
  - `npm run go:e2e:proof`
- Execução completa:
  - `npm run go:e2e:proof:run`

Sequência executada:
1. `check:strict`
2. `alert:critical`
3. `p3:precheck`
4. `qa:blindspots`
5. `qa:catalog`
6. `qa:payments21`
7. `qa:exceptions`
8. `qa:coreops`
9. `qa:payout:ledger`
10. `qa:functional`
11. `qa:matrix:audit`

## 3) Critério de aprovação
- `PASS` em todos os passos acima.
- `qa:blindspots` sem:
  - duplicidade de env crítica,
  - colisão de rota API,
  - rota admin sem guarda mínima,
  - ausência de docs obrigatórios de governança.
- `qa:matrix:audit` sem inconsistência crítica de usuário/catálogo.

## 4) Evidência obrigatória no release
- Saída final do `go:e2e:proof:run`.
- Registro em:
  - `docs/EXECUTION_TRACKING.md`
  - `docs/CHANGELOG_GOVERNANCE.md`
  - `docs/BLIND_SPOT_CLOSURE_CHECKLIST.md` (Gate Final preenchido)

## 5) Regra de decisão
- `GO`: todos os passos PASS.
- `GO condicionado`: no máximo 1-2 pendências não críticas com owner e prazo D+2.
- `NO-GO`: qualquer falha em pagamento, webhook, matriz, conciliação ou guardas de rota admin.

