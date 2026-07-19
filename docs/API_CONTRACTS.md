# API Contracts

## Persistência e migrações

As migrações MySQL são internas à operação e não alteram payloads, status HTTP ou semântica dos endpoints. O contrato público permanece congelado; qualquer mudança de resposta exige revisão própria neste documento e prova de compatibilidade.

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

## Autenticacao e sessao

### POST /api/auth/login

- Objetivo: autenticar uma identidade existente e emitir o cookie `ruah_session`.
- Payload: `{ "email": "string", "password": "string" }`.
- Sucesso: `{ "ok": true, "session": AuthSession }` e cookie HTTP-only com validade de 7 dias.
- Erros: `422 validation_error`, `401 invalid_credentials`, `503 auth_persistence_unavailable`.
- Fonte de identidade: `lib/user-identity-store.ts`; MySQL quando `PAYMENT_PERSISTENCE=mysql`.

### POST /api/auth/register

- Objetivo: criar identidade, registro de persona, aceite de termos quando informado e emitir `ruah_session`.
- Payload e resposta pública permanecem compatíveis com o fluxo atual.
- Erros: `422 validation_error`, `409 email_already_exists`, `503 auth_persistence_unavailable`.
- A senha é persistida somente como hash `scrypt`; fixtures demo não são válidas como persistência de produção.

### GET/DELETE /api/auth/session

- `GET` lê o cookie assinado e retorna `authenticated` e `session`.
- `DELETE` remove o cookie.
- O token continua sendo o contrato de sessão; ownership e RBAC são decididos no servidor a partir do ator autenticado.

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
  "provider": "stripe"
}
```

`amount`, `currency` e `items` não fazem parte da autoridade de entrada deste endpoint. Se enviados por clientes legados, são ignorados; o backend deriva valor, moeda e itens do pedido persistido antes de chamar o provider.

### Regra de autoridade financeira

O valor cobrado deve ser exatamente `order.totalAmount`; nenhum valor enviado pelo cliente pode substituir o snapshot do pedido.

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

---

## POST /api/orders/:orderId/cancel (implementacao ativa)

### Objetivo
Cancelar pedido em estado permitido e sincronizar efeitos financeiros quando houver pagamento aprovado.

### Roles autorizados
- `customer` (somente pedido proprio em `placed`)
- `support_agent`
- `platform_admin`

### Machine consumida
- Machine: `order`
- Transicao: `placed -> cancelled`, `paid -> cancelled` (administrativo)

### Payload
```json
{
  "reason": "string"
}
```

### Resposta de sucesso
```json
{
  "ok": true,
  "order": {
    "orderId": "string",
    "status": "cancelled"
  },
  "payment": {
    "paymentId": "string",
    "status": "refunded"
  }
}
```

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | role sem permissao |
| 404 | `not_found` | pedido inexistente |
| 409 | `invalid_transition` | pedido fora de estado cancelavel |
| 422 | `validation_error` | payload invalido |

### Evento emitido
- `order.cancelled`
- `payment.refunded` (quando aplicavel)

### AuditLog
Obrigatorio: sim

---

## POST /api/refunds

### Objetivo
Abrir solicitacao de refund para pedido pago com idempotencia.

### Roles autorizados
- `support_agent`
- `finance_admin`
- `platform_admin`

### Machine consumida
- Machine: `refund`
- Transicao: `none -> requested`

### Payload
```json
{
  "orderId": "string",
  "reason": "string"
}
```

### Headers obrigatorios
- `x-idempotency-key`

### Resposta de sucesso
```json
{
  "ok": true,
  "refund": {
    "refundId": "string",
    "status": "requested"
  },
  "reused": false
}
```

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | role sem permissao |
| 404 | `not_found` | pedido inexistente |
| 404 | `payment_not_found` | pedido sem pagamento |
| 409 | `invalid_transition` | pagamento fora de `approved` |
| 422 | `validation_error` | payload invalido ou sem idempotency key |

### Evento emitido
- `refund.requested`

### AuditLog
Obrigatorio: sim

---

## POST /api/refunds/:refundId/approve

### Objetivo
Aprovar refund solicitado e aplicar efeitos financeiros internos.

### Roles autorizados
- `finance_admin`
- `platform_admin`

### Machine consumida
- Machine: `refund`
- Transicao: `requested -> approved`

### Resposta de sucesso
```json
{
  "ok": true,
  "refund": {
    "refundId": "string",
    "status": "approved"
  }
}
```

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | role sem permissao |
| 404 | `not_found` | refund inexistente |
| 409 | `invalid_transition` | refund fora de `requested` |

### Evento emitido
- `refund.approved`
- `payment.refunded`

### AuditLog
Obrigatorio: sim

---

## POST /api/refunds/:refundId/reject

### Objetivo
Rejeitar refund solicitado.

### Roles autorizados
- `finance_admin`
- `platform_admin`

### Machine consumida
- Machine: `refund`
- Transicao: `requested -> rejected`

### Payload
```json
{
  "reason": "string"
}
```

### Resposta de sucesso
```json
{
  "ok": true,
  "refund": {
    "refundId": "string",
    "status": "rejected"
  }
}
```

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | role sem permissao |
| 404 | `not_found` | refund inexistente |
| 409 | `invalid_transition` | refund fora de `requested` |
| 422 | `validation_error` | motivo ausente |

### Evento emitido
- `refund.rejected`

### AuditLog
Obrigatorio: sim

---

## POST /api/chargebacks/webhook

### Objetivo
Registrar chargeback recebido por webhook e aplicar efeito financeiro idempotente.

### Machine consumida
- Machine: `chargeback`
- Transicao: `none -> received`

### Payload
```json
{
  "eventId": "string",
  "providerReference": "string",
  "reason": "string"
}
```

### Resposta de sucesso
```json
{
  "ok": true,
  "status": "processed",
  "payment": {
    "paymentId": "string",
    "status": "chargeback"
  }
}
```

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 404 | `payment_not_found` | provider reference inexistente |
| 422 | `validation_error` | payload invalido |

### Idempotencia/reconciliacao
- Chave por `eventId` (ou `x-idempotency-key`).
- Reenvio retorna `status=already_processed` sem duplicar impacto.

### Observacoes
- Chargeback nao sobrescreve `refund` ja aprovado; `refund` e `chargeback` permanecem trilhas separadas.

---

## POST /api/terms/accept

### Objetivo
Registrar aceite versionado de termos para gates de industria/artista/consumidor.

### Payload
```json
{
  "userId": "string",
  "entityType": "industry|artist|consumer",
  "entityId": "string",
  "termType": "industry_base|artist_base|consumer_base",
  "termVersion": "string"
}
```

### Resposta de sucesso
```json
{
  "ok": true,
  "acceptance": {
    "termType": "consumer_base",
    "termVersion": "v1"
  }
}
```

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 422 | `validation_error` | payload invalido |

### Observacoes
- Endpoint habilita rollout gradual via `TERMS_ENFORCE_INDUSTRY|ARTIST|CONSUMER`.

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

## GET /api/artworks

### Objetivo
Listar obras do autor ou da fila de curadoria conforme o papel do ator.

### Fonte de dados
- `PAYMENT_PERSISTENCE=mysql`: tabela `artworks`;
- SQLite/local: somente quando declarado explicitamente;
- falha de persistência não usa arquivo local como fallback.

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | RBAC ativo sem sessão/ator |
| 403 | `forbidden` | ator fora do escopo |
| 503 | `artwork_persistence_unavailable` | fonte configurada indisponível |

---

## POST /api/artworks

### Objetivo
Submeter uma obra para curadoria em `submitted`.

### Fonte de dados
- `artworks` é a autoridade da obra e de seu metadata de aplicabilidade.

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | RBAC ativo sem sessão/ator |
| 403 | `forbidden` | ator sem permissão ou termos não aceitos |
| 422 | `validation_error` | payload inválido |
| 503 | `artwork_persistence_unavailable` | fonte configurada indisponível |

---

## POST /api/artworks/:id/start-review, /approve, /reject

### Objetivo
Executar as transições `submitted -> under_review -> approved|rejected`.

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 401 | `unauthorized` | RBAC ativo sem sessão/ator |
| 403 | `forbidden` | ator sem permissão |
| 404 | `not_found` | obra inexistente |
| 409 | `invalid_transition` | estado incompatível |
| 422 | `validation_error` | motivo de rejeição ausente |
| 503 | `artwork_persistence_unavailable` | fonte configurada indisponível |

---

## GET /api/admin/impact-reviews

### Objetivo
Ler a fila e o histórico de governança cross-role.

### Fonte de dados
- `PAYMENT_PERSISTENCE=mysql`: tabela `impact_reviews`;
- SQLite/local: somente quando declarado explicitamente;
- `entity_type/entity_id` preservam o vínculo lógico com o domínio consumidor.

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | ator sem acesso à governança |
| 503 | `impact_review_persistence_unavailable` | fonte configurada indisponível |

---

## POST /api/admin/impact-reviews/:id/approve ou /reject

### Objetivo
Decidir uma revisão em `pending_review`, preservando actor, motivo e trilha de auditoria.

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 403 | `forbidden` | ator sem permissão |
| 404 | `not_found` | revisão inexistente |
| 409 | `invalid_transition` | revisão já decidida ou entidade incompatível |
| 422 | `validation_error` | payload inválido ou motivo ausente |
| 503 | `impact_review_persistence_unavailable` | fonte configurada indisponível |

---

## GET /api/catalog-items

### Objetivo
Ler o catálogo publicado para visitantes ou o recorte administrativo autorizado.

### Fonte de dados
- `PAYMENT_PERSISTENCE=mysql`: somente `catalog_items` no MySQL;
- SQLite/local: somente quando o ambiente declarar explicitamente esse modo;
- falha de persistência não usa `.tmp-store` como fallback.

### Resposta de sucesso
```json
{
  "ok": true,
  "items": []
}
```

### Erros esperados
| Codigo | Erro | Quando ocorre |
| --- | --- | --- |
| 503 | `catalog_persistence_unavailable` | fonte configurada indisponível |

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

---

## Referral e atribuição

### POST /api/affiliate/links
- Cria `ReferralLink` para `affiliate` ou `platform_admin`.
- `PAYMENT_PERSISTENCE=mysql`: tabela `referral_links`.
- slug é único globalmente; o contrato de criação permanece `201`.

### GET /api/affiliate/links
- Lê links do owner e deriva métricas a partir de `referral_events`.
- `clickCount`, `conversionCount`, `conversionRate` e `revenueAmount` não são armazenados como estado duplicado.

### GET /af/:slug
- Só links `active` registram `ReferralEvent` do tipo `click` e definem `ruah_referral_link_id`.
- Link inexistente ou pausado redireciona para `/shop` sem atribuição.

### POST /api/affiliate/links/:id/conversions
- Apenas `platform_admin` registra conversão no contrato atual.
- Conversão é idempotente por `referralLinkId + orderId`; repetição retorna `reused=true`.
- `PAYMENT_PERSISTENCE=mysql`: tabela `referral_events`.

### Persistência por ambiente
- MySQL é a autoridade em ambientes integrados.
- JSON/SQLite só são permitidos quando o modo local/QA é explicitamente declarado.
- Não existe fallback silencioso para `.tmp-store` em modo MySQL.

---

## POST /api/campaigns

### Objetivo
Criar campanha em `draft` e abrir review sensivel de growth (`campaign_growth`).

### Roles autorizados
- `community_manager`
- `platform_admin`

### Machine consumida
- Machine: `campaign`
- Transicao: `none -> draft`

### Evento emitido
- `campaign.created`
- `impact_review_notify.created_pending`

### AuditLog
Obrigatorio: sim

### Persistência
- `PAYMENT_PERSISTENCE=mysql`: `campaigns` é a fonte oficial.
- modo local/QA explicitamente declarado: usa o store local correspondente.
- não existe fallback silencioso de MySQL para `.tmp-store`.

---

## POST /api/campaigns/:id/submit

### Objetivo
Submeter campanha para revisao.

### Roles autorizados
- `community_manager`
- `platform_admin`

### Machine consumida
- Machine: `campaign`
- Transicao: `draft|rejected -> pending_review`

### Evento emitido
- `campaign.submitted`

### AuditLog
Obrigatorio: sim

### Autoridade de distribuição
- `Campaign` guarda estado, owner, regra progressiva e janela da campanha.
- `CampaignProduct` guarda somente o vínculo com `CatalogItem` e é único por `(campaignId, catalogItemId)`.
- a vitrine pública exige `campaign.status=active`, vínculo existente e `CatalogItem.publicationStatus=published`.
- o nome, preço, mídia, variantes e publicação do produto não são duplicados em campanha.

---

## POST /api/campaigns/:id/products

### Objetivo
Vincular um `CatalogItem` publicado à campanha ainda mutável.

### Persistência
- `PAYMENT_PERSISTENCE=mysql`: tabela `campaign_products`.
- modo local/QA explicitamente declarado: store local correspondente.
- vínculo repetido é idempotente e retorna `reused=true`.

### Regras
- item inexistente retorna `catalog_item_not_found`.
- item não publicado ou campanha bloqueada retorna `invalid_transition`.
- a operação emite `campaign.product_linked` quando cria vínculo novo.

---

## GET /api/campaigns/:id/public

### Objetivo
Resolver o estado público da campanha sem misturar catálogo editorial com estado de distribuição.

### Estados
- `active`: campanha ativa; produtos são filtrados por vínculo e publicação do catálogo.
- `inactive`: campanha existe, mas não está ativa; não expõe produtos.
- `not_found`: campanha inexistente; não expõe produtos.

---

## POST /api/campaigns/:id/approve

### Objetivo
Aprovar campanha e ativar, respeitando bloqueio de review sensivel.

### Roles autorizados
- `platform_admin` (single-approver atual)

### Machine consumida
- Machine: `campaign`
- Transicao: `pending_review|paused -> active`

### Regras obrigatorias
- Bloquear quando existir `impact_review_pending`.
- Bloquear quando ultimo review sensivel estiver `rejected`.

### Evento emitido
- `campaign.approved` ou `campaign.reactivated`

### AuditLog
Obrigatorio: sim
