# Fase 3 - Catalogo Escalavel, Arte, Curadoria e Composicao Controlada

Data de revisao: 2026-06-08

## Objetivo
Definir o escopo funcional oficial da Fase 3 sem inventar maturidade que o runtime atual ainda nao provou.

## Regra de precedencia
- `docs/FASE_1_VENDA_DE_PRODUTO.md` continua mandando no fluxo base de venda.
- `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md` continua mandando na passagem Fase 1 -> Fase 2.
- `docs/PHASE_HANDOFF_FASE_2_PARA_FASE_3.md` define a passagem oficial Fase 2 -> Fase 3.
- `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md` continua sendo a fonte normativa do dominio de catalogo e curadoria.
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` e a reconciliacao referencial de maturidade entre documento e runtime.

## Regra central
Fase 1 vende.
Fase 2 contextualiza quando houver camada comunitaria real.
Fase 3 qualifica a origem da oferta sem criar produto, checkout, pedido ou pagamento paralelos.

## Status desta fase no repositorio atual
- Fase 3 oficial: definida documentalmente neste arquivo.
- Maturidade atual do runtime: `PARCIAL`.
- Regra pratica:
  - pode haver consolidacao documental e evolucao controlada do dominio que ja existe
  - nao pode haver expansao aspiracional que trate supplier completo, snapshot expandido ou versionamento pleno como se ja fossem base madura

## O que a Fase 3 e
Fase 3, neste repositorio, e a consolidacao de:
- `artist` como origem de criacao
- `artwork` como insumo curavel
- `curation` como validacao de criacao
- `catalog-item` como produto vendavel unico
- composicao controlada de item publicado
- `impact-review` minimo em alteracoes sensiveis que ja tocam catalogo ou campanha

## O que a Fase 3 nao e
Fase 3 nao e, neste momento:
- portal maduro completo de supplier como fonte canonica da matriz produtiva
- ecossistema completo de `ProductBase`, `Material`, `PriceTable` e `FreightRule` versionados
- expansao automatica de `DecisionLog` para qualquer decisao sensivel de oferta
- expansao do `OrderItemSnapshot` com contexto da Fase 2 ainda nao implementado
- nova loja, novo checkout, novo pedido, novo pagamento ou novo `Product`

## Superficies validas da Fase 3 hoje
- `/artist`
- `/curation`
- `/api/artworks`
- `/api/artworks/[id]/approve`
- `/api/artworks/[id]/reject`
- `/api/catalog-items`
- `/api/catalog-items/[id]/ready`
- `/api/catalog-items/[id]/publish`
- `/api/catalog-items/[id]/unpublish`
- `/api/catalog-items/[id]/reopen`

## Superficies que existem, mas nao devem ser superpromovidas documentalmente
- `/supplier`
  - hoje deve ser tratado como superficie de papel reaproveitada do runtime atual
  - nao como prova de dominio maduro de matriz produtiva
- `/artist`
  - existe como superficie de papel
  - nao prova sozinho portfolio, colecoes, versionamento ou monetizacao completos
- `/curation`
  - existe como superficie de papel
  - nao prova sozinho backlog completo de revisao com todos os estados aspiracionais

## Estados oficiais que a Fase 3 pode usar agora
Para `Artwork`, usar apenas os estados provados no runtime atual:
- `submitted`
- `under_review`
- `approved`
- `rejected`

Regra:
- qualquer ampliacao para `draft`, `pending_review`, `adjustment_requested` ou `archived` exige mudanca deliberada em:
  - `docs/STATE_MACHINES.md`
  - runtime
  - QA
- ate la, a Fase 3 nao pode descrever esses estados como base oficial

## O que entra na Fase 3 agora
- submissao de `Artwork` por papel compativel
- fila de curadoria baseada no runtime atual
- aprovacao e rejeicao de `Artwork` com trilha
- bloqueio de publicacao de `CatalogItem` quando a arte nao estiver aprovada
- composicao controlada de `CatalogItem` usando `Artwork` aprovado e variantes validas
- uso do `CatalogItem` publicado pela loja atual e por campanhas ja existentes no que o runtime realmente suportar
- `ImpactReview` minimo onde ja houver ligacao real com catalogo ou campanha

## O que fica fora da Fase 3 agora
- supplier completo como dominio maduro de cadastro produtivo
- `ProductBaseVersion`
- `MaterialVersion`
- `PriceTableVersion`
- `FreightRuleVersion`
- `ProductionRuleVersion`
- `CommissionRuleVersion`
- snapshot expandido da Fase 2 ainda nao implementado
- `DecisionLog` generico de oferta
- publicacao automatica por supplier
- publicacao automatica por artist

## Relacao com a Fase 1
Continuam preservados e obrigatorios:
- `/shop`
- `/product/[id]`
- `/cart`
- `/checkout`
- `/account`
- `/admin`
- `CatalogItem`
- `Order`
- `OrderItem`
- `OrderItemSnapshot`
- `Payment`
- `Shipment`

Regra:
- a Fase 3 melhora a qualidade da origem da oferta
- ela nao muda o fluxo base de compra

## Relacao com a Fase 2
A Fase 3 so pode consumir capacidade da Fase 2 que ja esteja implementada e validada.

Regra dura:
- nao presumir como base pronta:
  - `Organization`
  - `CampaignProduct`
  - `ReferralLink`
  - `ReferralConversion`
  - snapshot contextualizado da Fase 2
- usar `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` antes de declarar dependencia obrigatoria da Fase 2

## Atores ativos desta fase
### `artist`
- pode enviar `Artwork`
- pode acompanhar status de curadoria
- nao pode aprovar a propria arte
- nao pode publicar `CatalogItem`

### `curator`
- pode revisar `Artwork`
- pode aprovar ou rejeitar `Artwork`
- nao pode alterar preco
- nao pode publicar produto final sem fluxo administrativo

### `platform_admin`
- pode intervir no fluxo
- pode compor e publicar `CatalogItem`
- pode atuar em `ImpactReview` quando a regra atual exigir

### `supplier`
- permanece como papel existente no runtime
- nao deve ser tratado, nesta fase oficial, como dono de uma matriz produtiva madura ainda nao provada

## Criterios P0 desta fase
- `P0-F3-01` `artist` acessa a superficie de papel prevista
- `P0-F3-02` `Artwork` pode ser enviada via runtime atual
- `P0-F3-03` `Artwork` entra em estados oficiais atuais, sem nomenclatura paralela
- `P0-F3-04` `curator` aprova ou rejeita com trilha
- `P0-F3-05` `CatalogItem` nao pode ser publicado sem arte compativel
- `P0-F3-06` item publicado continua aparecendo em `/shop`
- `P0-F3-07` cliente continua comprando pelo fluxo da Fase 1
- `P0-F3-08` nenhuma acao desta fase cria checkout, pedido ou pagamento paralelos
- `P0-F3-09` `npm run check` continua `PASS`
- `P0-F3-10` regressao de Fase 1 continua proibida

## Documentos obrigatorios em conjunto
- `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`
- `docs/PHASE_HANDOFF_FASE_2_PARA_FASE_3.md`
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md`
- `docs/STATE_MACHINES.md`
- `docs/API_CONTRACTS.md`
- `docs/QA_ACCEPTANCE_TESTS.md`

## Regra final
A documentacao da Fase 3 nao pode descrever o produto desejado como se ele ja fosse o produto implementado.
