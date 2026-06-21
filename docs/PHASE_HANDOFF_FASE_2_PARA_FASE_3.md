# Passagem de Bastao - Fase 2 para Fase 3

Data de revisao: 2026-06-20

## Objetivo
Definir a passagem oficial entre a Fase 2 e a Fase 3 sem presumir maturidade que o runtime atual ainda nao provou.

## Regra de precedencia
- `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md` continua definindo o escopo funcional oficial da Fase 2.
- `docs/FASE_3_CATALOGO_ESCALAVEL_ARTE_CURADORIA_E_COMPOSICAO_CONTROLADA.md` define o escopo funcional oficial da Fase 3.
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` e a reconciliacao obrigatoria de maturidade entre fase, dominio e runtime.

## Principio central da passagem
A Fase 3 nao substitui a Fase 2.
A Fase 3 so pode se apoiar em capacidades da Fase 2 que ja estejam implementadas e validadas.

Regra principal:
- Fase 3 nao altera a logica de movimento, campanha, checkout, pedido ou pagamento.
- Fase 3 melhora a cadeia de oferta que pode alimentar `CatalogItem`.
- nenhuma dependencia da Fase 2 pode ser tratada como base pronta sem aparecer como `IMPLEMENTADO` na matriz unica.

## O que a passagem preserva obrigatoriamente
- `CatalogItem` como produto vendavel unico
- `/shop`
- `/product/[id]`
- `/cart`
- `/checkout`
- `Order`
- `OrderItem`
- `OrderItemSnapshot`
- campanhas e contexto comunitario apenas no nivel realmente implementado

## O que a Fase 3 pode adicionar sem quebrar a Fase 2
- `Artwork` revisado e aprovado
- composicao controlada de `CatalogItem`
- `artist` como origem de criacao
- `curation` como mesa de revisao
- `ImpactReview` minimo onde o runtime atual ja ligar oferta e risco operacional

## O que a passagem proibe
- `SupplierProduct` publico paralelo ao `CatalogItem`
- `ArtistProduct` publico paralelo ao `CatalogItem`
- checkout paralelo
- pedido paralelo
- pagamento paralelo
- nova logica de campanha paralela
- presumir snapshot contextualizado da Fase 2 onde ele ainda nao existe no runtime

## Capacidades da Fase 2 que nao podem ser presumidas como base pronta
A Fase 3 nao pode depender estruturalmente de:
- `Organization` madura
- membership formal de movimento
- username publico unico e jornada `/@username` fechada ponta a ponta
- `organizationUsername` persistido no `OrderItemSnapshot`
- reward financeiro proprio de afiliado

## Capacidades parciais da Fase 2 que a Fase 3 pode consumir com restricao
- `CampaignProduct` real, mas ainda parcial, como vinculo entre campanha ativa e `CatalogItem` publicado
- `ReferralLink`, `ReferralEvent` e `ReferralConversion` como atribuicao real, mas sem ledger ou payout proprio de afiliado
- `organizationId`, `campaignId`, `campaignName`, `campaignProgressivePriceRule`, `referralLinkId`, `affiliateUserId`, `movementMarkup` e `priceCompositionVersion` no `OrderItemSnapshot` apenas no contrato parcial ja provado

## Regra para consumo de capacidade parcial da Fase 2
Se uma capacidade da Fase 2 estiver `PARCIAL`, a Fase 3 so pode:
- reaproveitar o que o runtime ja faz
- evitar prometer essa capacidade como base fechada de arquitetura
- declarar a restricao explicitamente no documento da fase e no PR

## Relacao correta entre Fase 2 e Fase 3
Fluxo correto:
1. Fase 1 vende
2. Fase 2 contextualiza a venda somente no que ja existir de verdade
3. Fase 3 melhora a origem da oferta sem recriar a camada de venda nem a camada comunitaria

## Gate minimo antes de implementar bloco de Fase 3
1. Fase 1 continua preservada
2. `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` atualizado
3. Dependencias da Fase 2 marcadas como `IMPLEMENTADO` ou `PARCIAL` conscientemente aceitas
4. nenhuma dependencia `NAO PRESUMIR` tratada como pronta
5. `npm run check` continua `PASS`

## Criterios P0 de passagem
- `P0-HANDOFF-F3-01` produto comum da Fase 1 continua compravel
- `P0-HANDOFF-F3-02` campanha existente da Fase 2 continua sem regressao no que o runtime atual suportar
- `P0-HANDOFF-F3-03` Fase 3 nao cria checkout, pedido ou pagamento paralelos
- `P0-HANDOFF-F3-04` `CatalogItem` continua sendo a unidade vendavel unica
- `P0-HANDOFF-F3-05` `Artwork` aprovada pode compor item publicado no fluxo atual
- `P0-HANDOFF-F3-06` arte rejeitada continua impedindo publicacao quando a regra atual exigir
- `P0-HANDOFF-F3-07` capacidades da Fase 2 marcadas como `NAO PRESUMIR` nao sao tratadas como base pronta
- `P0-HANDOFF-F3-08` `npm run check` continua `PASS`

## Regra final
O handoff Fase 2 -> Fase 3 nao autoriza fantasia arquitetural.
Ele so autoriza evolucao sobre capacidades que o repositorio atual consegue demonstrar.
