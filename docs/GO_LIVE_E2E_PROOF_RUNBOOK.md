# Go-Live E2E Proof Runbook

Data de revisao: 2026-06-21

## Objetivo
Provar, com evidencia executavel, que nao ha bloqueio critico conhecido para subir o projeto no recorte atual de go-live.

## 1) Pre-condicoes
- `.env` sem duplicidade de chave critica.
- `PAYMENT_PROVIDER=stripe`.
- `PAYMENT_GATEWAY_TARGET` deve permanecer vazio neste recorte oficial da Fase 1.
- `PAYMENT_PERSISTENCE=mysql`.
- `DATABASE_URL=mysql://...`.
- `HML_BASE_URL` deve apontar para a homolog final real quando a prova completa for executada.
- validacao operacional do ambiente seguindo `docs/FOLHA_OPERACIONAL_HOMOLOGACAO_GATEWAY_REAL.md`.
- credenciais da `stripe` preenchidas:
  - `PAYMENT_ENABLE_STRIPE`
  - `PAYMENT_STRIPE_BASE_URL`
  - `PAYMENT_STRIPE_API_KEY`
  - `PAYMENT_STRIPE_WEBHOOK_SECRET`
- `gateway_real` generico nao e o bloqueio oficial deste recorte.

## 2) Prova unica
- Dry-run:
  - `npm run go:e2e:proof`
- Execucao completa:
  - `npm run go:e2e:proof:run`

Leitura obrigatoria do dry-run:
- se `HML_BASE_URL` ainda apontar para `localhost`, o resultado correto e `BLOCKED_EXTERNAL_BASE_URL`
- `READY_TO_EXECUTE` so faz sentido quando a homolog final real ja estiver apontada

Sequencia executada:
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

## 3) Criterio de aprovacao
- Dry-run:
  - `BLOCKED_EXTERNAL_BASE_URL` enquanto a janela real nao existir
  - `READY_TO_EXECUTE` somente quando `HML_BASE_URL` estiver fora de `localhost`
- Execucao completa:
  - `PASS` em todos os passos acima
- `qa:blindspots` sem:
  - duplicidade de env critica
  - colisao de rota API
  - rota admin sem guarda minima
  - ausencia de docs obrigatorios de governanca
- `qa:matrix:audit` sem inconsistencia critica de usuario/catalogo

## 4) Evidencia obrigatoria no release
- Saida final do `go:e2e:proof` ou `go:e2e:proof:run`.
- Registro em:
  - `docs/EXECUTION_TRACKING.md`
  - `docs/CHANGELOG_GOVERNANCE.md`
  - `docs/BLIND_SPOT_CLOSURE_CHECKLIST.md`

## 5) Regra de decisao
- `GO`: execucao completa em `PASS`.
- `GO CONDICIONADO`: base interna aprovada, mas ainda sem janela externa real ou com pendencia operacional controlada e owner definido.
- `NO-GO`: qualquer falha em pagamento, webhook, matriz, conciliacao ou guardas de rota admin.
