# Roles Matrix (MVP)

## Objetivo
Definir claramente responsabilidades por perfil para evitar duplicidade de regra, conflito de permissões e retrabalho de implementação.

## Perfis oficiais
- `customer`
- `artist`
- `community_manager`
- `supplier`
- `curator`
- `production_operator`
- `support_agent`
- `finance_admin`
- `platform_admin`

## Convenções
- `C`: create
- `R`: read
- `U`: update
- `A`: approve
- `X`: sem acesso direto

## Matriz CRUD

| Entidade | customer | artist | community_manager | supplier | curator | production_operator | support_agent | finance_admin | platform_admin |
|---|---|---|---|---|---|---|---|---|---|
| User/Profile | C R U | C R U | C R U | C R U | C R U | C R U | C R U | C R U | R U |
| Organization | X | R | C R U | C R U | X | X | R | R | R U |
| ProductBase/Ficha técnica | R | R | R | C R U | R | R | R | R | R U |
| Variant/Preço base | R | R | R | C R U | R | R | R | R U | R U |
| Artwork | R | C R U | C R U | X | R A | R | R | R | R U A |
| Campaign | R | R | C R U | X | R A | R | R | R | R U A |
| CatalogItem | R | R | R | R | R A | R | R | R | R U A |
| Order/OrderItem | C R | R | R | R | X | R U | R U | R | R U |
| Payment/WebhookEvent | R | R | R | X | X | R | R | R U | R U |
| ProductionJob | X | R | R | R U | X | C R U | R | R | R U |
| Shipment/Tracking | R | R | R | R U | X | R U | R U | R | R U |
| Wallet/CommissionLedger | R | R | R | X | X | X | R | C R U A | R U |
| Payout | R | C R | C R | X | X | X | R | A U | R U |
| Refund/Chargeback | R | R | R | X | X | R | C R U | A U | R U |
| Ticket/Atendimento | C R U | C R U | C R U | C R U | C R U | C R U | C R U A | R | R U |
| Policies/Rules | R | R | R | R | R | R | R | R | C R U A |
| AuditLog | X | X | X | X | X | X | R | R | R |

## Regras de implementação
- Regra de negócio deve morar no backend (serviços de domínio), não no frontend.
- Frontend por perfil apenas orquestra UI e estados permitidos.
- Toda ação crítica deve registrar `AuditLog` com `actor_role`, `entity`, `action`, `timestamp`.
- Alterações de permissão devem ser centralizadas em RBAC, não distribuídas por tela.

## Dependências técnicas mínimas
- Tabela/coleção de roles e permissions.
- Mapeamento `user -> organization -> role`.
- Middleware de autorização por rota e por ação.
- Seeds de permissões por perfil para ambiente de desenvolvimento/staging.

