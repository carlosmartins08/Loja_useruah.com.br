# Fase 2 - Movimentos, Campanhas e Afiliados

Data de revisao: 2026-06-08

## Objetivo
Definir o escopo funcional oficial da Fase 2 sobre a venda ja provada na Fase 1, sem fazer o texto parecer mais maduro do que o runtime atual.

## Regra de precedencia
- `docs/FASE_1_VENDA_DE_PRODUTO.md` continua mandando na Fase 1.
- `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md` define a regra estrutural da passagem.
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` define o que pode ser tratado como `IMPLEMENTADO`, `PARCIAL`, `PLANEJADO`, `AUSENTE`, `NAO PRESUMIR` ou `BLOQUEADO`.
- `docs/EXECUTION_TRACKING.md` registra a maturidade operacional mais recente.
- Este documento define o escopo funcional oficial da Fase 2.

## Regra central
Fase 1 vende.
Fase 2 contextualiza.
Nada e duplicado.
Tudo preserva o fluxo base de compra.

Leitura obrigatoria:
- escopo de fase nao equivale a implementacao comprovada;
- quando runtime e documento divergirem, prevalece a matriz e o tracking.

## Proibicoes estruturais
A Fase 2 nao deve criar:
- novo `Product` paralelo
- novo checkout paralelo
- novo `Order` paralelo
- novo `Payment` paralelo
- novo carrinho paralelo

Produto de movimento deve ser tratado como:
- `CatalogItem + Organization + MovementCampaign`, quando houver

Pedido de movimento continua sendo:
- `Order + OrderItem + OrderItemSnapshot`

Checkout continua sendo:
- `/cart`
- `/checkout`

## Contexto adicional planejado para o snapshot
Quando a extensao da Fase 2 for implementada de forma real, `OrderItemSnapshot` deve receber:
- `organizationId`
- `organizationUsername`
- `campaignId`
- `campaignName`
- `movementMarkup`
- `referralLinkId`
- `affiliateUserId`
- `priceCompositionVersion`

Estado atual reconhecido:
- o snapshot oficial ainda e o da Fase 1, com `snapshotVersion=phase1-v1`;
- esta extensao nao pode ser tratada como capacidade pronta antes de existir no runtime.

## O que entra como escopo oficial da fase
- `MovementCampaign` basico: capacidade parcial no runtime atual
- `Organization / Movement`: escopo previsto, ainda nao comprovado como dominio maduro
- username publico unico e vitrine `/@username`: escopo previsto, ainda nao comprovado ponta a ponta
- categorias internas de movimento: escopo previsto
- links rastreaveis e afiliacao: escopo previsto, ainda nao comprovado como dominio runtime
- arrecadacao e contexto comercial do movimento: escopo previsto, dependente de implementacao adicional

## O que fica fora
- supplier com painel proprio como frente primaria da fase
- supplier API visivel ao consumidor
- split financeiro completo em UI publica
- payout automatizado completo sem validacao financeira previa
- BI avancado e gamificacao pesada

## Regra de protecao
Qualquer implementacao da Fase 2 deve validar que a Fase 1 continua funcionando sem regressao.
