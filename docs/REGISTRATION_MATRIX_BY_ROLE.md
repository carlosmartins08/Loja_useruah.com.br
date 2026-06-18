# Registration Matrix by Role

Data de revisao: 2026-06-17  
Owner: Produto + Engenharia + Operacoes

## Regra estrutural
`Conta != papel != ambiente operacional`

## Estado atual de funcionamento
- Runtime de sessao suporta `customer`, `artist`, `community_manager`, `affiliate`, `supplier`, `curator`, `support_agent`, `production_operator`, `finance_admin` e `platform_admin`.
- Cada papel acima ja possui home canonica documentada em [ROUTES.md](/c:/Users/leobe/Documents/Aplicacao_vibe%20code_CarlosHenrique/Loja_%20UseRuah.com.br/docs/ROUTES.md).
- O ponto sensivel nao e mais “falta de rota”, e sim manter contrato coerente entre rota, guard e backend.

## Matriz por papel
| Papel | Cadastros principais | Pode publicar direto? | Estado |
| --- | --- | --- | --- |
| `customer` | perfil, endereco, pedidos, tickets | Nao | Ativo |
| `artist` | perfil autoral, obras, dados de recebimento | Nao | Ativo |
| `community_manager` | campanhas, metas, ativos da comunidade | Nao | Ativo |
| `affiliate` | links, parametros de atribuicao, ativos de divulgacao | Nao | Ativo |
| `supplier` | carteira operacional, capacidade, execucao de producao dentro do proprio escopo | Nao | Ativo sob escopo estrito |
| `curator` | triagem editorial, aprovacao de obra e catalogo | Sim, dentro do dominio editorial | Ativo |
| `support_agent` | tickets, respostas, contexto de pedido | Nao | Ativo |
| `production_operator` | fila de producao, envio, ocorrencias operacionais | Nao | Ativo |
| `finance_admin` | payouts, refunds, decisoes financeiras | Sim, com trilha de auditoria | Ativo |
| `platform_admin` | politicas, cadastros, governanca ampla | Sim, com trilha de auditoria | Ativo |

## Campos sensiveis que continuam exigindo revisao
1. Tabela de preco de fornecedor
2. Regras de frete
3. Capacidade e prazo de producao
4. Ficha tecnica e materia-prima
5. Regras de comissao
6. Politica de troca e devolucao
7. Regras de gateway e taxas
8. Ownership financeiro

## Regras de execucao
1. Alteracao de campo sensivel continua nascendo como `pending_review`.
2. UI de supplier nao autoriza mutacao fora de ownership inequivoco.
3. Curadoria editorial nao deve ser confundida com impact review cross-role.
4. Dashboard de role nao pode usar rota de outro papel para “quebrar um galho”.

## Gaps ainda assumidos
1. `affiliate` ja tem namespace proprio, mas ainda nao possui ledger financeiro dedicado como `artist`.
2. Caso multi-supplier em producao segue sem job parcial por fornecedor.
3. A governanca cross-role segue centralizada em `/admin/impact-reviews`.
