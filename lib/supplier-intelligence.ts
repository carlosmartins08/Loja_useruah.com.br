import { listOrders } from '@/lib/order-store';

function round2(value: number) {
  return Number(value.toFixed(2));
}

export interface SupplierIntelligenceRow {
  supplierId: string;
  orders: number;
  totalGross: number;
  avgTicket: number;
  avgLeadTimeDays: number;
  onTimeRate: number;
  competitivenessScore: number;
  alerts: string[];
}

export async function buildSupplierIntelligence(supplierId?: string): Promise<SupplierIntelligenceRow[]> {
  const orders = await listOrders();
  const suppliers = new Map<string, SupplierIntelligenceRow>();

  for (const order of orders) {
    const leadTimeDays = Math.max(0, (new Date(order.updatedAt).getTime() - new Date(order.createdAt).getTime()) / 86_400_000);
    const onTime = leadTimeDays <= 12;
    const statusPenalty = order.status === 'cancelled' ? 1 : 0;

    for (const item of order.items) {
      const key = item.supplierId;
      if (!suppliers.has(key)) {
        suppliers.set(key, {
          supplierId: key,
          orders: 0,
          totalGross: 0,
          avgTicket: 0,
          avgLeadTimeDays: 0,
          onTimeRate: 0,
          competitivenessScore: 0,
          alerts: [],
        });
      }
      const row = suppliers.get(key)!;
      row.orders += 1;
      row.totalGross = round2(row.totalGross + item.grossItemAmount);
      row.avgLeadTimeDays = round2(((row.avgLeadTimeDays * (row.orders - 1) + leadTimeDays + statusPenalty * 5) / row.orders));
      row.onTimeRate = round2(((row.onTimeRate * (row.orders - 1) + (onTime ? 1 : 0)) / row.orders));
    }
  }

  const result = Array.from(suppliers.values()).map((row) => {
    row.avgTicket = row.orders > 0 ? round2(row.totalGross / row.orders) : 0;
    const speedScore = Math.max(0, 100 - row.avgLeadTimeDays * 5);
    const slaScore = row.onTimeRate * 100;
    const scaleScore = Math.min(100, row.orders * 4);
    row.competitivenessScore = round2(speedScore * 0.45 + slaScore * 0.4 + scaleScore * 0.15);
    row.alerts = [];
    if (row.avgLeadTimeDays > 12) row.alerts.push('lead_time_above_target');
    if (row.onTimeRate < 0.85) row.alerts.push('sla_below_target');
    if (row.competitivenessScore < 70) row.alerts.push('competitiveness_below_target');
    return row;
  });

  if (supplierId) {
    return result.filter((row) => row.supplierId === supplierId);
  }
  return result.sort((a, b) => b.competitivenessScore - a.competitivenessScore);
}
