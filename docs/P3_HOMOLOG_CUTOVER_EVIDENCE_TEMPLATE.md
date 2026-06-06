# P3 Homologacao - Evidencia de Cutover e Rollback

Data: YYYY-MM-DD  
Owner:  
Ambiente: homologacao  
Base URL homolog:  
Provider/Modo: `gateway_real | inter | infinitepay | mercadopago | pagarme | cielo | stripe`

## Pre-check
- [ ] `npm run check` PASS
- [ ] `npm run qa:provider:requirements` `READY_FOR_SMOKE`
- [ ] `npm run qa:payments21` PASS
- [ ] `npm run p3:precheck` PASS
- [ ] Credenciais minimas do modo escolhido preenchidas sem expor segredo em evidencias
- [ ] Validacao executada conforme `docs/FOLHA_OPERACIONAL_HOMOLOGACAO_GATEWAY_REAL.md`

## Configuracao validada
- `PAYMENT_PROVIDER`:
- `PAYMENT_GATEWAY_TARGET`:
- `PAYMENT_PERSISTENCE`:
- `DATABASE_URL` inicia com `mysql://`: `SIM | NAO`
- `PAYMENT_WEBHOOK_SECRET` configurado: `SIM | NAO`
- Credenciais do modo ativo presentes: `SIM | NAO`

## Smoke real (obrigatorio)
- [ ] Checkout real executado
- [ ] `GET /api/payments/status/[paymentId]` coerente
- [ ] Webhook `approved` processado
- [ ] Webhook duplicado idempotente

## Amostra de conciliacao
- Total de transacoes testadas:
- Total sem divergencia por `providerReference`:
- IDs auditados (`paymentId` / `providerReference`):

## Janela de observacao (30-60 min)
- Taxa de erro checkout:
- Taxa de erro webhook:
- Divergencias detectadas:

## Resultado
- Status: `APROVADO | REPROVADO`
- Decisao:
- Proximo passo:

## Rollback (se aplicavel)
- Gatilho:
- Horario inicio rollback:
- Horario fim rollback:
- Duracao (min):
- Evidencia de retomada:
