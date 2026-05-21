# API Contracts

Data de revisao: 2026-05-19

Este documento define os contratos mÃ­nimos de API para os fluxos crÃ­ticos do MVP.

`docs/STATE_MACHINES.md` Ã© a fonte normativa Ãºnica para estados, transiÃ§Ãµes, bloqueios e eventos de auditoria.

Este documento nÃ£o deve recriar mÃ¡quinas de estado. Cada endpoint deve apenas referenciar:
- machine;
- transiÃ§Ã£o permitida;
- evento emitido;
- regras de idempotÃªncia, auditoria e reconciliaÃ§Ã£o.

## Regras globais obrigatorias
- `401`: nÃ£o autenticado.
- `403`: autenticado sem permissÃ£o.
- `409`: transiÃ§Ã£o invÃ¡lida ou conflito de estado (`invalid_transition`).
- Endpoints financeiros manuais exigem `reason`.
- Webhooks exigem assinatura e idempotÃªncia por identificador Ãºnico do evento.
- Toda transiÃ§Ã£o crÃ­tica gera `AuditLog`.

## Campos mÃ­nimos de AuditLog (quando obrigatÃ³rio)
- `actor_id`
- `actor_role`
- `action`
- `entity_type`
- `entity_id`
- `previous_status`
- `new_status`
- `reason`
- `created_at`

---

## POST /api/orders

### Objetivo
Criar pedido a partir do checkout e iniciar ciclo do `order`.

### Roles autorizados
- `customer`
- `support_agent` (execuÃ§Ã£o assistida)
- `platform_admin`

### Machine consumida
- Machine: `order`
- TransiÃ§Ã£o: `draft -> placed`

### Payload
```json
{
  "items": [
    {
      "catalogItemId": "string",
      "variantId": "string",
      "quantity": 1
    }
  ],
  "customer": {
    "name": "string",
    "email": "string"
  },
  "shippingAddress": {
    "cep": "string",
    "street": "string",
    "number": "string",
    "city": "string",
    "state": "string"
  }
}
```

### Resposta de sucesso
```json
{
  "orderId": "string",
  "status": "placed"
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuÃ¡rio nÃ£o autenticado |
| 403 | `forbidden` | role sem permissÃ£o |
| 409 | `invalid_transition` | estado inicial invÃ¡lido |
| 422 | `validation_error` | payload invÃ¡lido |

### Evento emitido
- `order.placed`

### AuditLog
ObrigatÃ³rio: sim

### IdempotÃªncia/reconciliaÃ§Ã£o
- Recomendado header `x-idempotency-key` para evitar duplicaÃ§Ã£o de pedido em retry.

### ObservaÃ§Ãµes
- NÃ£o confirmar produÃ§Ã£o neste endpoint.

---

## GET /api/orders/:id/status

### Objetivo
Consultar status operacional atual do pedido.

### Roles autorizados
- `customer` (apenas pedidos do prÃ³prio escopo)
- `support_agent`
- `production_operator`
- `finance_admin`
- `platform_admin`

### Machine consumida
- Machine: `order`
- TransiÃ§Ã£o: consulta (sem transiÃ§Ã£o)

### Payload
Sem body.

### Resposta de sucesso
```json
{
  "orderId": "string",
  "status": "placed",
  "paymentStatus": "processing",
  "productionStatus": "queued",
  "shipment": {
    "trackingCode": "string",
    "carrier": "string",
    "status": "shipped"
  },
  "timeline": [
    {
      "event": "order.placed",
      "createdAt": "ISO_DATE"
    }
  ]
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuÃ¡rio nÃ£o autenticado |
| 403 | `forbidden` | sem escopo de leitura |
| 404 | `not_found` | pedido inexistente |

### Evento emitido
- `order.status_viewed` (opcional)

### AuditLog
ObrigatÃ³rio: nÃ£o

### IdempotÃªncia/reconciliaÃ§Ã£o
NÃ£o aplicÃ¡vel.

---


## GET /api/shipments/:orderId

### Objetivo
Consultar rastreio de envio por pedido (somente leitura).

### Roles autorizados
- `customer` (pedido próprio)
- `support_agent`
- `production_operator`
- `platform_admin`

### Machine consumida
- Machine: `production` e `order`
- Transição: consulta (sem transição)

### Payload
Sem body.

### Resposta de sucesso
```json
{
  "orderId": "string",
  "trackingCode": "string",
  "carrier": "string",
  "createdAt": "ISO_DATE",
  "shipment": {
    "shipmentId": "string",
    "status": "created"
  }
}
```

Quando pedido existe e envio ainda não foi criado:
```json
{
  "orderId": "string",
  "shipment": null
}
```

### Erros esperados
| Código | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuário não autenticado (quando RBAC ativo) |
| 403 | `forbidden` | sem escopo de leitura |
| 404 | `not_found` | pedido inexistente |

### Evento emitido
- `shipment.status_viewed` (opcional)

### AuditLog
Obrigatório: não

### Idempotência/reconciliação
Não aplicável.

---## POST /api/orders/:id/cancel

### Objetivo
Cancelar pedido conforme regras operacionais.

### Roles autorizados
- `customer` (somente em `placed`)
- `support_agent`
- `platform_admin`

### Machine consumida
- Machine: `order`
- TransiÃ§Ã£o: `placed -> cancelled`, `paid -> cancelled` (somente administrativo)

### Payload
```json
{
  "reason": "string"
}
```

### Resposta de sucesso
```json
{
  "orderId": "string",
  "status": "cancelled"
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuÃ¡rio nÃ£o autenticado |
| 403 | `forbidden` | role sem permissÃ£o para estado atual |
| 409 | `invalid_transition` | transiÃ§Ã£o nÃ£o permitida |
| 422 | `validation_error` | `reason` ausente quando exigido |

### Evento emitido
- `order.cancelled`

### AuditLog
ObrigatÃ³rio: sim

### IdempotÃªncia/reconciliaÃ§Ã£o
- RequisiÃ§Ãµes repetidas para pedido jÃ¡ cancelado devem responder sucesso controlado (`already_cancelled`).

### ObservaÃ§Ãµes
- Proibido: `delivered -> cancelled`, `closed -> cancelled`.

---

## POST /api/payments/checkout

### Objetivo
Iniciar pagamento do pedido e abrir ciclo da machine `payment`.

### Roles autorizados
- `customer`
- `support_agent` (execuÃ§Ã£o assistida)
- `platform_admin`

### Machine consumida
- Machine: `payment`
- TransiÃ§Ã£o: `created -> processing`

### Payload
```json
{
  "orderId": "string",
  "method": "card",
  "amount": 100.5,
  "currency": "BRL"
}
```

### Resposta de sucesso
```json
{
  "paymentId": "string",
  "providerReference": "string",
  "status": "processing"
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuÃ¡rio nÃ£o autenticado |
| 403 | `forbidden` | role sem permissÃ£o |
| 409 | `invalid_transition` | pagamento jÃ¡ iniciado sem regra de retry |
| 422 | `validation_error` | payload invÃ¡lido |

### Evento emitido
- `payment.checkout_started`

### AuditLog
ObrigatÃ³rio: sim

### IdempotÃªncia/reconciliaÃ§Ã£o
- Header obrigatÃ³rio: `x-idempotency-key`.
- Reenvio com mesma chave nÃ£o pode criar nova cobranÃ§a.

---

## GET /api/payments/:id/status

### Objetivo
Consultar status de pagamento por `paymentId`.

### Roles autorizados
- `customer` (escopo prÃ³prio)
- `support_agent`
- `finance_admin`
- `platform_admin`

### Machine consumida
- Machine: `payment`
- TransiÃ§Ã£o: consulta (sem transiÃ§Ã£o)

### Payload
Sem body.

### Resposta de sucesso
```json
{
  "paymentId": "string",
  "status": "approved"
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuÃ¡rio nÃ£o autenticado |
| 403 | `forbidden` | sem escopo de leitura |
| 404 | `not_found` | pagamento inexistente |

### Evento emitido
- `payment.status_viewed` (opcional)

### AuditLog
ObrigatÃ³rio: nÃ£o

### IdempotÃªncia/reconciliaÃ§Ã£o
NÃ£o aplicÃ¡vel.

---

## POST /api/payments/webhook

### Objetivo
Receber eventos do gateway e reconciliar estados de `payment` e reflexo em `order`.

### Roles autorizados
- endpoint tÃ©cnico (provedor/gateway)

### Machine consumida
- Machine: `payment` (principal), com reflexo em `order`
- TransiÃ§Ã£o: `processing -> approved|failed`, `approved -> refunded|partially_refunded|chargeback`

### Payload
```json
{
  "eventId": "string",
  "providerReference": "string",
  "status": "approved"
}
```

### Resposta de sucesso
```json
{
  "received": true,
  "processed": true
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | assinatura ausente/invÃ¡lida |
| 409 | `duplicate_event` | evento jÃ¡ processado |
| 422 | `validation_error` | payload invÃ¡lido |

### Evento emitido
- `payment.approved`
- `payment.failed`
- `payment.refunded`
- `chargeback.received`

### AuditLog
ObrigatÃ³rio: sim

### IdempotÃªncia/reconciliaÃ§Ã£o
- Headers obrigatÃ³rios: `x-signature` e identificador Ãºnico (`x-idempotency-key` ou `eventId`).
- Evento duplicado deve retornar sucesso controlado (`already_processed`) sem novo efeito financeiro.

---

## POST /api/production-jobs

### Objetivo
Criar job de produÃ§Ã£o apÃ³s confirmaÃ§Ã£o de pagamento.

### Roles autorizados
- `backend` interno (automaÃ§Ã£o)
- `platform_admin` (intervenÃ§Ã£o)

### Machine consumida
- Machine: `production`
- TransiÃ§Ã£o: criaÃ§Ã£o em `queued` (disparada por `order.paid`)

### Payload
```json
{
  "orderId": "string"
}
```

### Resposta de sucesso
```json
{
  "productionJobId": "string",
  "status": "queued"
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | chamada externa nÃ£o autorizada |
| 409 | `invalid_transition` | pedido nÃ£o estÃ¡ `paid` |
| 422 | `validation_error` | payload invÃ¡lido |

### Evento emitido
- `production.created`

### AuditLog
ObrigatÃ³rio: sim

### IdempotÃªncia/reconciliaÃ§Ã£o
- CriaÃ§Ã£o deve ser idempotente por `orderId`.

### ObservaÃ§Ãµes
- NÃ£o expor como endpoint aberto para clientes.

---

## GET /api/production-jobs

### Objetivo
Listar jobs de produÃ§Ã£o para operaÃ§Ã£o.

### Roles autorizados
- `production_operator`
- `supplier`
- `support_agent`
- `platform_admin`

### Machine consumida
- Machine: `production`
- TransiÃ§Ã£o: consulta (sem transiÃ§Ã£o)

### Payload
Sem body.

### Resposta de sucesso
```json
{
  "jobs": []
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuÃ¡rio nÃ£o autenticado |
| 403 | `forbidden` | role sem permissÃ£o de leitura |

### Evento emitido
- `production.jobs_viewed` (opcional)

### AuditLog
ObrigatÃ³rio: nÃ£o

### IdempotÃªncia/reconciliaÃ§Ã£o
NÃ£o aplicÃ¡vel.

---

## GET /api/production-jobs/:id

### Objetivo
Consultar detalhe de um job de produÃ§Ã£o.

### Roles autorizados
- `production_operator`
- `supplier`
- `support_agent`
- `platform_admin`

### Machine consumida
- Machine: `production`
- TransiÃ§Ã£o: consulta (sem transiÃ§Ã£o)

### Payload
Sem body.

### Resposta de sucesso
```json
{
  "job": {
    "productionJobId": "string",
    "status": "queued"
  }
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuÃ¡rio nÃ£o autenticado |
| 403 | `forbidden` | role sem permissÃ£o de leitura |
| 404 | `not_found` | job inexistente |

### Evento emitido
- `production.job_viewed` (opcional)

### AuditLog
ObrigatÃ³rio: nÃ£o

### IdempotÃªncia/reconciliaÃ§Ã£o
NÃ£o aplicÃ¡vel.

---

## POST /api/production-jobs/:id/start

### Objetivo
Iniciar produÃ§Ã£o de job em fila.

### Roles autorizados
- `production_operator`
- `supplier`
- `platform_admin`

### Machine consumida
- Machine: `production`
- TransiÃ§Ã£o: `queued -> in_progress`

### Payload
```json
{
  "reason": "string"
}
```

### Resposta de sucesso
```json
{
  "productionJobId": "string",
  "status": "in_progress"
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuÃ¡rio nÃ£o autenticado |
| 403 | `forbidden` | role sem permissÃ£o |
| 409 | `invalid_transition` | job fora de `queued` |

### Evento emitido
- `production.started`

### AuditLog
ObrigatÃ³rio: sim

### IdempotÃªncia/reconciliaÃ§Ã£o
- RequisiÃ§Ã£o repetida em `in_progress` deve retornar sucesso controlado.

---

## POST /api/production-jobs/:id/ship

### Objetivo
Registrar despacho e atualizar produÃ§Ã£o/envio.

### Roles autorizados
- `production_operator`
- `supplier`
- `platform_admin`

### Machine consumida
- Machine: `production`
- TransiÃ§Ã£o: `in_progress -> shipped`

### Payload
```json
{
  "trackingCode": "string",
  "carrier": "string"
}
```

### Resposta de sucesso
```json
{
  "productionJobId": "string",
  "status": "shipped"
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuÃ¡rio nÃ£o autenticado |
| 403 | `forbidden` | role sem permissÃ£o |
| 409 | `invalid_transition` | job fora de `in_progress` |
| 422 | `validation_error` | tracking/carrier ausente |

### Evento emitido
- `production.shipped`
- `shipment.created`

### AuditLog
ObrigatÃ³rio: sim

### IdempotÃªncia/reconciliaÃ§Ã£o
- Evento duplicado de envio nÃ£o pode duplicar `shipment`.

---

## POST /api/payouts

### Objetivo
Solicitar saque.

### Roles autorizados
- `artist`
- `community_manager`

### Machine consumida
- Machine: `payout`
- TransiÃ§Ã£o: `requested -> under_review` (triagem financeira subsequente)

### Payload
```json
{
  "amount": 100.5
}
```

### Resposta de sucesso
```json
{
  "payoutId": "string",
  "status": "requested"
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuÃ¡rio nÃ£o autenticado |
| 403 | `forbidden` | role sem permissÃ£o |
| 409 | `invalid_transition` | saldo/estado nÃ£o elegÃ­vel |
| 422 | `validation_error` | payload invÃ¡lido |

### Evento emitido
- `payout.requested`

### AuditLog
ObrigatÃ³rio: sim

### IdempotÃªncia/reconciliaÃ§Ã£o
- RepetiÃ§Ã£o da solicitaÃ§Ã£o com mesma chave deve evitar duplicaÃ§Ã£o.

---

## POST /api/payouts/:id/approve

### Objetivo
Aprovar saque apÃ³s anÃ¡lise financeira.

### Roles autorizados
- `finance_admin`
- `platform_admin`

### Machine consumida
- Machine: `payout`
- TransiÃ§Ã£o: `under_review -> approved`

### Payload
```json
{
  "reason": "string"
}
```

### Resposta de sucesso
```json
{
  "payoutId": "string",
  "status": "approved"
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuÃ¡rio nÃ£o autenticado |
| 403 | `forbidden` | role sem permissÃ£o |
| 409 | `invalid_transition` | estado nÃ£o permite aprovaÃ§Ã£o |
| 422 | `validation_error` | `reason` ausente quando exigido |

### Evento emitido
- `payout.approved`

### AuditLog
ObrigatÃ³rio: sim

### IdempotÃªncia/reconciliaÃ§Ã£o
- AprovaÃ§Ã£o repetida deve retornar sucesso controlado sem duplicar efeito.

---

## POST /api/payouts/:id/reject

### Objetivo
Rejeitar saque.

### Roles autorizados
- `finance_admin`
- `platform_admin`

### Machine consumida
- Machine: `payout`
- TransiÃ§Ã£o: `under_review -> rejected`

### Payload
```json
{
  "reason": "string"
}
```

### Resposta de sucesso
```json
{
  "payoutId": "string",
  "status": "rejected"
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuÃ¡rio nÃ£o autenticado |
| 403 | `forbidden` | role sem permissÃ£o |
| 409 | `invalid_transition` | estado nÃ£o permite rejeiÃ§Ã£o |
| 422 | `validation_error` | `reason` ausente |

### Evento emitido
- `payout.rejected`

### AuditLog
ObrigatÃ³rio: sim

### IdempotÃªncia/reconciliaÃ§Ã£o
NÃ£o aplicÃ¡vel alÃ©m de controle de repetiÃ§Ã£o da mesma decisÃ£o.

---

## POST /api/payouts/:id/mark-paid

### Objetivo
Marcar saque como pago apÃ³s execuÃ§Ã£o financeira.

### Roles autorizados
- `finance_admin`
- `platform_admin`

### Machine consumida
- Machine: `payout`
- TransiÃ§Ã£o: `approved -> paid`

### Payload
```json
{
  "reason": "string"
}
```

### Resposta de sucesso
```json
{
  "payoutId": "string",
  "status": "paid"
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuÃ¡rio nÃ£o autenticado |
| 403 | `forbidden` | role sem permissÃ£o |
| 409 | `invalid_transition` | estado nÃ£o permite marcar pago |
| 422 | `validation_error` | payload invÃ¡lido |

### Evento emitido
- `payout.paid`

### AuditLog
ObrigatÃ³rio: sim

### IdempotÃªncia/reconciliaÃ§Ã£o
- RepetiÃ§Ã£o nÃ£o pode duplicar repasse.

---

## POST /api/refunds

### Objetivo
Solicitar estorno.

### Roles autorizados
- `customer`
- `support_agent`
- `finance_admin`

### Machine consumida
- Machine: `refund`
- TransiÃ§Ã£o: `requested -> under_review`

### Payload
```json
{
  "orderId": "string",
  "reason": "string"
}
```

### Resposta de sucesso
```json
{
  "refundId": "string",
  "status": "requested"
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuÃ¡rio nÃ£o autenticado |
| 403 | `forbidden` | role sem permissÃ£o |
| 422 | `validation_error` | payload invÃ¡lido |

### Evento emitido
- `refund.requested`

### AuditLog
ObrigatÃ³rio: sim

### IdempotÃªncia/reconciliaÃ§Ã£o
- Duplicidade de solicitaÃ§Ã£o para mesma ordem deve ser controlada por regra de negÃ³cio.

---

## POST /api/refunds/:id/approve

### Objetivo
Aprovar estorno.

### Roles autorizados
- `finance_admin`
- `platform_admin`

### Machine consumida
- Machine: `refund`
- TransiÃ§Ã£o: `under_review -> approved`

### Payload
```json
{
  "reason": "string"
}
```

### Resposta de sucesso
```json
{
  "refundId": "string",
  "status": "approved"
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuÃ¡rio nÃ£o autenticado |
| 403 | `forbidden` | role sem permissÃ£o |
| 409 | `invalid_transition` | estado nÃ£o permite aprovaÃ§Ã£o |
| 422 | `validation_error` | `reason` ausente |

### Evento emitido
- `refund.approved`

### AuditLog
ObrigatÃ³rio: sim

### IdempotÃªncia/reconciliaÃ§Ã£o
- AprovaÃ§Ã£o repetida nÃ£o pode duplicar efeito financeiro.

---

## POST /api/refunds/:id/reject

### Objetivo
Rejeitar estorno.

### Roles autorizados
- `finance_admin`
- `platform_admin`

### Machine consumida
- Machine: `refund`
- TransiÃ§Ã£o: `under_review -> rejected`

### Payload
```json
{
  "reason": "string"
}
```

### Resposta de sucesso
```json
{
  "refundId": "string",
  "status": "rejected"
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuÃ¡rio nÃ£o autenticado |
| 403 | `forbidden` | role sem permissÃ£o |
| 409 | `invalid_transition` | estado nÃ£o permite rejeiÃ§Ã£o |
| 422 | `validation_error` | `reason` ausente |

### Evento emitido
- `refund.rejected`

### AuditLog
ObrigatÃ³rio: sim

### IdempotÃªncia/reconciliaÃ§Ã£o
NÃ£o aplicÃ¡vel alÃ©m de controle de repetiÃ§Ã£o.

---

## POST /api/chargebacks/webhook

### Objetivo
Receber chargeback externo e abrir/atualizar caso de contestaÃ§Ã£o.

### Roles autorizados
- endpoint tÃ©cnico (provedor/gateway)

### Machine consumida
- Machine: `chargeback`
- TransiÃ§Ã£o: `received -> under_review` (ou atualizaÃ§Ã£o de decisÃ£o conforme evento)

### Payload
```json
{
  "eventId": "string",
  "providerReference": "string",
  "status": "received"
}
```

### Resposta de sucesso
```json
{
  "received": true,
  "processed": true
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | assinatura ausente/invÃ¡lida |
| 409 | `duplicate_event` | evento jÃ¡ processado |
| 422 | `validation_error` | payload invÃ¡lido |

### Evento emitido
- `chargeback.received`
- `chargeback.won`
- `chargeback.lost`

### AuditLog
ObrigatÃ³rio: sim

### IdempotÃªncia/reconciliaÃ§Ã£o
- Headers obrigatÃ³rios: `x-signature` e identificador Ãºnico (`x-idempotency-key` ou `eventId`).
- Duplicado deve retornar sucesso controlado (`already_processed`) sem novo efeito.

---

## POST /api/chargebacks/:id/resolve

### Objetivo
Registrar resoluÃ§Ã£o administrativa final do chargeback.

### Roles autorizados
- `finance_admin`
- `platform_admin`

### Machine consumida
- Machine: `chargeback`
- TransiÃ§Ã£o: `under_review -> contested|lost` e `won|lost -> settled` conforme decisÃ£o operacional

### Payload
```json
{
  "resolution": "contested",
  "reason": "string"
}
```

### Resposta de sucesso
```json
{
  "chargebackId": "string",
  "status": "contested"
}
```

### Erros esperados
| CÃ³digo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | usuÃ¡rio nÃ£o autenticado |
| 403 | `forbidden` | role sem permissÃ£o |
| 409 | `invalid_transition` | estado nÃ£o permite resoluÃ§Ã£o solicitada |
| 422 | `validation_error` | `resolution`/`reason` invÃ¡lido |

### Evento emitido
- `chargeback.contested`
- `chargeback.settled`

### AuditLog
ObrigatÃ³rio: sim

### IdempotÃªncia/reconciliaÃ§Ã£o
- RepetiÃ§Ã£o da mesma resoluÃ§Ã£o nÃ£o pode duplicar impacto no ledger.


## GET /api/support/orders/:orderId/context

### Objetivo
Consolidar contexto operacional completo por pedido para diagnostico de suporte, sem mutacao de estado.

### Roles autorizados
- `support_agent`
- `platform_admin`

### Machine consumida
- Machine: `order`, `payment`, `production`, `ticket`
- Transicao: consulta (sem transicao)

### Payload
Sem body.

### Resposta de sucesso
```json
{
  "order": {
    "id": "string",
    "status": "placed",
    "customerId": "string",
    "createdAt": "ISO_DATE"
  },
  "payment": {
    "id": "string",
    "status": "processing"
  },
  "production": {
    "id": "string",
    "status": "queued"
  },
  "shipment": {
    "trackingCode": "string",
    "carrier": "string"
  },
  "tickets": [],
  "auditSummary": [
    {
      "action": "order.placed",
      "createdAt": "ISO_DATE"
    }
  ]
}
```

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | role sem permissao |
| 404 | `not_found` | pedido inexistente |

### Evento emitido
- `support.context_viewed` (opcional)

### AuditLog
Obrigatorio: nao

### Idempotencia/reconciliacao
Nao aplicavel.

---

## POST /api/tickets

### Objetivo
Abrir ticket vinculado a pedido do proprio cliente.

### Roles autorizados
- `customer`

### Machine consumida
- Machine: `ticket`
- Transicao: `none -> open`

### Payload
```json
{
  "orderId": "string",
  "subject": "string",
  "message": "string"
}
```

### Resposta de sucesso
```json
{
  "ticket": {
    "ticketId": "string",
    "status": "open"
  }
}
```

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | customer sem escopo do pedido ou role invalida |
| 404 | `not_found` | pedido inexistente |
| 422 | `validation_error` | payload invalido |

### Evento emitido
- `ticket.created`

### AuditLog
Obrigatorio: sim

### Idempotencia/reconciliacao
Nao aplicavel.

---

## GET /api/tickets/:id

### Objetivo
Consultar ticket por id respeitando escopo de leitura.

### Roles autorizados
- `customer` (apenas proprio ticket)
- `support_agent`
- `platform_admin`

### Machine consumida
- Machine: `ticket`
- Transicao: consulta (sem transicao)

### Payload
Sem body.

### Resposta de sucesso
```json
{
  "ticket": {
    "ticketId": "string",
    "status": "open"
  }
}
```

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | sem escopo de leitura |
| 404 | `not_found` | ticket inexistente |

### Evento emitido
- `ticket.viewed` (opcional)

### AuditLog
Obrigatorio: nao

### Idempotencia/reconciliacao
Nao aplicavel.

---

## POST /api/tickets/:id/reply

### Objetivo
Responder ticket sem alterar estados operacionais de pedido/pagamento/producao/envio.

### Roles autorizados
- `customer` (proprio ticket)
- `support_agent`
- `platform_admin`

### Machine consumida
- Machine: `ticket`
- Transicao: `open -> in_progress` (resposta de suporte) ou manutencao do estado atual

### Payload
```json
{
  "message": "string"
}
```

### Resposta de sucesso
```json
{
  "ticket": {
    "ticketId": "string",
    "status": "in_progress"
  }
}
```

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | sem escopo de resposta |
| 404 | `not_found` | ticket inexistente |
| 422 | `validation_error` | payload invalido |

### Evento emitido
- `ticket.reply_by_support`
- `ticket.reply_by_customer`

### AuditLog
Obrigatorio: sim

### Idempotencia/reconciliacao
Nao aplicavel.

## GET /api/commissions/me

### Objetivo
Consultar ledger financeiro do proprio dono (`artist` ou `community_manager`) com separacao de saldo pendente, disponivel e solicitado.

### Roles autorizados
- `artist`
- `community_manager`

### Machine consumida
- Machine: `commission_ledger`
- Transicao: consulta/reconciliacao de disponibilidade (sem mutacao operacional em order/payment/production)

### Payload
Sem body.

### Resposta de sucesso
```json
{
  "ownerId": "string",
  "ownerRole": "artist",
  "balances": {
    "pending": 10.5,
    "availableGross": 8.0,
    "requested": 2.0,
    "availableToWithdraw": 6.0
  },
  "commissions": [],
  "payouts": []
}
```

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | role sem permissao |

### Evento emitido
- `commission.ledger_viewed` (opcional)

### AuditLog
Obrigatorio: nao

### Idempotencia/reconciliacao
- Consulta idempotente; sem efeito em estado operacional de venda.

---

## POST /api/payouts (recorte inicial)

### Objetivo
Solicitar saque inicial com base no saldo `available` do proprio dono.

### Roles autorizados
- `artist`
- `community_manager`

### Machine consumida
- Machine: `payout`
- Transicao: `none -> requested`

### Payload
```json
{
  "amount": 10.5,
  "currency": "BRL"
}
```

### Resposta de sucesso
```json
{
  "payout": {
    "payoutId": "string",
    "status": "requested"
  }
}
```

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | role sem permissao |
| 409 | `insufficient_available_balance` | valor acima do saldo disponivel |
| 422 | `validation_error` | payload invalido ou `x-idempotency-key` ausente |

### Evento emitido
- `payout.requested`

### AuditLog
Obrigatorio: sim

### Idempotencia/reconciliacao
- Header obrigatorio: `x-idempotency-key`.
- Reenvio com mesma chave retorna o mesmo payout sem duplicacao.

### Observacoes
- Neste recorte, `payout.requested` nao marca comissao como `paid`.
- Aprovacao e pagamento de saque ficam para recorte financeiro posterior.

---

## POST /api/catalog-items

### Objetivo
Criar `CatalogItem` em `draft` a partir de `Artwork` aprovada.

### Roles autorizados
- `curator`
- `platform_admin`

### Machine consumida
- Machine: `artwork` + `catalog`
- Regra: so cria quando `artwork.status=approved`

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | role sem permissao |
| 404 | `artwork_not_found` | artwork inexistente |
| 409 | `invalid_transition` | artwork nao aprovada |
| 422 | `validation_error` | payload invalido |

### Evento emitido
- `catalog_item_created`

### AuditLog
Obrigatorio: sim

---

## POST /api/catalog-items/:id/publish

### Objetivo
Publicar `CatalogItem` no catalogo publico.

### Roles autorizados
- `curator`
- `platform_admin`

### Machine consumida
- Machine: `catalog`
- Transicao: `ready -> published`

### Regras obrigatorias
- Item deve estar em `ready` para publicar.
- Bloquear publicacao quando `artwork.status=rejected`.
- Bloquear publicacao quando `artwork.status` diferente de `approved`.

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | role sem permissao |
| 404 | `not_found`/`artwork_not_found` | item ou artwork inexistente |
| 409 | `invalid_transition` | transicao invalida ou artwork nao elegivel |

### Evento emitido
- `catalog_item_published`

### AuditLog
Obrigatorio: sim

---

## POST /api/catalog-items/:id/ready

### Objetivo
Promover item de `draft` para `ready` antes da publicacao.

### Roles autorizados
- `curator`
- `platform_admin`

### Machine consumida
- Machine: `catalog`
- Transicao: `draft -> ready`

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | role sem permissao |
| 404 | `not_found` | item inexistente |
| 409 | `invalid_transition` | item fora de `draft` |

### Evento emitido
- `catalog_item_ready`

### AuditLog
Obrigatorio: sim

---

## POST /api/catalog-items/:id/unpublish

### Objetivo
Despublicar item do catalogo e arquivar com motivo.

### Roles autorizados
- `curator`
- `platform_admin`

### Machine consumida
- Machine: `catalog`
- Transicao: `published -> archived`

### Regras obrigatorias
- `reason` obrigatorio.

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | role sem permissao |
| 404 | `not_found` | item inexistente |
| 409 | `invalid_transition` | item fora de `published` |
| 422 | `validation_error` | motivo ausente |

### Evento emitido
- `catalog_item_archived`

### AuditLog
Obrigatorio: sim

---

## POST /api/catalog-items/:id/reopen

### Objetivo
Reabrir item arquivado para novo ciclo de catalogacao.

### Roles autorizados
- `curator`
- `platform_admin`

### Machine consumida
- Machine: `catalog`
- Transicao: `archived -> draft`

### Regras obrigatorias
- `reason` obrigatorio.

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | role sem permissao |
| 404 | `not_found` | item inexistente |
| 409 | `invalid_transition` | item fora de `archived` |
| 422 | `validation_error` | motivo ausente |

### Evento emitido
- `catalog_item_reopened`

### AuditLog
Obrigatorio: sim

---

## POST /api/catalog-items/bootstrap

### Objetivo
Popular catalogo publicado inicial (dev/staging) com IDs legados `1..6` para manter compatibilidade imediata com links existentes (`/product/:id`).

### Roles autorizados
- `curator`
- `platform_admin`

### Regras
- Cria/atualiza artworks aprovadas de seed.
- Cria catalog items ausentes.
- Publica itens criados/ja existentes.

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | role sem permissao |

### Evento emitido
- `catalog_bootstrap_seeded`

### AuditLog
Obrigatorio: sim
