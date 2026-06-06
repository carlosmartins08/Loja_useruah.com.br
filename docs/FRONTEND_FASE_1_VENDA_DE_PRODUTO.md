# Frontend da Fase 1 - Venda de Produto

Data de revisao: 2026-06-05

## Objetivo
Definir como o escopo funcional da Fase 1 aparece na interface, sem criar funcionalidade nova fora da fase.

## Regra de precedencia
- `docs/FASE_1_VENDA_DE_PRODUTO.md` define escopo funcional.
- Este documento define UI, rotas, blocos, estados visuais e mensagens da Fase 1.
- Este documento nao cria novo estado, endpoint ou rota sem atualizacao da fonte normativa correspondente.

## Rotas canonicas da Fase 1
Publicas:
- `/`
- `/shop`
- `/product/[id]`
- `/cart`
- `/checkout`
- `/policies`
- `/contact`

Privadas do cliente:
- `/account`
- `/account/profile`
- `/account/addresses`
- `/account/orders`
- `/account/orders/[id]`
- `/account/support`
- `/account/settings`

Privadas do admin master:
- `/admin`
- `/admin/suppliers`
- `/admin/product-bases`
- `/admin/materials`
- `/admin/colors`
- `/admin/sizes`
- `/admin/printing-methods`
- `/admin/freight`
- `/admin/packaging`
- `/admin/catalog`
- `/admin/orders`
- `/admin/payments`
- `/admin/shipments`
- `/admin/support`
- `/admin/settings`

## O que o frontend nao deve exibir na Fase 1
Nao criar links, menus ou paginas ativas para:
- `/community`
- `/@username`
- `/affiliate`
- `/artist`
- `/supplier`
- `/curation`
- `/finance`
- `/production`

Tambem nao exibir:
- campanhas de movimento
- links afiliados
- painel do fornecedor
- painel do artista
- painel do afiliado

## Regra visual
O frontend da Fase 1 deve parecer:
- ecommerce publico vendavel
- area do cliente para pedidos e suporte
- area operacional do admin master

Nao deve parecer:
- ecossistema multiator completo
- plataforma de campanha ou marketplace de papeis
