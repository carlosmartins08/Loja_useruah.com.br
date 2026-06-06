# Backend da Fase 2 - Movimentos, Campanhas e Afiliados

Data de revisao: 2026-06-05

## Objetivo
Definir a camada minima de backend para implementar a Fase 2 sem criar arquitetura paralela a Fase 1.

## Regra de precedencia
- `docs/FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md` define o escopo funcional.
- `docs/FRONTEND_FASE_2_MOVIMENTOS_CAMPANHAS_E_AFILIADOS.md` define a interface.
- `docs/PHASE_HANDOFF_FASE_1_PARA_FASE_2.md` define a regra anti-duplicidade.
- Este documento define entidades, validacoes, endpoints minimos, permissoes e persistencia de contexto.

## Principio central
A Fase 2 nao cria um novo fluxo de venda.
A Fase 2 adiciona contexto ao fluxo da Fase 1.

Regra dura:
- nao criar `Product` paralelo
- nao criar checkout paralelo
- nao criar `Order` paralelo
- nao criar `Payment` paralelo
- nao criar carrinho paralelo

Fluxo correto:
- `/@username` ou `/community` ou `/affiliate`
- `CatalogItem` contextualizado
- `/cart`
- `/checkout`
- `Order + OrderItem + OrderItemSnapshot`

## Entidades principais
- `Organization`
- `OrganizationMember`
- `MovementCategory`
- `MovementCampaign`
- `CampaignProduct`
- `MovementMarkupRule`
- `ReferralLink`
- `ReferralEvent`
- `ReferralConversion`

## Regras estruturais
- `CampaignProduct` sempre aponta para `CatalogItem`
- `Organization.username` deve ser unico globalmente
- contexto de movimento/campanha/referral deve ser persistido no `OrderItemSnapshot`
- permissao de movimento e afiliado deve ser explicita, sem heranca frouxa

## Regra de compatibilidade
Se uma venda acontece, ela deve continuar passando por `Order`, `OrderItem`, `Payment` e `OrderItemSnapshot`.
