# P3 Homologacao - Evidencia de Cutover e Rollback

Regra de nomenclatura:
- `P3` neste arquivo significa readiness operacional de pagamento real.
- `P3` aqui nao significa Fase 3 de produto.
- A Fase 3 oficial de produto esta definida separadamente em:
  - `docs/FASE_3_CATALOGO_ESCALAVEL_ARTE_CURADORIA_E_COMPOSICAO_CONTROLADA.md`

Data: YYYY-MM-DD  
Owner:  
Ambiente: homologacao  
Base URL homolog:  
Provider/Modo: `stripe`

Leitura obrigatoria:
- enquanto `Base URL homolog` apontar para `localhost`, o resultado correto dos dry-runs de cutover e go-live e `BLOCKED_EXTERNAL_BASE_URL`
- esta evidencia so pode ser marcada como aprovada quando a homolog final real estiver fora de `localhost`

## Pre-check
- [ ] `npm run check` PASS
- [ ] `npm run qa:provider:requirements` `READY_FOR_SMOKE`
- [ ] `npm run qa:payments21` PASS
- [ ] `npm run p3:precheck` PASS fora de localhost
- [ ] `npm run p3:plug` em dry-run coerente com o ambiente atual
- [ ] `npm run go:preflight` em dry-run coerente com o ambiente atual
- [ ] Credenciais minimas do modo escolhido preenchidas sem expor segredo em evidencias
- [ ] Validacao executada conforme `docs/FOLHA_OPERACIONAL_HOMOLOGACAO_GATEWAY_REAL.md`

## Configuracao validada
- `PAYMENT_PROVIDER`:
- `PAYMENT_GATEWAY_TARGET` (deve ficar vazio no recorte Stripe):
- `PAYMENT_PERSISTENCE`:
- `DATABASE_URL` inicia com `mysql://`: `SIM | NAO`
- `PAYMENT_STRIPE_WEBHOOK_SECRET` configurado: `SIM | NAO`
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
- Leitura do gate:
  - `BLOCKED_EXTERNAL_BASE_URL` = janela externa ainda nao aberta
  - `PASS` = janela externa real executada com evidencia valida

## Rollback (se aplicavel)
- Gatilho:
- Horario inicio rollback:
- Horario fim rollback:
- Duracao (min):
- Evidencia de retomada:
