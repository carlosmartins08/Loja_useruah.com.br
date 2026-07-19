# Plano de Desenvolvimento Backend

Data de revisao: 2026-07-07

## Objetivo
Organizar a evolucao do backend por contrato, estado, persistencia e prova operacional, sem tratar recorte validado como backend completo.

## Escopo
Este plano cobre:
- auth/session
- orders
- checkout
- payments
- webhook
- persistencia
- QA/Gates
- readiness de producao

## Fonte normativa
- `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md`
- `docs/PAYMENTS_DEFINITION_OF_DONE.md`
- `docs/ORDERS_LOGISTICS_DEFINITION_OF_DONE.md`
- `docs/STATE_MACHINES.md`
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
- `docs/EXECUTION_TRACKING.md`

## Estado atual real
### PRONTO E FUNCIONAL
- `auth/session` com `ruah_session` real provado no fluxo de pagamento
- `orders` vinculado ao ator correto no fluxo validado
- `checkout` iniciado com sessao autentica e ownership checado
- `payments` com inicio de cobranca, status e idempotencia validados
- `webhook` com prova de assinatura e reenvio sem duplicidade
- `QA/Gates` com `check`, `build` e `qa:payments21:readiness` em `PASS`

### ALINHADO
- `auth/session`
- `orders`
- `checkout`
- `payments`
- `webhook`
- `QA/Gates`

### PARCIAL
- persistencia fora do recorte validado
- observabilidade ampliada
- reconciliacao fora do gate forte ja provado
- superficies adjacentes de operacao que dependem da janela real

### BLOQUEADO
- readiness de producao
- aceite final de producao
- cutover real

### FALTANTE
- `Movement` canônico

### NÃO PRESUMIR
- que build/check/gate forte equivalem a producao liberada
- que `qa:payments21` local/sandbox prova readiness forte

## Principios
- backend bom e backend provado sao coisas diferentes
- contrato vem antes de otimismo
- idempotencia e ownership valem mais do que parecer pronto
- o recorte Stripe/mysql nao encerra a discussao de producao

## Sequencia de desenvolvimento
1. Manter travas de auth, ownership e contrato
2. Fechar persistencia e reconciliacao no recorte validado
3. Aumentar observabilidade sem mudar contrato
4. Separar com nitidez sandbox, readiness e cutover
5. Executar janela real de homologacao quando os insumos existirem

## Critérios de aceite
- `auth/session` real reconhecido
- pedido vinculado ao ator correto
- checkout bloqueia uso indevido
- payments e webhook mantem idempotencia
- status e conciliacao batem com `providerReference`
- os gates oficiais passam sem fallback fraco

## Gates minimos
- `npm run check`
- `npm run build`
- `npm run qa:payments21:readiness`

## Riscos principais
- transformar gate local em prova de readiness
- aceitar fallback de header como prova principal
- tratar webhook ou persistencia parcial como encerramento
- abrir Fase 2 antes do bloqueio ser realmente resolvido

## Próxima ação unica
Tratar qualquer nova mudanca de backend como extensao controlada do contrato atual, ou manter bloqueio ate a janela real de homologacao final.
