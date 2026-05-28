# Sensitive Fields Matrix by Domain (Fonte Unica)

Data de revisao: 2026-05-27  
Owner: Produto + Engenharia + Operacoes

## Objetivo
Centralizar os campos que exigem `pending_review` para evitar duplicidade de regra por tela/endpoint.

## Regra geral
- Campo sensivel nunca publica direto em dominio critico.
- Toda mudanca sensivel deve gerar:
  - review pendente
  - trilha em `AuditLog`
  - trilha de comunicacao interna
  - bloqueio de transicao ate decisao

## Matriz por dominio
| Dominio | Campo sensivel | Risco primario | Estado minimo |
| --- | --- | --- | --- |
| supplier_catalog | `priceTable` | margem/preco publico | `pending_review` |
| supplier_catalog | `freightRule` | prazo/custo de entrega | `pending_review` |
| supplier_catalog | `productionLeadTime` | SLA operacional | `pending_review` |
| supplier_catalog | `materialSpec` | qualidade/consistencia | `pending_review` |
| payout_finance | `payoutDecision` | saida de caixa/conformidade | `pending_review` |
| payout_finance | `refundDecision` | estorno e impacto de caixa | `pending_review` |
| payout_finance | `chargebackDecision` | risco financeiro e reconciliacao | `pending_review` |
| payout_finance | `gatewayFeeRule` | reconciliacao financeira | `pending_review` |
| payout_finance | `commissionRule` | saldo/owner de comissao | `pending_review` |
| campaign_growth | `campaignBudget` | subsidio/queima de caixa | `pending_review` |
| campaign_growth | `progressivePriceRule` | margem + risco comercial | `pending_review` |

## Aprovacao
- Aprovador atual: `platform_admin` (single-approver).
- SLA de decisao: 2 horas.
- Se atrasar SLA: escalar no resumo diario de impacto.

## Referencias obrigatorias
- `docs/STATE_MACHINES.md`
- `docs/API_CONTRACTS.md`
- `docs/REGISTRATION_MATRIX_BY_ROLE.md`
- `docs/USER_360_ROLE_ALIGNMENT.md`
