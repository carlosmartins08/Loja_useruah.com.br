# Checklist Release - Pagamentos Reais

Leitura obrigatoria:
- esta checklist nao autoriza release com `HML_BASE_URL` em `localhost`
- antes da janela real, o comportamento correto dos atalhos de cutover e go-live e `BLOCKED_EXTERNAL_BASE_URL`

## Gate obrigatorio
- [ ] `npm run alert:critical`
- [ ] `npm run check`
- [ ] `npm run p3:precheck` PASS fora de localhost
- [ ] `npm run qa:payments21`
- [ ] `npm run qa:exceptions`
- [ ] `npm run qa:coreops`

## Base operacional minima
- [ ] Termo industria vigente aceito
- [ ] Termo artista vigente aceito
- [ ] Termo consumidor vigente aceito
- [ ] Split financeiro por item persistido
- [ ] Evento de licenciamento por venda com arte

## Integracao e risco
- [ ] `npm run go:preflight:run` PASS fora de localhost
- [ ] `npm run go:e2e:proof:run` PASS fora de localhost
- [ ] Webhook assinado e idempotente validado
- [ ] Reprocessamento de webhook validado
- [ ] Excecoes de cancel/refund/chargeback validadas sem duplicidade
- [ ] Rollback de provider testado
- [ ] Evidencia recente registrada em `docs/EXECUTION_TRACKING.md`
- [ ] Evidencia normativa coerente com `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md`
- [ ] Decisao registrada em `docs/CHANGELOG_GOVERNANCE.md`

## Rollout controlado de termos (feature flags)
- [ ] `dev`: `TERMS_ENFORCE_*` pode ficar `false` durante bootstrap
- [ ] `hml`: ativar por etapa (`industry` -> `artist` -> `consumer`) com evidencia de aceite
- [ ] `prod`: ativar somente apos aceite vigente e monitoramento de bloqueios `terms_not_accepted`
