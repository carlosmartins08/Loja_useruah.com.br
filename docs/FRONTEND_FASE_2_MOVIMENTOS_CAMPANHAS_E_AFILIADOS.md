# Frontend da Fase 2 - Movimentos, Campanhas e Afiliados

Data de revisao: 2026-06-08

## Objetivo
Definir como o escopo funcional da Fase 2 pode aparecer na interface sem quebrar a Fase 1 e sem prometer superficies que o runtime ainda nao fechou.

## Regra de precedencia
- `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md` define o escopo funcional.
- `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md` define as proibicoes estruturais.
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` define o que esta `IMPLEMENTADO`, `PARCIAL`, `PLANEJADO`, `AUSENTE`, `NAO PRESUMIR` ou `BLOQUEADO`.
- Este documento define apenas UI, blocos, mensagens, estados visuais e comportamento de tela.

## Principio geral
A Fase 2 deve adicionar contexto comunitario a venda quando houver implementacao comprovada:
- Fase 1: loja publica vende produto
- Fase 2: movimento cria vitrine, campanha, divulgacao e arrecadacao sobre produtos vendaveis

## Camadas visuais previstas
- vitrine publica do movimento `/@username`
- area privada do movimento `/community`
- area privada de afiliado `/affiliate`, quando ativada

Regra de leitura:
- a presenca de uma rota neste documento nao prova que o dominio correspondente esteja maduro no runtime;
- quando a matriz marcar `NAO PRESUMIR`, a rota deve ser lida como intencao de fase, nao como capacidade fechada.

A Fase 1 continua existindo:
- `/shop`
- `/product/[id]`
- `/cart`
- `/checkout`
- `/account`
- `/admin`

## Rotas canonicas de intencao da Fase 2
Publicas planejadas:
- `/@username`
- `/@username/campaigns/[campaignSlug]`
- `/@username/products/[productId]`
- `/@username/categories/[categorySlug]`

Privadas do movimento, quando implementadas:
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

Privadas do afiliado, quando implementadas:
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
