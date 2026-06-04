export type OrderStatusUi = 'recebido' | 'producao' | 'enviado' | 'entregue';

export function mapToUiStatus(input: {
  status: string;
  productionStatus?: string | null;
  shipmentStatus?: string | null;
}): OrderStatusUi {
  if (input.status === 'delivered') return 'entregue';
  if (
    input.status === 'shipped' ||
    input.shipmentStatus === 'created' ||
    input.shipmentStatus === 'in_transit'
  ) {
    return 'enviado';
  }
  if (
    input.status === 'in_production' ||
    input.productionStatus === 'queued' ||
    input.productionStatus === 'in_progress'
  ) {
    return 'producao';
  }
  return 'recebido';
}

export function humanizeOrderStatus(status: string | null | undefined) {
  const map: Record<string, string> = {
    draft: 'Pedido em criacao',
    placed: 'Pedido criado',
    paid: 'Pedido pago',
    in_production: 'Pedido em producao',
    shipped: 'Pedido enviado',
    delivered: 'Pedido entregue',
    cancelled: 'Pedido cancelado',
  };
  return status ? map[status] ?? status : 'n/a';
}

export function humanizePaymentStatus(status: string | null | undefined) {
  const map: Record<string, string> = {
    created: 'Pagamento criado',
    processing: 'Pagamento em analise',
    approved: 'Pagamento aprovado',
    failed: 'Pagamento nao aprovado',
  };
  return status ? map[status] ?? status : 'n/a';
}

export function humanizeProductionStatus(status: string | null | undefined) {
  const map: Record<string, string> = {
    queued: 'Pedido confirmado para producao',
    in_progress: 'Pedido em producao',
    shipped: 'Pedido enviado',
  };
  return status ? map[status] ?? status : 'n/a';
}

export function humanizeShipmentStatus(status: string | null | undefined) {
  const map: Record<string, string> = {
    created: 'Rastreio disponivel',
    in_transit: 'Em transito',
    delivered: 'Entregue',
  };
  return status ? map[status] ?? status : 'n/a';
}

export function humanizeTimelineEvent(event: string) {
  const map: Record<string, string> = {
    'order.placed': 'Pedido criado',
    'order.paid': 'Pagamento aprovado',
    'order.in_production': 'Pedido em producao',
    'order.shipped': 'Pedido enviado',
    'production.started': 'Producao iniciada',
    'production.shipped': 'Producao concluida e enviada',
    'shipment.created': 'Rastreio gerado',
    'payment.checkout_started': 'Pagamento iniciado',
    'payment.approved': 'Pagamento aprovado',
  };
  return map[event] ?? event;
}
