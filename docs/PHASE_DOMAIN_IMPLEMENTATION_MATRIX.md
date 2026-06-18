# Phase Domain Implementation Matrix

Data de revisao: 2026-06-18

## Objetivo
Criar uma visao unica de realidade entre fase, dominio, entidade, superficie e maturidade atual, para impedir que a documentacao presuma implementacao que o runtime ainda nao provou.

## Regra de uso
- Este documento e `normativo` para leitura de maturidade e reconciliacao entre documento e runtime.
- Ele nao substitui o escopo normativo de fase ou dominio, mas e a fonte obrigatoria para decidir o que pode ou nao ser tratado como base real de continuidade.
- Em caso de conflito de regra, prevalecem:
  1. `docs/EXECUTION_CONSOLIDATED_MASTER.md`
  2. documento oficial da fase
  3. documento oficial do dominio
- Em caso de conflito de maturidade, prevalece o runtime validado mais recente registrado em:
  - `docs/EXECUTION_TRACKING.md` como snapshot/evidencia recente
  - gates oficiais
  - codigo atual

## Legenda
- `IMPLEMENTADO`: implementado e ja validado de forma objetiva no repositorio atual
- `PARCIAL`: existe base de codigo, rota ou UX, mas ainda sem fechamento completo
- `PLANEJADO`: existe como intencao oficial de fase, mas ainda sem prova suficiente de runtime para ser tratado como base real
- `AUSENTE`: nao existe implementacao suficiente para ser tratada como base real
- `NAO PRESUMIR`: a documentacao cita, mas o runtime atual nao sustenta a suposicao como capacidade madura
- `BLOQUEADO`: existe trilha ou readiness documentados, mas a execucao real segue bloqueada por ambiente, dependencia externa ou precondicao objetiva

## Matriz unica

| Classificacao | Dominio | Entidade / Capacidade | Superficie principal | Status documental | Status runtime | Fonte canonica | Decisao atual |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Fase 1 | venda | `CatalogItem` publicado | `/shop`, `/product/[id]`, `/api/catalog-items` | `IMPLEMENTADO` | `IMPLEMENTADO` | `docs/FASE_1_VENDA_DE_PRODUTO.md`, `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md` | manter como base unica de venda |
| Fase 1 | venda | `Order` + checkout | `/cart`, `/checkout`, `/api/orders`, `/api/payments/*` | `IMPLEMENTADO` | `IMPLEMENTADO` | `docs/FASE_1_VENDA_DE_PRODUTO.md`, `docs/PAYMENTS_DEFINITION_OF_DONE.md` | nao duplicar em fases posteriores |
| Fase 1 | venda | `OrderItemSnapshot` fase atual | checkout e status do pedido | `IMPLEMENTADO` | `IMPLEMENTADO` com `snapshotVersion=phase1-v1` | `docs/FASE_1_VENDA_DE_PRODUTO.md`, `lib/order-store.ts` | manter e nao inventar extensoes nao implementadas |
| Fase 1 | suporte | ticket e contexto 360 | `/account/support`, `/api/tickets`, `/api/support/orders/[orderId]/context` | `IMPLEMENTADO` | `IMPLEMENTADO` | `docs/SUPPORT_TICKETS_DEFINITION_OF_DONE.md` | manter como suporte minimo oficial |
| Fase 2 | campanhas | `MovementCampaign` basico | `/community/campaigns`, `/api/campaigns` | `PARCIAL` | `PARCIAL` | `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `lib/campaign-store.ts` | tratar como camada parcial, nao como ecossistema completo |
| Fase 2 | movimento | `Organization` / membership | superfice documental, sem dominio runtime equivalente confirmado | `PLANEJADO` | `NAO PRESUMIR` | `docs/BACKEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md` | nao usar como premissa de handoff sem prova runtime |
| Fase 2 | distribuicao | `CampaignProduct` apontando para `CatalogItem` | `/api/campaigns/[id]/products`, `/community/campaigns`, `/shop?campaignId=` | `PLANEJADO` | `PARCIAL` com vinculo real `campaign -> CatalogItem`, vitrine filtrada e bloqueio de checkout fora da campanha | `docs/BACKEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `lib/campaign-product-store.ts` | tratar como camada real de distribuicao parcial, sem promover ainda a dominio maduro de movimento |
| Fase 2 | referral | `ReferralLink`, `ReferralEvent`, `ReferralConversion` | `/affiliate`, `/affiliate/links`, `/af/[slug]`, `/api/affiliate/links` | `PARCIAL` | `PARCIAL` com clique publico, snapshot e conversao automatica | `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `lib/referral-store.ts` | tratar como runtime real de atribuicao, mas sem ledger/reward proprio |
| Fase 2 | snapshot contextualizado | `organizationId`, `campaignId`, `movementMarkup`, `referralLinkId` no snapshot | `/api/orders`, `lib/order-store.ts` | `PLANEJADO` | `PARCIAL` com `organizationId`, `campaignId`, `campaignName`, `campaignProgressivePriceRule`, `referralLinkId` e `affiliateUserId`; ainda sem `organizationUsername`, `movementMarkup` formal e `priceCompositionVersion` | `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md`, `lib/order-store.ts` | usar so o que o runtime realmente captura hoje |
| Fase 3 | arte e curadoria | `Artwork` + submissao/revisao | `/artist`, `/api/artworks`, `/curation` | `PARCIAL` | `PARCIAL` | `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`, `lib/artwork-store.ts` | oficializar usando estados reais atuais |
| Fase 3 | composicao controlada | `CatalogItem` composto com `Artwork` aprovado | `/api/catalog-items`, `/admin/catalog` | `PARCIAL` | `PARCIAL` | `docs/CATALOG_CURATION_DEFINITION_OF_DONE.md`, `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` | evoluir sem abrir produto paralelo |
| Fase 3 | supplier completo | `ProductBase`, `Material`, `PriceTable`, `FreightRule`, versionamento pleno | `/supplier` planejado para fase posterior | `PLANEJADO` | `AUSENTE` como dominio maduro | fase 3 draft externo analisado em 2026-06-08 | mover para fase posterior e nao tratar como base oficial agora |
| Fase 3 | `DecisionLog` generico | decisoes sensiveis de oferta e governanca | sem dominio amplo implementado | `PLANEJADO` | `PARCIAL` e restrito a elevacoes | `lib/decision-log-store.ts` | nao generalizar sem contrato novo |
| Readiness transversal | pagamentos reais | `Stripe` / cutover / homologacao Fase 1 (`card`/`wallet`) | `docs/P3_*`, `docs/PRECONDICAO_OPERACIONAL_PAGAMENTO_REAL_E_PERSISTENCIA_FINANCEIRA.md` | `IMPLEMENTADO` | `BLOQUEADO` | documento de pre-condicao + runbooks | tratar como provider oficial inicial; bloqueio atual = credenciais Stripe + homologacao + persistencia final |
| Readiness transversal | pagamentos reais | `gateway_real` generico / bridge multi-provider | `lib/payment-gateway-registry.ts`, `docs/PAYMENTS_MULTI_GATEWAY_SETUP.md` | `PLANEJADO` | `PARCIAL` | registry + setup multi-gateway | nao usar como bloqueio oficial atual nem como premissa de fase |

## Regras derivadas
- Se uma linha estiver `NAO PRESUMIR`, ela nao pode ser usada como premissa obrigatoria de handoff ou fase seguinte.
- Se uma linha estiver `PARCIAL`, a documentacao da fase deve falar em capacidade parcial, nao em dominio maduro.
- Se uma linha estiver `AUSENTE`, qualquer documento que a trate como base oficial deve ser corrigido.
- Se uma linha estiver `PLANEJADO`, ela pode orientar escopo, mas nao pode ser tratada como base pronta.
- `P3_*` no projeto atual significa readiness operacional de pagamentos reais, nao Fase 3 de produto.
- No recorte atual, isso significa `Stripe` como provider inicial de `card`/`wallet`; `pix` fica fora do escopo imediato salvo decisao comercial explicita.

## Uso obrigatorio antes de abrir fase nova
Responder:
1. A fase proposta depende de alguma linha `NAO PRESUMIR`?
2. A fase proposta exige promover alguma linha `PARCIAL` para `IMPLEMENTADO` sem evidencia?
3. Ha alguma capacidade de readiness transversal sendo confundida com fase de produto?

Se qualquer resposta for `sim`, a documentacao deve ser consolidada antes da implementacao.
