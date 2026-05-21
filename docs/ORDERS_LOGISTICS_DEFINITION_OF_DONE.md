# Orders & Logistics Definition Of Done (Obrigatorio)

Data de revisao: 2026-05-19

## Objetivo
Padronizar execução do domínio de pedidos, produção e entrega com critérios claros de transição de estado, ownership por perfil e rastreabilidade operacional.

## Escopo do dominio
- Pedido: criação, confirmação, acompanhamento e encerramento.
- Produção: fila operacional e atualização de andamento.
- Entrega: despacho, tracking e confirmação de recebimento.
- Suporte: visão 360 para atendimento.

## Máquina de estados
Esta rota/fluxo deve seguir obrigatoriamente as transições definidas em `docs/STATE_MACHINES.md` (`order` e `production`).

Em caso de conflito, `docs/STATE_MACHINES.md` prevalece.

Não repetir estados ou transições neste DoD. Qualquer alteração de fluxo deve ser feita primeiro em `STATE_MACHINES.md` e depois refletida aqui apenas como referência.

## Ownership por perfil (resumo)
- `customer`: cria pedido e acompanha status.
- `production_operator`: atualiza `in_production`.
- `supplier`: atualiza disponibilidade e insumos quando aplicável.
- `support_agent`: acompanha e resolve exceções operacionais.
- `platform_admin`: override controlado e auditoria.

Referencia completa: `docs/ROLES_MATRIX.md`

## Fase A: Pedido operacional (MVP atual)
### Escopo
- [x] Fluxo UX principal `shop -> product -> cart -> checkout` funcional.
- [x] Cálculo de prazo composto por produção + logística em checkout.
- [x] Exibição de resumo de pedido no checkout.

### Critérios de aceite
- [ ] Pedido criado no checkout recebe identificador único.
- [ ] Prazo exibido em checkout é consistente com regras do carrinho.
- [ ] Fluxo de sucesso pós-compra sem bloqueios de navegação.

## Fase B: Produção operacional
### Escopo
- [ ] Estruturar `ProductionJob` vinculado ao pedido.
- [ ] Atualizar status de produção com trilha temporal (`queued`, `in_progress`, `done`).
- [ ] Expor timeline para customer e suporte.

### Critérios de aceite
- [ ] Entrada em produção só ocorre para pedido `paid`.
- [ ] Mudança de produção inválida é bloqueada com erro explícito.
- [ ] Histórico de produção auditável por pedido.

## Fase C: Logística e tracking
### Escopo
- [ ] Registrar envio com `trackingCode` e transportadora.
- [ ] Atualizar estado de entrega (`shipped`, `delivered`) por evento.
- [ ] Exibir rastreio para customer e suporte.

### Critérios de aceite
- [ ] Pedido não entra em `shipped` sem dados mínimos de despacho.
- [ ] Evento duplicado de tracking não duplica transição.
- [ ] Divergência de tracking gera alerta operacional para suporte.

## Fase D: Exceções (devolução, reenvio, cancelamento)
### Escopo
- [ ] Fluxo de cancelamento com regra por estado.
- [ ] Fluxo de devolução com vínculo ao pedido original.
- [ ] Fluxo de reenvio para falhas logísticas.

### Critérios de aceite
- [ ] Cancelamento respeita janela e estado permitido.
- [ ] Reenvio não cria pedido fantasma sem vínculo de origem.
- [ ] Atendimento consegue justificar cada exceção com trilha de auditoria.

## Contratos mínimos de dados
Pedido deve possuir, no mínimo:
- [ ] `orderId`
- [ ] `customerId`
- [ ] `items[]`
- [ ] `totalAmount`
- [ ] `paymentStatus`
- [ ] `orderStatus`
- [ ] `createdAt`, `updatedAt`

Logística deve possuir, no mínimo:
- [ ] `shipmentId`
- [ ] `orderId`
- [ ] `trackingCode`
- [ ] `carrier`
- [ ] `shipmentStatus`
- [ ] `shippedAt`, `deliveredAt` (quando aplicável)

## Observabilidade obrigatoria
- [ ] Eventos instrumentados:
  - `order_created`
  - `order_paid`
  - `production_started`
  - `shipment_created`
  - `shipment_delivered`
  - `order_closed`
- [ ] Correlação por `orderId` em todo evento.

## Testes obrigatorios
- [ ] Unit: transições de estado válidas/inválidas.
- [ ] Integração: pedido -> produção -> envio -> entrega.
- [ ] E2E: fluxo principal e ao menos 1 exceção (ex.: cancelamento).

## Segurança e governança
- [ ] Alteração de estado crítica exige role autorizada (RBAC).
- [ ] Override administrativo com justificativa obrigatória.
- [ ] Toda ação crítica registra `AuditLog`.

## Critério de pronto (go-live parcial)
- [ ] Fluxo principal sem quebra em 20 execuções consecutivas em staging.
- [ ] Sem transição inválida em logs de teste.
- [ ] Atendimento consegue rastrear qualquer pedido por `orderId` em menos de 1 minuto.

## Referencias
- `docs/ROLES_MATRIX.md`
- `docs/MVP_ROADMAP.md`
- `docs/ROUTE_DEFINITION_OF_DONE.md`
- `docs/PAYMENTS_DEFINITION_OF_DONE.md`
