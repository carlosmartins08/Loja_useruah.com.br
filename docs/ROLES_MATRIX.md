# Roles Matrix (Runtime Atual)

Data de revisao: 2026-06-22  
Owner: Produto + Engenharia + Operacoes

## Ponto que precisava ser corrigido
A versao anterior deste documento omitia `affiliate` dos perfis oficiais e misturava dominio planejado com capacidade runtime ja provada. Isso abria espaco para decisao errada de navegacao, RBAC e onboarding.

## Objetivo
Definir quais papeis existem de fato no runtime atual, qual e a home canonica de cada um e qual leitura operacional deve ser usada antes de mexer em rota, sessao, dashboard ou permissao.

## Perfis oficiais no runtime atual
- `customer`
- `artist`
- `community_manager`
- `affiliate`
- `supplier`
- `curator`
- `support_agent`
- `production_operator`
- `finance_admin`
- `platform_admin`

## Home canonica por papel
| Papel | Home canonica | Ambiente |
| --- | --- | --- |
| `customer` | `/account` | conta e pos-compra |
| `artist` | `/artist` | ambiente autoral |
| `community_manager` | `/community` | campanhas e receita da comunidade |
| `affiliate` | `/affiliate` | links e performance de afiliacao |
| `supplier` | `/supplier` | carteira operacional do fornecedor |
| `curator` | `/curation` | fila editorial |
| `support_agent` | `/support` | atendimento operacional |
| `production_operator` | `/production` | fila de producao e envio |
| `finance_admin` | `/finance` | operacao financeira |
| `platform_admin` | `/admin` | cockpit administrativo com acesso transversal controlado |

## Leitura operacional por papel
| Papel | Foco principal | Superficies principais | Restricoes que nao podem ser esquecidas |
| --- | --- | --- | --- |
| `customer` | comprar, acompanhar e resolver pos-compra | `/account/orders`, `/account/addresses`, `/account/support` | nao recebe acesso a superficies operacionais |
| `artist` | portfolio, pedidos vinculados e comissoes | `/artist/portfolio`, `/artist/orders`, `/artist/commissions` | nao deve reaproveitar jornada de cliente como ambiente principal |
| `community_manager` | campanhas e receita da comunidade | `/community/campaigns`, `/community/revenue` | nao pode operar campanha de outra comunidade |
| `affiliate` | links, atribuicao e leitura de performance | `/affiliate`, `/affiliate/links`, `/af/[slug]` como captura publica | nao possui ledger financeiro proprio nem workspace de reward dedicado |
| `supplier` | pedidos, producao e expedicao dentro do proprio escopo | `/supplier/orders`, `/supplier/production`, `/supplier/shipments` | nao pode ganhar visao global de producao nem mutar pedido multi-supplier fora de ownership estrito |
| `curator` | triagem editorial e aprovacao de obra/catalogo | `/curation`, `/curation/artworks`, `/admin/impact-reviews` | curadoria editorial nao substitui governanca cross-role ampla |
| `support_agent` | tickets e contexto 360 por pedido | `/support/tickets`, `/support/escalations`, `/support/[orderId]` | acesso deve continuar limitado ao escopo operacional de suporte |
| `production_operator` | fila global de producao e envio | `/production`, `/production/jobs` | precisa bloquear transicao invalida e envio sem rastreio |
| `finance_admin` | payouts, risco e conformidade | `/finance`, `/finance/payouts`, `/admin/impact-reviews` | nao deve depender de alias legado nem tomar decisao sem trilha de risco |
| `platform_admin` | governanca, configuracao e auditoria | `/admin` e namespaces operacionais canonicos quando necessario | acesso transversal nao legitima uso de rota legada como fluxo interno |

## Superficies cross-role que continuam especiais
- `/admin/impact-reviews` e a superficie canonica de governanca cross-role.
- O acesso previsto hoje e para `curator`, `support_agent`, `finance_admin` e `platform_admin`.
- `platform_admin` pode operar pelos namespaces canonicos dos outros ambientes quando necessario, sem depender de alias legado.

## Fontes de verdade relacionadas
- Rotas e aliases canonicos: `docs/ROUTES.md`
- Acesso por namespace: `docs/WORKFLOW_RBAC_ACCESS_MATRIX.md`
- Cadastro e escopo por papel: `docs/REGISTRATION_MATRIX_BY_ROLE.md`
- Runtime de sessao e papeis aceitos: `lib/auth-session.ts`
- Usuarios locais de desenvolvimento e QA: `lib/auth-local-users.ts`
- Roteamento por papel: `lib/role-routing/role-namespaces.ts`
- Validacao backend de acesso: `lib/access-control.ts`

## Regras para nao reabrir o mesmo problema
1. Mudanca de role exige alinhar `lib/auth-session.ts`, `lib/auth-local-users.ts`, `lib/role-routing/role-namespaces.ts`, guards/layouts, dashboard e documentos de rota.
2. Dashboard nao pode apontar para rota que o proprio guard bloqueia.
3. Documento de papel nao pode declarar como oficial um ambiente que o runtime nao autentica nem roteia.
4. Documento de papel tambem nao pode omitir um papel que ja existe em sessao, rota e QA operacional.
