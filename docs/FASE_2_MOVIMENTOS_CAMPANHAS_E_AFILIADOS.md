# Fase 2 - Movimentos, Campanhas e Afiliados

Data de revisao: 2026-06-05

## Objetivo
Adicionar contexto comunitario, campanha e afiliacao sobre a venda ja provada na Fase 1, sem duplicar produto, carrinho, checkout, pedido ou pagamento.

## Regra de precedencia
- `docs/FASE_1_VENDA_DE_PRODUTO.md` continua mandando na Fase 1.
- `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md` define a regra estrutural da passagem.
- Este documento define o escopo funcional oficial da Fase 2.

## Regra central
Fase 1 vende.
Fase 2 contextualiza.
Nada e duplicado.
Tudo preserva o fluxo base de compra.

## Proibicoes estruturais
A Fase 2 nao deve criar:
- novo `Product` paralelo
- novo checkout paralelo
- novo `Order` paralelo
- novo `Payment` paralelo
- novo carrinho paralelo

Produto de movimento deve ser tratado como:
- `CatalogItem + Organization + Campaign`, quando houver

Pedido de movimento continua sendo:
- `Order + OrderItem + OrderItemSnapshot`

Checkout continua sendo:
- `/cart`
- `/checkout`

## Contexto adicional esperado no snapshot
Quando aplicavel, `OrderItemSnapshot` deve receber:
- `organizationId`
- `organizationUsername`
- `campaignId`
- `campaignName`
- `movementMarkup`
- `referralLinkId`
- `affiliateUserId`
- `priceCompositionVersion`

## O que entra
- `Organization / Movement`
- username publico unico
- vitrine publica `/@username`
- campanhas de movimento
- categorias internas de movimento
- links rastreaveis e afiliacao
- arrecadacao e contexto comercial do movimento

## O que fica fora
- supplier com painel proprio como frente primaria da fase
- supplier API visivel ao consumidor
- split financeiro completo em UI publica
- payout automatizado completo sem validacao financeira previa
- BI avancado e gamificacao pesada

## Regra de protecao
Qualquer implementacao da Fase 2 deve validar que a Fase 1 continua funcionando sem regressao.
