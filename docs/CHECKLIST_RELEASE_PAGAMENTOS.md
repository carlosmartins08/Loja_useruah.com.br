# Checklist Release - Pagamentos Reais

## Gate obrigatorio
- [ ] `npm run alert:critical`
- [ ] `npm run check`
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
