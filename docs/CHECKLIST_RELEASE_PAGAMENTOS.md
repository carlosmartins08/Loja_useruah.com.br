# Checklist Release - Pagamentos Reais

## Gate obrigatorio
- [ ] `npm run alert:critical`
- [ ] `npm run check`
- [ ] `npm run qa:payments21`
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
- [ ] Rollback de provider testado
- [ ] Evidencia registrada em `docs/P0_EVIDENCE_LOG.md`
- [ ] Decisao registrada em `docs/CHANGELOG_GOVERNANCE.md`
