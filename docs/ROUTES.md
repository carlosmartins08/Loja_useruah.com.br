# Routes

Data de revisao: 2026-06-18  
Owner: Produto + Engenharia + Operacoes

## Regra de ouro
- Namespace canonico e a referencia interna.
- Alias legado existe so para compatibilidade transitória externa.
- Dashboard nao pode apontar para rota que o proprio guard bloqueia.

## Home canonica por papel
| Papel | Home canonica | Guard/layout |
| --- | --- | --- |
| `customer` | `/account` | `app/account/layout.tsx` |
| `artist` | `/artist` | `app/artist/layout.tsx` |
| `community_manager` | `/community` | `app/community/layout.tsx` |
| `affiliate` | `/affiliate` | `app/affiliate/layout.tsx` |
| `supplier` | `/supplier` | `app/supplier/layout.tsx` |
| `curator` | `/curation` | `app/curation/layout.tsx` |
| `support_agent` | `/support` | `app/support/layout.tsx` |
| `production_operator` | `/production` | `app/production/layout.tsx` |
| `finance_admin` | `/finance` | `app/finance/layout.tsx` |
| `platform_admin` | `/admin` | `app/admin/layout.tsx` + acesso aos namespaces operacionais canonicos |

## Namespaces canonicos por responsabilidade
- `/account/*`: jornada do cliente.
- `/artist/*`: ambiente autoral.
- `/community/*`: ambiente de campanhas e comunidade.
- `/affiliate/*`: ambiente de links e performance de afiliacao.
- `/supplier/*`: operacao do fornecedor.
- `/curation/*`: trabalho editorial de obra e catalogo.
- `/support/*`: atendimento operacional.
- `/production/*`: fila operacional de producao e envio.
- `/finance/*`: operacao financeira.
- `/admin/*`: cockpit e governanca de plataforma.

## Superficies cross-role
- `/admin/impact-reviews`: superficie canonica de governanca cross-role.
- Acesso previsto hoje para `curator`, `support_agent`, `finance_admin` e `platform_admin`.
- Esta rota nao deve redirecionar para `/curation`.

## Superficies publicas de atribuicao
- `/c/[campaignId]`: captura contexto publico de campanha ativa e redireciona para `/shop`.
- `/af/[slug]`: captura contexto publico de referral e redireciona para o destino do link.
- Essas superficies nao viram namespace operacional; elas apenas gravam contexto de atribuicao para o checkout.

## Aliases legados permitidos
- `/admin/support` -> `/support`
- `/admin/support/:orderId` -> `/support/:orderId`
- `/admin/production` -> `/production`
- `/admin/finance/payouts` -> `/finance/payouts`
- `/finance/dashboard` -> `/finance`
- `/account/artist` -> `/artist`
- `/account/community` -> `/community`
- `/account/supplier` -> `/supplier`
- `/account/affiliate` -> `/affiliate`

## Regras de redirect
- Redirect legado nao legitima uso interno.
- Navegacao interna deve apontar direto para o namespace canonico.
- `platform_admin` pode usar as superficies operacionais canonicas sem depender de `/admin/support` ou `/admin/production`.
- As paginas legadas de `app/admin/support`, `app/admin/production`, `app/admin/shipments`, `app/admin/finance/payouts` e `app/finance/dashboard` nao devem mais existir montadas no app tree.

## Regras de dashboard
- Papel nao-customer nao aponta para `/account/*`.
- Quando a jornada propria ainda nao existir, o card deve ir para:
  - uma pagina neutra do proprio papel; ou
  - ser removido temporariamente.

## Regra de saneamento estrutural
- Nao reexportar pagina de outro papel para fingir jornada dedicada.
- Se o comportamento for realmente compartilhado, extrair view neutra em `components/**`.
- Se a semantica for diferente, criar pagina propria do papel com copy e contrato corretos.
