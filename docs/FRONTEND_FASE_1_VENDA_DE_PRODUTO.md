# Frontend da Fase 1 - Venda de Produto

Data de revisao: 2026-06-17

## Objetivo
Definir como o escopo funcional da Fase 1 aparece na interface, sem criar funcionalidade nova fora da fase.

## Regra de precedencia
- `docs/FASE_1_VENDA_DE_PRODUTO.md` define escopo funcional.
- Este documento define UI, rotas, blocos, estados visuais e mensagens da Fase 1.
- Este documento nao cria novo estado, endpoint ou rota sem atualizacao da fonte normativa correspondente.
- `docs/ROUTES.md` segue como fonte unica para namespace canonico e redirects legados.

## Rotas canonicas da Fase 1
Publicas:
- `/`
- `/shop`
- `/product/[id]`
- `/cart`
- `/checkout`
- `/policies`
- `/quem-somos`
- `/returns`
- `/help-center`

Privadas do cliente:
- `/account`
- `/account/addresses`
- `/account/orders`
- `/account/orders/[id]`
- `/account/support`
- `/account/returns`
- `/account/wishlist`
- `/account/wallet`

Operacionais internas:
- `/admin`
- `/admin/catalog`
- `/admin/orders`
- `/admin/payments/connectors`
- `/admin/registrations`
- `/support`
- `/support/tickets`
- `/support/[orderId]`
- `/production`
- `/production/jobs`
- `/finance`
- `/finance/payouts`

## O que o frontend nao deve exibir na Fase 1
Nao criar links ou menus na navegacao publica e na area do cliente para:
- `/community`
- `/@username`
- `/affiliate`
- `/artist`
- `/supplier`
- `/curation`

Tambem nao exibir:
- campanhas de movimento
- links afiliados
- painel do fornecedor
- painel do artista
- painel do afiliado

Tambem nao reintroduzir aliases legados como superficie interna; quando houver compatibilidade transitoria, ela deve existir apenas como redirect normativo em `docs/ROUTES.md`.

## Regra visual
O frontend da Fase 1 deve parecer:
- ecommerce publico vendavel
- area do cliente para pedidos e suporte
- area operacional interna separada por namespace canonico

Nao deve parecer:
- ecossistema multiator completo
- plataforma de campanha ou marketplace de papeis
