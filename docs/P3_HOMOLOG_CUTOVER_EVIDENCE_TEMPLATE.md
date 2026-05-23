# P3 Homologacao - Evidencia de Cutover e Rollback

Data: YYYY-MM-DD  
Owner:  
Ambiente: homologacao  
Base URL homolog:  
Provider: `gateway_real`

## Pre-check
- [ ] `npm run check` PASS
- [ ] `npm run qa:payments21` PASS
- [ ] `npm run p3:precheck` PASS

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
