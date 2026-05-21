# State Machines (Fonte Normativa Unica)

Data de revisao: 2026-05-19

## Objetivo
Definir a fonte normativa unica para estados, transicoes, bloqueios, eventos, auditoria e idempotencia das entidades operacionais criticas.

## Regra de precedencia
- Este documento prevalece sobre DoDs, checklists e documentacao de rota para qualquer definicao de estado/transicao.
- DoDs e documentos de rota devem apenas referenciar este arquivo, sem duplicar regras de transicao.

## Machine: order

### Estados permitidos
- `draft`
- `placed`
- `paid`
- `in_production`
- `shipped`
- `delivered`
- `closed`
- `cancelled`

### Transicoes validas
| De | Para | Gatilho | Executor | Evento | AuditLog |
| --- | --- | --- | --- | --- | --- |
| `draft` | `placed` | checkout confirmado | backend | `order.placed` | sim |
| `placed` | `paid` | pagamento confirmado | webhook/servico de pagamento | `order.paid` | sim |
| `paid` | `in_production` | job de producao criado | production_operator/backend | `production.created` | sim |
| `in_production` | `shipped` | despacho registrado com tracking | production_operator/supplier | `shipment.created` | sim |
| `shipped` | `delivered` | confirmacao de entrega | integracao logistica/operacao | `shipment.delivered` | sim |
| `delivered` | `closed` | encerramento operacional | backend/finance_admin | `order.closed` | sim |
| `placed` | `cancelled` | cancelamento antes de pagamento | customer/support_agent/platform_admin | `order.cancelled` | sim |
| `paid` | `cancelled` | cancelamento administrativo com motivo | support_agent/platform_admin | `order.cancelled` | sim |

### Transicoes proibidas
- `draft -> in_production`
- `placed -> shipped`
- `paid -> delivered`
- `delivered -> paid`
- `cancelled -> in_production`

### Regras e bloqueios
- Producao so pode iniciar com `order` em `paid`.
- Webhook duplicado nao pode criar nova transicao.
- Transicao administrativa para `cancelled` exige `reason` obrigatorio.

### Notificacao/demanda gerada
- `order.paid`: notificar customer e producao.
- `shipment.created`: notificar customer e suporte.
- `shipment.delivered`: notificar customer.
- `order.cancelled`: notificar customer e suporte.

### Idempotencia/reconciliacao
- Eventos de pagamento e webhook devem ser idempotentes por `orderId` + `providerReference`.

---

## Machine: payment

### Estados permitidos
- `created`
- `processing`
- `approved`
- `failed`
- `cancelled`
- `refunded`
- `partially_refunded`
- `chargeback`

### Transicoes validas
| De | Para | Gatilho | Executor | Evento | AuditLog |
| --- | --- | --- | --- | --- | --- |
| `created` | `processing` | iniciacao no provedor | backend/provider adapter | `payment.created` | sim |
| `processing` | `approved` | confirmacao do provedor/webhook | webhook/servico de pagamento | `payment.approved` | sim |
| `processing` | `failed` | falha no provedor | webhook/servico de pagamento | `payment.failed` | sim |
| `approved` | `partially_refunded` | estorno parcial aprovado | finance_admin | `payment.partially_refunded` | sim |
| `approved` | `refunded` | estorno total aprovado | finance_admin | `payment.refunded` | sim |
| `approved` | `chargeback` | chargeback recebido | webhook/finance_admin | `chargeback.received` | sim |
| `created` | `cancelled` | cancelamento antes de processamento | backend/customer/support_agent | `payment.cancelled` | sim |
| `processing` | `cancelled` | timeout/cancelamento operacional | backend/finance_admin | `payment.cancelled` | sim |

### Transicoes proibidas
- `failed -> approved`
- `refunded -> approved`
- `chargeback -> approved`
- `cancelled -> approved`

### Regras e bloqueios
- Payment e Order sao maquinas distintas.
- Sem alterar campos congelados de contrato sem migration formal.
- Mudanca financeira critica exige `reason` quando manual/admin.

### Notificacao/demanda gerada
- `payment.approved`: notificar customer e acionar `order.paid`.
- `payment.failed`: notificar customer com acao recomendada.
- `payment.refunded`/`payment.partially_refunded`: notificar customer e suporte.
- `chargeback.received`: abrir demanda para financeiro e suporte.

### Idempotencia/reconciliacao
- Webhook idempotente por `providerReference`.
- Reprocessamento de evento nao pode duplicar mudanca financeira.

---

## Machine: production

### Estados permitidos
- `queued`
- `in_progress`
- `shipped`
- `issue_reported`
- `cancelled`

### Transicoes validas
| De | Para | Gatilho | Executor | Evento | AuditLog |
| --- | --- | --- | --- | --- | --- |
| `queued` | `in_progress` | inicio da producao | production_operator/supplier | `production.started` | sim |
| `in_progress` | `shipped` | envio criado | production_operator/supplier | `production.shipped` | sim |
| `queued` | `issue_reported` | bloqueio/ocorrencia | production_operator/supplier | `production.issue_reported` | sim |
| `in_progress` | `issue_reported` | bloqueio/ocorrencia | production_operator/supplier | `production.issue_reported` | sim |
| `issue_reported` | `in_progress` | resolucao de ocorrencia | production_operator/platform_admin | `production.resumed` | sim |
| `queued` | `cancelled` | cancelamento administrativo | platform_admin/support_agent | `production.cancelled` | sim |

### Transicoes proibidas
- `queued -> shipped`
- `shipped -> in_progress`

### Regras e bloqueios
- `production` so pode ser criada quando `order` estiver `paid`.
- Cancelamentos administrativos exigem `reason`.

Observação semântica:
`production.in_progress` representa o estado interno de execução operacional da produção.

`order.in_production` representa o reflexo desse avanço na visão do cliente e do suporte.

Os dois estados não devem ser renomeados automaticamente para padronização superficial, pois pertencem a domínios diferentes.

### Notificacao/demanda gerada
- `production.started`: notificar customer (status atualizado) e suporte.
- `production.issue_reported`: notificar suporte e platform_admin.
- `shipment.created`: notificar customer.

### Idempotencia/reconciliacao
- Repeticao de atualizacao de status nao deve gerar eventos duplicados.

---

## Machine: artwork

### Estados permitidos
- `submitted`
- `under_review`
- `approved`
- `rejected`
- `archived`

### Transicoes validas
| De | Para | Gatilho | Executor | Evento | AuditLog |
| --- | --- | --- | --- | --- | --- |
| `submitted` | `under_review` | item entra na fila | curator/backend | `artwork.review_started` | sim |
| `under_review` | `approved` | aprovacao de curadoria | curator/platform_admin | `artwork.approved` | sim |
| `under_review` | `rejected` | rejeicao de curadoria | curator/platform_admin | `artwork.rejected` | sim |
| `rejected` | `submitted` | reenvio com ajuste | artist/community_manager | `artwork.resubmitted` | sim |
| `approved` | `archived` | retirada administrativa | platform_admin/curator | `artwork.archived` | sim |

### Transicoes proibidas
- `submitted -> approved` (sem review)
- `rejected -> approved` (sem novo ciclo)

### Regras e bloqueios
- Rejeicao exige `reason` obrigatorio.
- Nenhum `CatalogItem` pode ser publicado com `artwork` em `rejected`.

### Notificacao/demanda gerada
- `artwork.review_started`: notificar curator.
- `artwork.approved`/`artwork.rejected`: notificar autor.

### Idempotencia/reconciliacao
- Eventos de curadoria duplicados nao podem sobrepor estado final de forma invalida.

---

## Machine: catalog

### Estados permitidos
- `draft`
- `ready`
- `published`
- `archived`

### Transicoes validas
| De | Para | Gatilho | Executor | Evento | AuditLog |
| --- | --- | --- | --- | --- | --- |
| `draft` | `ready` | validacao de curadoria/catalogacao | curator/platform_admin | `catalog_item_ready` | sim |
| `ready` | `published` | publicacao no catalogo publico | curator/platform_admin | `catalog_item_published` | sim |
| `published` | `archived` | despublicacao com motivo | curator/platform_admin | `catalog_item_archived` | sim |
| `archived` | `draft` | reabertura controlada para novo ciclo | curator/platform_admin | `catalog_item_reopened` | sim |

### Transicoes proibidas
- `draft -> published` (sem etapa de ready)
- `archived -> published` (sem novo ciclo de catalogacao)

### Regras e bloqueios
- `CatalogItem` so pode ser criado com `artwork.status=approved`.
- Publicacao e proibida quando `artwork.status=rejected`.
- Despublicacao exige `reason`.
- Reabertura de item arquivado exige `reason`.

### Notificacao/demanda gerada
- `catalog_item_published`: notificar operacao comercial e conteudo.
- `catalog_item_archived`: notificar suporte e operacao.

### Idempotencia/reconciliacao
- Repeticao da mesma acao no mesmo estado deve retornar sucesso controlado sem duplicar efeito operacional.

---

## Machine: campaign

### Estados permitidos
- `draft`
- `pending_review`
- `active`
- `paused`
- `closed`
- `rejected`
- `cancelled`

### Transicoes validas
| De | Para | Gatilho | Executor | Evento | AuditLog |
| --- | --- | --- | --- | --- | --- |
| `draft` | `pending_review` | submissao para aprovacao | community_manager | `campaign.submitted` | sim |
| `pending_review` | `active` | aprovacao | curator/platform_admin | `campaign.approved` | sim |
| `pending_review` | `rejected` | rejeicao | curator/platform_admin | `campaign.rejected` | sim |
| `active` | `paused` | pausa operacional | platform_admin/curator | `campaign.paused` | sim |
| `paused` | `active` | reativacao | platform_admin/curator | `campaign.reactivated` | sim |
| `active` | `closed` | termino natural | backend/community_manager | `campaign.closed` | sim |
| `active` | `cancelled` | cancelamento administrativo | platform_admin | `campaign.cancelled` | sim |

### Transicoes proibidas
- `draft -> active` (sem revisao quando exigida)
- `rejected -> active` (sem novo ciclo)

### Regras e bloqueios
- Acoes administrativas criticas exigem `reason`.

### Notificacao/demanda gerada
- `campaign.submitted`: notificar curadoria/admin.
- `campaign.approved`/`campaign.rejected`: notificar community_manager.
- `campaign.paused`/`campaign.cancelled`: notificar responsavel da organizacao.

### Idempotencia/reconciliacao
- Repeticao de evento externo nao pode duplicar mudanca de estado.

---

## Machine: payout

### Estados permitidos
- `requested`
- `under_review`
- `approved`
- `paid`
- `rejected`
- `cancelled`

### Transicoes validas
| De | Para | Gatilho | Executor | Evento | AuditLog |
| --- | --- | --- | --- | --- | --- |
| `requested` | `under_review` | triagem financeira | finance_admin | `payout.review_started` | sim |
| `under_review` | `approved` | aprovacao financeira | finance_admin/platform_admin | `payout.approved` | sim |
| `approved` | `paid` | pagamento executado | finance_admin | `payout.paid` | sim |
| `under_review` | `rejected` | rejeicao financeira | finance_admin/platform_admin | `payout.rejected` | sim |
| `requested` | `cancelled` | cancelamento pelo solicitante/admin | artist/community_manager/finance_admin | `payout.cancelled` | sim |

### Transicoes proibidas
- `paid -> approved`
- `rejected -> paid`
- `cancelled -> paid`

### Regras e bloqueios
- `payout.paid` nao pode ser alterado sem evento corretivo auditado.
- Aprovar/rejeitar exige `reason` quando aplicavel.

### Notificacao/demanda gerada
- `payout.approved`/`payout.rejected`/`payout.paid`: notificar solicitante.

### Idempotencia/reconciliacao
- Reprocessamento nao pode duplicar repasse financeiro.

---

## Machine: refund

### Estados permitidos
- `requested`
- `under_review`
- `approved`
- `processed`
- `rejected`
- `cancelled`

### Transicoes validas
| De | Para | Gatilho | Executor | Evento | AuditLog |
| --- | --- | --- | --- | --- | --- |
| `requested` | `under_review` | triagem | support_agent/finance_admin | `refund.review_started` | sim |
| `under_review` | `approved` | aprovacao | finance_admin/platform_admin | `refund.approved` | sim |
| `approved` | `processed` | estorno processado no gateway | finance_admin/webhook | `refund.processed` | sim |
| `under_review` | `rejected` | rejeicao | finance_admin/platform_admin | `refund.rejected` | sim |
| `requested` | `cancelled` | cancelamento da solicitacao | customer/support_agent | `refund.cancelled` | sim |

### Transicoes proibidas
- `processed -> approved`
- `rejected -> processed`

### Regras e bloqueios
- Refund e chargeback sao maquinas separadas.
- Decisoes administrativas exigem `reason`.

### Notificacao/demanda gerada
- `refund.approved`/`refund.rejected`/`refund.processed`: notificar customer e suporte.

### Idempotencia/reconciliacao
- Evento duplicado de refund nao pode duplicar impacto no ledger.

---

## Machine: chargeback

### Estados permitidos
- `received`
- `under_review`
- `contested`
- `won`
- `lost`
- `settled`

### Transicoes validas
| De | Para | Gatilho | Executor | Evento | AuditLog |
| --- | --- | --- | --- | --- | --- |
| `received` | `under_review` | triagem inicial | finance_admin | `chargeback.review_started` | sim |
| `under_review` | `contested` | envio de contestacao | finance_admin/platform_admin | `chargeback.contested` | sim |
| `under_review` | `lost` | perda sem contestacao/decisao do provedor | webhook/finance_admin | `chargeback.lost` | sim |
| `contested` | `won` | ganho da contestacao | webhook/finance_admin | `chargeback.won` | sim |
| `contested` | `lost` | perda da contestacao | webhook/finance_admin | `chargeback.lost` | sim |
| `won` | `settled` | reconciliacao final | finance_admin | `chargeback.settled` | sim |
| `lost` | `settled` | reconciliacao final | finance_admin | `chargeback.settled` | sim |

### Transicoes proibidas
- `received -> won`
- `lost -> contested`
- `settled -> under_review`

### Regras e bloqueios
- Chargeback pode vir por webhook externo e deve ser reconciliado com payment/order/ledger.
- Acoes manuais exigem `reason`.

### Notificacao/demanda gerada
- `chargeback.received`: notificar financeiro e suporte.
- `chargeback.lost`/`chargeback.won`: notificar finance_admin e platform_admin.

### Idempotencia/reconciliacao
- Webhook duplicado de chargeback nao pode criar novo caso nem duplicar impacto financeiro.

## Machine: ticket

### Estados permitidos
- `open`
- `in_progress`
- `resolved`

### Transicoes validas
| De | Para | Gatilho | Executor | Evento | AuditLog |
| --- | --- | --- | --- | --- | --- |
| `none` | `open` | abertura de ticket vinculado a pedido | customer | `ticket.created` | sim |
| `open` | `in_progress` | resposta inicial de suporte | support_agent/platform_admin | `ticket.reply_by_support` | sim |
| `in_progress` | `in_progress` | interacao de suporte/cliente | support_agent/platform_admin/customer | `ticket.reply_by_support` ou `ticket.reply_by_customer` | sim |
| `in_progress` | `resolved` | resolucao operacional do ticket | support_agent/platform_admin | `ticket.resolved` | sim |

### Transicoes proibidas
- `open -> resolved` (sem atendimento)
- `resolved -> open` (sem fluxo formal de reabertura)

### Regras e bloqueios
- Responder ticket nao pode alterar automaticamente estados de `order`, `payment`, `production` ou `shipment`.
- Endpoint de suporte 360 (`GET /api/support/orders/:orderId/context`) e estritamente leitura.

### Notificacao/demanda gerada
- `ticket.created`: notificar suporte.
- `ticket.reply_by_support`: notificar customer.
- `ticket.resolved`: notificar customer.

### Idempotencia/reconciliacao
- Reenvio de resposta nao pode criar alteracao operacional fora da entidade `ticket`.

## Machine: commission_ledger

### Estados permitidos
- `pending`
- `available`
- `blocked`
- `paid`
- `reversed`

### Transicoes validas (recorte atual)
| De | Para | Gatilho | Executor | Evento | AuditLog |
| --- | --- | --- | --- | --- | --- |
| `none` | `pending` | pagamento aprovado (`order.paid`) | backend/webhook | `commission.created` | sim |
| `pending` | `available` | pedido elegivel para saque (`order.shipped`) | backend | `commission.available` | sim |

### Transicoes proibidas (recorte atual)
- `pending -> paid` (sem fluxo de payout aprovado/pago)
- `available -> paid` (fora do recorte)

### Regras e bloqueios
- `order.paid` cria comissao registrada (`pending`), mas nao libera saque automaticamente.
- Disponibilidade para saque e separada da venda e depende de elegibilidade operacional.
- Fluxo de suporte/ticket nao altera ledger financeiro.

### Notificacao/demanda gerada
- `commission.created`: registrar trilha para financeiro.
- `commission.available`: registrar saldo sacavel.

### Idempotencia/reconciliacao
- Criacao da comissao idempotente por `order.paid:{orderId}`.

---

## Machine: payout (recorte inicial)

### Estados permitidos no recorte
- `requested`

### Transicoes validas no recorte
| De | Para | Gatilho | Executor | Evento | AuditLog |
| --- | --- | --- | --- | --- | --- |
| `none` | `requested` | solicitacao de saque com saldo disponivel | artist/community_manager | `payout.requested` | sim |

### Regras e bloqueios
- Solicitacao de saque exige saldo `available` suficiente.
- `payout.requested` nao marca comissao como `paid` neste recorte.
- Requisicao acima do saldo disponivel retorna `409 insufficient_available_balance`.

### Idempotencia/reconciliacao
- `POST /api/payouts` idempotente por `x-idempotency-key`.
