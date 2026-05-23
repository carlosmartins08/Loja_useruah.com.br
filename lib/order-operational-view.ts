import { listAuditLogs } from '@/lib/audit-log-store';
import { getOrder } from '@/lib/order-store';
import { findPaymentByOrderId } from '@/lib/payment-store';
import { getProductionJobByOrderId } from '@/lib/production-store';
import { getShipmentByOrderId } from '@/lib/shipment-store';
import { listTicketsByOrderId, type TicketRecord } from '@/lib/ticket-store';

interface BuildOrderOperationalViewOptions {
  includeTickets?: boolean;
}

export interface OrderOperationalView {
  order: NonNullable<Awaited<ReturnType<typeof getOrder>>>;
  payment: Awaited<ReturnType<typeof findPaymentByOrderId>>;
  production: Awaited<ReturnType<typeof getProductionJobByOrderId>>;
  shipment: Awaited<ReturnType<typeof getShipmentByOrderId>>;
  tickets: TicketRecord[];
  timeline: Array<{ event: string; createdAt: string }>;
  auditSummary: Array<{ action: string; createdAt: string }>;
}

export async function buildOrderOperationalView(
  orderId: string,
  options?: BuildOrderOperationalViewOptions
): Promise<OrderOperationalView | null> {
  const order = await getOrder(orderId);
  if (!order) return null;

  const [payment, production, shipment, tickets] = await Promise.all([
    findPaymentByOrderId(orderId),
    getProductionJobByOrderId(orderId),
    getShipmentByOrderId(orderId),
    options?.includeTickets ? listTicketsByOrderId(orderId) : Promise.resolve([]),
  ]);

  const timeline = listAuditLogs()
    .filter((entry) => entry.entity_id === orderId || entry.reason === 'order.paid')
    .filter((entry) => entry.entity_type === 'Order' || entry.action.startsWith('order.'))
    .map((entry) => ({
      event: entry.action,
      createdAt: entry.created_at,
    }));

  const relatedIds = new Set<string>([
    order.orderId,
    payment?.paymentId ?? '',
    production?.productionJobId ?? '',
    shipment?.shipmentId ?? '',
  ]);
  const auditSummary = listAuditLogs()
    .filter((entry) => relatedIds.has(entry.entity_id))
    .filter(
      (entry) =>
        entry.entity_type === 'Order' ||
        entry.entity_type === 'Payment' ||
        entry.entity_type === 'ProductionJob' ||
        entry.entity_type === 'Shipment'
    )
    .map((entry) => ({
      action: entry.action,
      createdAt: entry.created_at,
    }));

  return {
    order,
    payment,
    production,
    shipment,
    tickets,
    timeline,
    auditSummary,
  };
}
