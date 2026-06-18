# Backend da Fase 2 - Movimentos, Campanhas e Afiliados

Data de revisao: 2026-06-18

## Objetivo
Definir a camada minima de backend da Fase 2 sem criar arquitetura paralela a Fase 1 e sem descrever como pronto o que ainda esta em implementacao ou apenas planejado.

## Regra de precedencia
- `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md` define o escopo funcional.
- `docs/FRONTEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md` define a interface.
- `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md` define a regra anti-duplicidade.
- `docs/PHASE_DOMAIN_IMPLEMENTATION_MATRIX.md` define a leitura de maturidade real em `IMPLEMENTADO`, `PARCIAL`, `PLANEJADO`, `AUSENTE`, `NAO PRESUMIR` e `BLOQUEADO`.
- Este documento define entidades, validacoes, endpoints minimos, permissoes e persistencia de contexto.

## Principio central
A Fase 2 nao cria um novo fluxo de venda.
A Fase 2 deve adicionar contexto ao fluxo da Fase 1 apenas onde houver implementacao comprovada.

Regra dura:
- nao criar `Product` paralelo
- nao criar checkout paralelo
- nao criar `Order` paralelo
- nao criar `Payment` paralelo
- nao criar carrinho paralelo

Fluxo correto:
- quando existir, `/@username` entra apenas como descoberta e contexto, nunca como checkout proprio;
- hoje o runtime comprovado entra por `/community`, `/affiliate`, `/c/[campaignId]` ou `/shop?campaignId=...`;
- `CatalogItem` contextualizado
- `/cart`
- `/checkout`
- `Order + OrderItem + OrderItemSnapshot`

## Entidades previstas pela Fase 2
- `MovementCampaign`: existe capacidade parcial confirmada no runtime atual
- `Organization`
- `OrganizationMember`
- `MovementCategory`
- `CampaignProduct`
- `MovementMarkupRule`
- `ReferralLink`
- `ReferralEvent`
- `ReferralConversion`

Leitura obrigatoria:
- a lista acima descreve o dominio pretendido da fase;
- fora de `MovementCampaign` basico, os demais itens nao devem ser presumidos como dominio maduro sem prova runtime.

## Regras estruturais de desenho
- quando implementado, `CampaignProduct` deve apontar para `CatalogItem`
- quando implementado, `Organization.username` deve ser unico globalmente
- quando implementado, contexto de movimento/campanha/referral deve ser persistido no `OrderItemSnapshot`
- permissao de movimento e afiliado deve ser explicita, sem heranca frouxa

Estado atual reconhecido:
- o snapshot atual continua preservando a base da Fase 1, com extensao real em `phase2-context-pricing-v1` quando a compra nasce de campanha ativa e precisa congelar composicao de preco;
- `CampaignProduct` deixou de ser so capacidade documental: hoje ja aponta para `CatalogItem` publicado, sustenta `/api/campaigns/[id]/products`, a vitrine filtrada em `/shop?campaignId=...` e o bloqueio de checkout para item fora do recorte da campanha;
- a validacao de pedido ja nao compara so com o preco base da variante: ela respeita a regra progressiva da campanha e persiste `movementMarkup` + `priceCompositionVersion` no snapshot;
- `GET /api/campaigns/[id]` agora consolida detalhe operacional de campanha com governanca atual, historico de `ImpactReview`, timeline normalizada, vitrine vinculada, readiness backend e atribuicao financeira leve;
- `GET /api/commissions/me/campaigns` agora deriva receita por campanha a partir de `OrderItemSnapshot` + comissao real da comunidade, mas sem criar payout por campanha nem saldo sacavel isolado;
- `Organization` segue sem dominio runtime equivalente maduro;
- `Referral*` ja existe como runtime parcial de atribuicao, mas ainda sem reward financeiro proprio.

## Regra de compatibilidade
Se uma venda acontece, ela deve continuar passando por `Order`, `OrderItem`, `Payment` e `OrderItemSnapshot`.
