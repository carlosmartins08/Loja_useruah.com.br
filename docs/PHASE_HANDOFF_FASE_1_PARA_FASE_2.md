# Passagem de Bastao - Fase 1 para Fase 2

Data de revisao: 2026-06-05

## Objetivo
Impedir que a evolucao da Fase 2 crie duplicidade, retrabalho ou arquitetura paralela sobre a venda ja definida na Fase 1.

## Principio central
A Fase 2 nao substitui a Fase 1.
A Fase 2 complementa a Fase 1.

Regra principal:
- Fase 2 nao cria novo produto, novo checkout, novo pedido ou novo pagamento.
- Fase 2 adiciona contexto ao `CatalogItem` e ao `OrderItemSnapshot`.

## O que a Fase 1 entrega
- `CatalogItem` publicado
- `/shop`
- `/product/[id]`
- `/cart`
- `/checkout`
- `Order`
- `OrderItem`
- `OrderItemSnapshot`
- `Payment`
- `Shipment`
- `/account`
- `/admin`

Essa base nao deve ser reimplementada pela Fase 2.

## O que a Fase 2 adiciona
- `Organization / Movement`
- username publico unico
- `/@username`
- `Campaign`
- `MovementCategory`
- `MovementMarkup`
- `ReferralLink`
- `ReferralEvent`
- `ReferralConversion`
- compradores com dados limitados
- arrecadacao do movimento

Esse contexto deve ser acoplado ao fluxo de venda existente, nao duplicado.

## Proibicoes estruturais
E proibido implementar na Fase 2:
- `MovementProduct` como produto paralelo ao `CatalogItem`
- `MovementCheckout` como checkout paralelo
- `MovementOrder` como pedido paralelo
- `MovementPayment` como pagamento paralelo
- `MovementCart` como carrinho separado
- `ReferralOrder` como pedido separado
- `CampaignProduct` sem relacao com `CatalogItem`

## Regras obrigatorias
- Produto de movimento = `CatalogItem + Organization + Campaign`, quando houver
- Checkout continua em `/cart` e `/checkout`
- Pedido continua em `Order`
- Item continua em `OrderItem`
- Snapshot continua em `OrderItemSnapshot`
- Pedido de movimento deve aparecer em `/account` como pedido normal do cliente
- `/@username` e canal de descoberta e contexto, nao checkout proprio

## Regressao proibida
A Fase 2 nao pode quebrar:
- `/shop`
- `/product/[id]`
- `/cart`
- `/checkout`
- `/account/orders/[id]`
- `/admin/orders`
- `OrderItemSnapshot` da Fase 1
- traducao de status para cliente
- ocultacao de fornecedor, custo e margem

Qualquer implementacao da Fase 2 deve validar que a Fase 1 continua funcionando.
