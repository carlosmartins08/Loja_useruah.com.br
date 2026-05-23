import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export type OrderStatus =
  | 'draft'
  | 'placed'
  | 'paid'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'closed'
  | 'cancelled';

export interface OrderItemRecord {
  orderItemId: string;
  catalogItemId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  grossItemAmount: number;
  supplierAmount: number;
  artistLicenseAmount: number;
  platformCommissionAmount: number;
  gatewayFeeAmount: number;
  shippingAmount: number;
  taxReserveAmount: number;
  supplierNetAmount: number;
  artistNetAmount: number;
  platformNetAmount: number;
}

export interface OrderRecord {
  orderId: string;
  customerId: string;
  items: OrderItemRecord[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

function safePct(raw: string | undefined, fallback: number) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
}

type OrderStoreState = Record<string, OrderRecord>;

function readOrders(): OrderStoreState {
  return readStoreFile<OrderStoreState>('orders', {});
}

function writeOrders(value: OrderStoreState) {
  writeStoreFile('orders', value);
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToOrder(row: MysqlRow): OrderRecord {
  return {
    orderId: String(row.order_id),
    customerId: String(row.customer_id),
    items: typeof row.items_json === 'string' ? (JSON.parse(row.items_json) as OrderItemRecord[]) : [],
    totalAmount: Number(row.total_amount),
    status: row.status as OrderStatus,
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: mysqlDatetimeToIso(row.updated_at) ?? new Date().toISOString(),
    paidAt: mysqlDatetimeToIso(row.paid_at),
  };
}

export async function createPlacedOrder(input: {
  customerId: string;
  items: Array<{
    catalogItemId: string;
    variantId: string;
    quantity: number;
    unitPrice: number;
  }>;
}): Promise<OrderRecord> {
  const now = new Date().toISOString();
  const supplierPct = safePct(process.env.SUPPLIER_REVENUE_PCT, 0.7);
  const artistPct = safePct(process.env.ARTIST_LICENSE_PCT, 0.1);
  const platformPct = safePct(process.env.PLATFORM_COMMISSION_PCT, 0.15);
  const gatewayPct = safePct(process.env.GATEWAY_FEE_PCT, 0.05);
  const shippingPct = safePct(process.env.SHIPPING_PCT, 0);
  const taxReservePct = safePct(process.env.TAX_RESERVE_PCT, 0);
  const round2 = (value: number) => Math.round(value * 100) / 100;

  const items: OrderItemRecord[] = input.items.map((item) => {
    const gross = round2(item.unitPrice * item.quantity);
    const supplierAmount = round2(gross * supplierPct);
    const artistLicenseAmount = round2(gross * artistPct);
    const platformCommissionAmount = round2(gross * platformPct);
    const gatewayFeeAmount = round2(gross * gatewayPct);
    const shippingAmount = round2(gross * shippingPct);
    const taxReserveAmount = round2(gross * taxReservePct);

    return {
      orderItemId: `ITEM-${randomUUID()}`,
      catalogItemId: item.catalogItemId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      grossItemAmount: gross,
      supplierAmount,
      artistLicenseAmount,
      platformCommissionAmount,
      gatewayFeeAmount,
      shippingAmount,
      taxReserveAmount,
      supplierNetAmount: round2(supplierAmount - gatewayFeeAmount - taxReserveAmount),
      artistNetAmount: round2(artistLicenseAmount),
      platformNetAmount: round2(platformCommissionAmount),
    };
  });

  const totalAmount = items.reduce((acc, item) => acc + item.grossItemAmount, 0);
  const orderId = `ORD-${randomUUID()}`;

  const order: OrderRecord = {
    orderId,
    customerId: input.customerId,
    items,
    totalAmount,
    status: 'placed',
    createdAt: now,
    updatedAt: now,
  };

  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(
      `INSERT INTO orders (order_id, customer_id, items_json, total_amount, status, created_at, updated_at, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.orderId,
        order.customerId,
        JSON.stringify(order.items),
        order.totalAmount,
        order.status,
        toMysqlDatetime(order.createdAt),
        toMysqlDatetime(order.updatedAt),
        null,
      ]
    );
    return order;
  }

  const state = readOrders();
  state[orderId] = order;
  writeOrders(state);
  return order;
}

export async function getOrder(orderId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM orders WHERE order_id = ?`, [orderId]);
    return rows[0] ? rowToOrder(rows[0]) : null;
  }

  const state = readOrders();
  return state[orderId] ?? null;
}

export async function listOrders(filters?: { customerId?: string }) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    if (filters?.customerId) {
      const [rows] = await mysql.execute<MysqlRow[]>(
        `SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC`,
        [filters.customerId]
      );
      return rows.map(rowToOrder);
    }

    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM orders ORDER BY created_at DESC`);
    return rows.map(rowToOrder);
  }

  const state = readOrders();
  const items = Object.values(state).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filters?.customerId) {
    return items.filter((item) => item.customerId === filters.customerId);
  }
  return items;
}

export async function updateOrderStatus(orderId: string, nextStatus: OrderStatus) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM orders WHERE order_id = ?`, [orderId]);
    const current = rows[0];
    if (!current) return null;

    const now = new Date().toISOString();
    const paidAtCurrent = mysqlDatetimeToIso(current.paid_at);
    const paidAt = nextStatus === 'paid' ? now : paidAtCurrent;
    await mysql.execute<MysqlResult>(`UPDATE orders SET status = ?, updated_at = ?, paid_at = ? WHERE order_id = ?`, [
      nextStatus,
      toMysqlDatetime(now),
      paidAt ? toMysqlDatetime(paidAt) : null,
      orderId,
    ]);

    const [updatedRows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM orders WHERE order_id = ?`, [orderId]);
    return updatedRows[0] ? rowToOrder(updatedRows[0]) : null;
  }

  const state = readOrders();
  const current = state[orderId];
  if (!current) return null;

  const updated: OrderRecord = {
    ...current,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
    paidAt: nextStatus === 'paid' ? new Date().toISOString() : current.paidAt,
  };

  state[orderId] = updated;
  writeOrders(state);
  return updated;
}
