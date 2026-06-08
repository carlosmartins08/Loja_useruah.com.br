# Plano Mestre de Continuidade Tecnica

Data de revisao: 2026-06-08
Owner: Produto + Engenharia

## Objetivo
Definir um quadro unico de continuidade para o projeto evoluir sem reabrir fase, sem duplicar dominio e sem tratar documento aspiracional como realidade do runtime.

## Regra de precedencia
- Este documento nao redefine fase de produto.
- Escopo oficial da fase atual continua em `docs/FASE_1_VENDA_DE_PRODUTO.md`.
- Maturidade real continua em `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` e `docs/EXECUTION_TRACKING.md`.
- Pagamento real continua na trilha transversal `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md`.

## Quadro unico de continuidade

### Agora
- Fase 1 comercial: `IMPLEMENTADO` em ambiente controlado.
- Fase 1 funcional: fechada.
- `auth/session`: liberado com `qa:auth:cookie: PASS`.
- Pagamento real Stripe: `GO CONDICIONADO`.
- Condicionante atual da Stripe:
  - nao e auth
  - nao e credencial
  - nao e provider no recorte homologado
  - e aceite final de producao e readiness operacional real
- Evidencias da trilha Stripe homologada:
  - `npm run p3:precheck`: PASS
  - `npm run qa:stripe:smoke`: PASS
  - `npm run qa:provider:activate`: PASS
  - `npm run check`: PASS
  - `npm run build`: PASS
  - `npm run qa:functional`: PASS
- `gateway_real` generico: `PLANEJADO` como bridge futura.
- `pix`: fora do recorte imediato.
- Fase 2: fechada para execucao ate nova evidencia objetiva.
- Fase 3: fechada para execucao como frente principal ate nova evidencia objetiva.

### Depois do aceite final de producao Stripe
- Registrar evidencia operacional e manter a Fase 1 como baseline vendavel.
- Abrir no maximo 1 recorte de evolucao por vez.
- O primeiro recorte elegivel de produto continua sendo Fase 2 em cima do que a matriz marcar como `IMPLEMENTADO` ou `PARCIAL` conscientemente aceito.
- No estado atual do runtime, o unico ponto com base minimamente utilizavel e `MovementCampaign` basico.

### O que continua proibido
- criar produto paralelo ao `CatalogItem`
- criar checkout paralelo
- criar `Order`, `Payment` ou `Cart` paralelos
- abrir Fase 3 como frente principal antes de consolidar o que a Fase 2 realmente tem
- tratar `Organization`, `CampaignProduct`, `Referral*` ou snapshot expandido como base pronta
- mexer em codigo para compensar ambiente Stripe incompleto
- reabrir documentacao sem evidencia nova

## Sequencia oficial de continuidade

### Etapa 1 - Stripe
Executar somente quando as credenciais Stripe de homologacao existirem no ambiente seguro:

```text
npm run p3:precheck
npm run qa:stripe:smoke
npm run qa:provider:activate
npm run check
npm run build
npm run qa:functional
```

Saida permitida:
- `GO`
- `GO CONDICIONADO`
- `NO-GO`

Regra:
- sem credenciais validas, o codigo continua congelado

### Etapa 2 - Baseline
Se a Etapa 1 terminar em `GO` ou `GO CONDICIONADO` sem risco de regressao de fluxo:
- atualizar `docs/EXECUTION_TRACKING.md`
- atualizar `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` se a maturidade real subir
- registrar decisao em `docs/CHANGELOG_GOVERNANCE.md`
- distinguir explicitamente:
  - Fase 1 funcional fechada
  - Fase 1 producao ainda condicionada ate aceite final de producao

### Etapa 3 - Proximo recorte de produto
So pode abrir novo recorte quando todas as condicoes abaixo forem verdadeiras:
- Fase 1 continua preservada
- Stripe concluiu aceite final de producao e readiness operacional real
- o recorte cabe em 1 unico dominio
- nenhuma dependencia `NAO PRESUMIR` esta sendo tratada como pronta

## Regra de escolha do proximo recorte
Pergunta obrigatoria:

```text
o proximo passo depende de capacidade IMPLEMENTADA ou PARCIAL validada?
```

Se a resposta for `nao`, o recorte nao abre.

## Melhor proximo recorte quando Stripe estiver resolvida
Pelo estado atual das docs e do runtime:
- Fase 2 continua sendo a frente correta
- o recorte mais coerente e estreito e `MovementCampaign` basico
- qualquer expansao para `Organization`, `Referral*`, snapshot contextualizado ou supplier completo deve esperar prova runtime

## Checklist anti-retrabalho
- usar `docs/FASE_1_VENDA_DE_PRODUTO.md` para escopo da base vendavel
- usar `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md` para proibicoes estruturais da Fase 2
- usar `docs/PHASE_HANDOFF_FASE_2_PARA_FASE_3.md` para proibicoes estruturais da Fase 3
- usar `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` antes de promover qualquer capacidade como base pronta
- usar `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md` para tudo que for pagamento real

## Regra final
O projeto so continua de forma coerente se cada etapa provar a anterior.

Sem prova Stripe:
- nao existe Fase 2 honesta em execucao.

Sem base Fase 2 realmente validada:
- nao existe Fase 3 honesta em execucao.
