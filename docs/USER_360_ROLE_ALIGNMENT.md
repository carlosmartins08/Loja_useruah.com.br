# User 360 Role Alignment

Data de revisao: 2026-06-18  
Owner: Produto + Engenharia + Operacoes

## Ponto que importava corrigir
O documento anterior dizia que `supplier` e `curator` ainda nao existiam em sessao ou rota, e isso ja nao era verdade. Essa defasagem virava decisao errada de produto e retrabalho em RBAC.

## Estado operacional consolidado
| Papel | Dominio | Sessao/runtime | Rota frontend | Contratos/API | Estado |
| --- | --- | --- | --- | --- | --- |
| `customer` | Sim | Sim | Sim | Sim | Ativo |
| `artist` | Sim | Sim | Sim | Sim | Ativo |
| `community_manager` | Sim | Sim | Sim | Sim | Ativo |
| `affiliate` | Sim | Sim | Sim | Sim | Ativo |
| `supplier` | Sim | Sim | Sim | Sim | Ativo sob escopo estrito de producao |
| `curator` | Sim | Sim | Sim | Sim | Ativo |
| `support_agent` | Sim | Sim | Sim | Sim | Ativo |
| `production_operator` | Sim | Sim | Sim | Sim | Ativo |
| `finance_admin` | Sim | Sim | Sim | Sim | Ativo |
| `platform_admin` | Sim | Sim | Sim | Sim | Ativo |

## Leitura honesta por papel
1. `supplier` existe como papel operacional, mas nao pode herdar visao global de producao.
2. `curator` existe em rota e sessao, mas seu trabalho editorial fica em `/curation/*`.
3. A governanca cross-role de risco continua em `/admin/impact-reviews`.
4. `platform_admin` continua com acesso transversal, mas deve preferir namespaces canonicos quando operar suporte, producao ou financeiro.
5. `artist`, `community_manager` e `affiliate` passaram a ter prova integrada de atribuicao real em `qa:role:closure`, mesmo com a Fase 2 ampla ainda parcial no nivel de dominio.

## Regras para nao voltar a quebrar
1. Mudanca de role exige alinhamento entre `layout`, dashboard, helper de roteamento e contrato backend.
2. Se um dashboard apontar para rota bloqueada pelo guard, a role nao esta pronta.
3. `supplier` em producao so opera pedidos com ownership inequivoco de um unico `supplierId`.
4. Caso multi-supplier em producao continua reservado a `production_operator` e `platform_admin` ate existir job parcial por fornecedor.

## Gate de PR
- Papel afetado:
- Home canonica validada em `docs/ROUTES.md`:
- Guard/layout validado:
- Contrato backend validado:
- Smoke por papel executado:
