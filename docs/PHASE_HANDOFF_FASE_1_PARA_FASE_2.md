# Passagem de Bastao - Fase 1 para Fase 2

Data de revisao: 2026-06-20

## Objetivo
Impedir que a evolucao da Fase 2 crie duplicidade, retrabalho ou arquitetura paralela sobre a venda ja definida na Fase 1.

## Principio central
A Fase 2 nao substitui a Fase 1.
A Fase 2 complementa a Fase 1.

Regra principal:
- Fase 2 nao cria novo produto, novo checkout, novo pedido ou novo pagamento.
- Fase 2 so pode adicionar contexto ao `CatalogItem` e ao `OrderItemSnapshot` quando essa extensao estiver comprovada no runtime.

Regra de leitura obrigatoria:
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` prevalece para decidir se uma capacidade da Fase 2 esta `IMPLEMENTADO`, `PARCIAL`, `PLANEJADO`, `AUSENTE`, `NAO PRESUMIR` ou `BLOQUEADO`;
- este handoff descreve a passagem de escopo, nao uma declaracao automatica de implementacao pronta.

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

## O que a Fase 2 pretende adicionar
- `MovementCampaign` basico: capacidade parcial comprovada
- `Organization / Movement`: ainda nao presumir como dominio maduro
- username publico unico e `/@username`: ainda nao presumir como fluxo fechado ponta a ponta
- `MovementCategory`: planejado
- `CampaignProduct` vinculado a `CatalogItem`: capacidade parcial comprovada
- contexto comercial de campanha no `OrderItemSnapshot`: capacidade parcial comprovada
- `ReferralLink`: capacidade parcial comprovada
- `ReferralEvent`: capacidade parcial comprovada
- `ReferralConversion`: capacidade parcial comprovada
- compradores com dados limitados: planejado
- arrecadacao do movimento: planejado

Capacidade parcial comprovada hoje significa:
- `/c/[campaignId]` e `/shop?campaignId=...` como superficies reais de atribuicao e vitrine filtrada
- `CampaignProduct` vinculando campanha ativa a `CatalogItem` publicado
- `OrderItemSnapshot` preservando `organizationId`, `campaignId`, `campaignName`, `campaignProgressivePriceRule`, `referralLinkId`, `affiliateUserId`, `movementMarkup` e `priceCompositionVersion`
- `/affiliate`, `/affiliate/links` e `/af/[slug]` sustentando link, clique e conversao automatica sem reward financeiro proprio

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
- Produto de movimento = `CatalogItem + Organization + MovementCampaign`, quando houver
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
