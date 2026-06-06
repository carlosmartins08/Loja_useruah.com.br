# Frontend da Fase 2 - Movimentos, Campanhas e Afiliados

Data de revisao: 2026-06-05

## Objetivo
Definir como o escopo funcional da Fase 2 aparece na interface sem quebrar a Fase 1.

## Regra de precedencia
- `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md` define o escopo funcional.
- `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md` define as proibicoes estruturais.
- Este documento define apenas UI, blocos, mensagens, estados visuais e comportamento de tela.

## Principio geral
A Fase 2 adiciona contexto comunitario a venda:
- Fase 1: loja publica vende produto
- Fase 2: movimento cria vitrine, campanha, divulgacao e arrecadacao sobre produtos vendaveis

## Camadas visuais adicionadas
- vitrine publica do movimento `/@username`
- area privada do movimento `/community`
- area privada de afiliado `/affiliate`, quando ativada

A Fase 1 continua existindo:
- `/shop`
- `/product/[id]`
- `/cart`
- `/checkout`
- `/account`
- `/admin`

## Rotas canonicas da Fase 2
Publicas:
- `/@username`
- `/@username/campaigns/[campaignSlug]`
- `/@username/products/[productId]`
- `/@username/categories/[categorySlug]`

Privadas do movimento:
- `/community`
- `/community/public-page`
- `/community/categories`
- `/community/campaigns`
- `/community/campaigns/new`
- `/community/campaigns/[id]`
- `/community/products`
- `/community/links`
- `/community/orders`
- `/community/buyers`
- `/community/revenue`
- `/community/settings`

Privadas do afiliado:
- `/affiliate`
- `/affiliate/links`
- `/affiliate/conversions`
- `/affiliate/rewards`
- `/affiliate/settings`

## O que nao deve aparecer ainda
- supplier com login proprio como frente principal
- supplier API visivel ao usuario
- split financeiro completo em UI publica
- payout automatizado completo sem backend financeiro validado

## Regra de reaproveitamento
A pagina de produto no contexto do movimento deve reaproveitar a logica da PDP da Fase 1, adicionando apenas contexto de movimento.
