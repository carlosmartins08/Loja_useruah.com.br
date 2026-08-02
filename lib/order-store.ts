import { createHash, randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';
import type { MovementMarkupSnapshot } from '@/lib/campaign-pricing';
import type { Pool, PoolConnection } from 'mysql2/promise';

export type OrderStatus =
  | 'draft'
  | 'placed'
  | 'paid'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'closed'
  | 'cancelled';

export interface OrderItemSnapshot {
  catalogItemId: string;
  artworkId: string;
  artworkAuthorId: string;
  productBaseId: string;
  productName: string;
  variantId: string;
  variantLabel: string;
  productImage: string;
  supplierId: string;
  campaignId?: string;
  campaignName?: string;
  campaignProgressivePriceRule?: string;
  organizationId?: string;
  communityOwnerId?: string;
  referralLinkId?: string;
  affiliateUserId?: string;
  shippingAddress: ShippingAddress;
  quantity: number;
  unitPrice: number;
  priceCompositionVersion?: string;
  movementMarkup?: MovementMarkupSnapshot | null;
  snapshotVersion: 'phase1-v1' | 'phase2-context-v1' | 'phase2-context-pricing-v1';
}

export interface OrderItemRecord extends OrderItemSnapshot {
  orderItemId: string;
  grossItemAmount: number;
  supplierAmount: number;
  artistLicenseAmount: number;
  platformCommissionAmount: number;
  gatewayFeeAmount: number;
  shippingAmount: number;
  taxReserveAmount: number;
  communityCommissionAmount: number;
  supplierNetAmount: number;
  artistNetAmount: number;
  platformNetAmount: number;
}

export interface ShippingAddress {
  recipientName: string;
  cep: string;
  street: string;
  number: string;
  city: string;
  state: string;
  country: string;
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

export interface CreatePlacedOrderInput {
  customerId: string;
  supplierId: string;
  shippingAddress: ShippingAddress;
  attribution?: {
    campaignId?: string;
    campaignName?: string;
    campaignProgressivePriceRule?: string;
    organizationId?: string;
    communityOwnerId?: string;
    referralLinkId?: string;
    affiliateUserId?: string;
  };
  items: Array<{
    catalogItemId: string;
    variantId: string;
    quantity: number;
    unitPrice: number;
    priceCompositionVersion?: string;
    movementMarkup?: MovementMarkupSnapshot | null;
  }>;
}

interface OrderCreationIdempotencyRecord {
  orderId: string;
  payloadHash: string;
}

type OrderCreationIdempotencyState = Record<string, OrderCreationIdempotencyRecord>;

export class OrderCreationIdempotencyError extends Error {
  readonly status = 409;
  readonly code = 'order_idempotency_conflict';

  constructor() {
    super('order_idempotency_conflict');
  }
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

function readOrderCreationIdempotency(): OrderCreationIdempotencyState {
  return readStoreFile<OrderCreationIdempotencyState>('order-creation-idempotency', {});
}

function writeOrderCreationIdempotency(value: OrderCreationIdempotencyState) {
  writeStoreFile('order-creation-idempotency', value);
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function fallbackShippingAddress(): ShippingAddress {
  return {
    recipientName: 'Destinatario nao informado',
    cep: '00000-000',
    street: 'Nao informado',
    number: 'S/N',
    city: 'Nao informado',
    state: 'NA',
    country: 'BR',
  };
}

function normalizeOrderItem(input: Record<string, unknown>): OrderItemRecord {
  return {
    orderItemId: String(input.orderItemId),
    catalogItemId: String(input.catalogItemId),
    artworkId: typeof input.artworkId === 'string' && input.artworkId.trim().length > 0 ? input.artworkId : 'artwork-unknown',
    artworkAuthorId:
      typeof input.artworkAuthorId === 'string' && input.artworkAuthorId.trim().length > 0
        ? input.artworkAuthorId
        : process.env.ARTIST_OWNER_DEFAULT_ID?.trim() || 'artist-default',
    productBaseId:
      typeof input.productBaseId === 'string' && input.productBaseId.trim().length > 0 ? input.productBaseId : String(input.catalogItemId),
    productName:
      typeof input.productName === 'string' && input.productName.trim().length > 0 ? input.productName : String(input.catalogItemId),
    variantId: String(input.variantId),
    variantLabel:
      typeof input.variantLabel === 'string' && input.variantLabel.trim().length > 0 ? input.variantLabel : String(input.variantId),
    productImage: typeof input.productImage === 'string' && input.productImage.trim().length > 0 ? input.productImage : '',
    supplierId: typeof input.supplierId === 'string' && input.supplierId.trim().length > 0 ? input.supplierId : 'supplier-default',
    campaignId: typeof input.campaignId === 'string' && input.campaignId.trim().length > 0 ? input.campaignId : undefined,
    campaignName: typeof input.campaignName === 'string' && input.campaignName.trim().length > 0 ? input.campaignName : undefined,
    campaignProgressivePriceRule:
      typeof input.campaignProgressivePriceRule === 'string' && input.campaignProgressivePriceRule.trim().length > 0
        ? input.campaignProgressivePriceRule
        : undefined,
    organizationId: typeof input.organizationId === 'string' && input.organizationId.trim().length > 0 ? input.organizationId : undefined,
    communityOwnerId:
      typeof input.communityOwnerId === 'string' && input.communityOwnerId.trim().length > 0 ? input.communityOwnerId : undefined,
    referralLinkId:
      typeof input.referralLinkId === 'string' && input.referralLinkId.trim().length > 0 ? input.referralLinkId : undefined,
    affiliateUserId:
      typeof input.affiliateUserId === 'string' && input.affiliateUserId.trim().length > 0 ? input.affiliateUserId : undefined,
    shippingAddress:
      input.shippingAddress && typeof input.shippingAddress === 'object'
        ? {
            ...fallbackShippingAddress(),
            ...(input.shippingAddress as Partial<ShippingAddress>),
          }
        : fallbackShippingAddress(),
    quantity: Number(input.quantity),
    unitPrice: Number(input.unitPrice),
    priceCompositionVersion:
      typeof input.priceCompositionVersion === 'string' && input.priceCompositionVersion.trim().length > 0
        ? input.priceCompositionVersion
        : undefined,
    movementMarkup:
      input.movementMarkup && typeof input.movementMarkup === 'object'
        ? (input.movementMarkup as MovementMarkupSnapshot)
        : undefined,
    snapshotVersion:
      input.snapshotVersion === 'phase2-context-pricing-v1'
        ? 'phase2-context-pricing-v1'
        : input.snapshotVersion === 'phase2-context-v1'
          ? 'phase2-context-v1'
          : 'phase1-v1',
    grossItemAmount: Number(input.grossItemAmount),
    supplierAmount: Number(input.supplierAmount),
    artistLicenseAmount: Number(input.artistLicenseAmount),
    platformCommissionAmount: Number(input.platformCommissionAmount),
    gatewayFeeAmount: Number(input.gatewayFeeAmount),
    shippingAmount: Number(input.shippingAmount),
    taxReserveAmount: Number(input.taxReserveAmount),
    communityCommissionAmount: Number(input.communityCommissionAmount ?? 0),
    supplierNetAmount: Number(input.supplierNetAmount),
    artistNetAmount: Number(input.artistNetAmount),
    platformNetAmount: Number(input.platformNetAmount),
  };
}

function rowToOrder(row: MysqlRow): OrderRecord {
  const parsedItems = typeof row.items_json === 'string' ? (JSON.parse(row.items_json) as Array<Record<string, unknown>>) : [];
  return {
    orderId: String(row.order_id),
    customerId: String(row.customer_id),
    items: parsedItems.map(normalizeOrderItem),
    totalAmount: Number(row.total_amount),
    status: row.status as OrderStatus,
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: mysqlDatetimeToIso(row.updated_at) ?? new Date().toISOString(),
    paidAt: mysqlDatetimeToIso(row.paid_at),
  };
}

async function buildPlacedOrder(input: CreatePlacedOrderInput): Promise<OrderRecord> {
  const now = new Date().toISOString();
  const supplierPct = safePct(process.env.SUPPLIER_REVENUE_PCT, 0.7);
  const artistPct = safePct(process.env.ARTIST_LICENSE_PCT, 0.1);
  const platformPct = safePct(process.env.PLATFORM_COMMISSION_PCT, 0.15);
  const gatewayPct = safePct(process.env.GATEWAY_FEE_PCT, 0.05);
  const shippingPct = safePct(process.env.SHIPPING_PCT, 0);
  const taxReservePct = safePct(process.env.TAX_RESERVE_PCT, 0);
  const communityPct = safePct(process.env.COMMUNITY_COMMISSION_PCT, 0.05);
  const round2 = (value: number) => Math.round(value * 100) / 100;

  const { getCatalogItem } = await import('@/lib/catalog-item-store');
  const { getArtwork } = await import('@/lib/artwork-store');
  const itemDetails = await Promise.all(
    input.items.map(async (item) => {
      const catalogItem = await getCatalogItem(item.catalogItemId);
      const variant = catalogItem?.variants.find((row) => row.variantId === item.variantId);
      const artwork = catalogItem ? await getArtwork(catalogItem.artworkId) : null;
      return {
        item,
        catalogItem,
        variant,
        artwork,
      };
    })
  );

  const hasAttribution = Boolean(
    input.attribution?.campaignId ||
      input.attribution?.organizationId ||
      input.attribution?.communityOwnerId ||
      input.attribution?.referralLinkId ||
      input.attribution?.affiliateUserId
  );

  const items: OrderItemRecord[] = itemDetails.map(({ item, catalogItem, variant, artwork }) => {
    const gross = round2(item.unitPrice * item.quantity);
    const supplierAmount = round2(gross * supplierPct);
    const artistLicenseAmount = round2(gross * artistPct);
    const platformCommissionAmount = round2(gross * platformPct);
    const gatewayFeeAmount = round2(gross * gatewayPct);
    const shippingAmount = round2(gross * shippingPct);
    const taxReserveAmount = round2(gross * taxReservePct);
    const communityCommissionAmount = input.attribution?.communityOwnerId ? round2(gross * communityPct) : 0;

    return {
      orderItemId: `ITEM-${randomUUID()}`,
      catalogItemId: item.catalogItemId,
      artworkId: catalogItem?.artworkId ?? 'artwork-unknown',
      artworkAuthorId: artwork?.authorId ?? (process.env.ARTIST_OWNER_DEFAULT_ID?.trim() || 'artist-default'),
      productBaseId: catalogItem?.productBaseId ?? item.catalogItemId,
      productName: catalogItem?.name ?? item.catalogItemId,
      variantId: item.variantId,
      variantLabel: variant?.label ?? item.variantId,
      productImage: variant?.image ?? catalogItem?.image ?? '',
      supplierId: input.supplierId,
      campaignId: input.attribution?.campaignId,
      campaignName: input.attribution?.campaignName,
      campaignProgressivePriceRule: input.attribution?.campaignProgressivePriceRule,
      organizationId: input.attribution?.organizationId,
      communityOwnerId: input.attribution?.communityOwnerId,
      referralLinkId: input.attribution?.referralLinkId,
      affiliateUserId: input.attribution?.affiliateUserId,
      shippingAddress: input.shippingAddress,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      priceCompositionVersion: item.priceCompositionVersion,
      movementMarkup: item.movementMarkup,
      snapshotVersion: item.priceCompositionVersion
        ? 'phase2-context-pricing-v1'
        : hasAttribution
          ? 'phase2-context-v1'
          : 'phase1-v1',
      grossItemAmount: gross,
      supplierAmount,
      artistLicenseAmount,
      platformCommissionAmount,
      gatewayFeeAmount,
      shippingAmount,
      taxReserveAmount,
      communityCommissionAmount,
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

  return order;
}

function orderCreationPayloadHash(input: CreatePlacedOrderInput) {
  const canonicalPayload = {
    supplierId: input.supplierId,
    shippingAddress: {
      recipientName: input.shippingAddress.recipientName,
      cep: input.shippingAddress.cep,
      street: input.shippingAddress.street,
      number: input.shippingAddress.number,
      city: input.shippingAddress.city,
      state: input.shippingAddress.state,
      country: input.shippingAddress.country,
    },
    attribution: {
      campaignId: input.attribution?.campaignId ?? null,
      campaignName: input.attribution?.campaignName ?? null,
      campaignProgressivePriceRule: input.attribution?.campaignProgressivePriceRule ?? null,
      organizationId: input.attribution?.organizationId ?? null,
      communityOwnerId: input.attribution?.communityOwnerId ?? null,
      referralLinkId: input.attribution?.referralLinkId ?? null,
      affiliateUserId: input.attribution?.affiliateUserId ?? null,
    },
    items: input.items.map((item) => ({
      catalogItemId: item.catalogItemId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice.toFixed(2)),
      priceCompositionVersion: item.priceCompositionVersion ?? null,
      movementMarkup: item.movementMarkup ?? null,
    })),
  };

  return createHash('sha256').update(JSON.stringify(canonicalPayload)).digest('hex');
}

type MysqlOrderExecutor = Pick<Pool, 'execute'> | Pick<PoolConnection, 'execute'>;

async function insertMysqlOrder(executor: MysqlOrderExecutor, order: OrderRecord) {
  await executor.execute<MysqlResult>(
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
}

async function findMysqlOrderCreationIdempotency(
  executor: MysqlOrderExecutor,
  customerId: string,
  idempotencyKey: string
) {
  const [rows] = await executor.execute<MysqlRow[]>(
    `SELECT order_id, payload_hash
     FROM order_creation_idempotency
     WHERE customer_id = ? AND idempotency_key = ?`,
    [customerId, idempotencyKey]
  );
  if (!rows[0]) return null;
  return {
    orderId: String(rows[0].order_id),
    payloadHash: String(rows[0].payload_hash),
  };
}

function isMysqlDuplicateEntry(error: unknown) {
  return Boolean(error && typeof error === 'object' && (error as { code?: string }).code === 'ER_DUP_ENTRY');
}

function assertCompatibleOrderAttempt(record: OrderCreationIdempotencyRecord, payloadHash: string) {
  if (record.payloadHash !== payloadHash) {
    throw new OrderCreationIdempotencyError();
  }
}

export async function createPlacedOrder(input: CreatePlacedOrderInput): Promise<OrderRecord> {
  const order = await buildPlacedOrder(input);
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await insertMysqlOrder(mysql, order);
    return order;
  }

  const state = readOrders();
  state[order.orderId] = order;
  writeOrders(state);
  return order;
}

export async function createPlacedOrderIdempotent(
  input: CreatePlacedOrderInput,
  idempotencyKey: string
): Promise<{ order: OrderRecord; reused: boolean }> {
  const payloadHash = orderCreationPayloadHash(input);
  const mysql = await getMysqlPool();

  if (mysql && shouldUseMysql()) {
    const existing = await findMysqlOrderCreationIdempotency(mysql, input.customerId, idempotencyKey);
    if (existing) {
      assertCompatibleOrderAttempt(existing, payloadHash);
      const order = await getOrder(existing.orderId);
      if (!order || order.customerId !== input.customerId) {
        throw new Error('order_idempotency_mapping_invalid');
      }
      return { order, reused: true };
    }

    const order = await buildPlacedOrder(input);
    const connection = await mysql.getConnection();
    try {
      await connection.beginTransaction();
      await insertMysqlOrder(connection, order);
      await connection.execute<MysqlResult>(
        `INSERT INTO order_creation_idempotency
          (customer_id, idempotency_key, order_id, payload_hash, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [input.customerId, idempotencyKey, order.orderId, payloadHash, toMysqlDatetime(order.createdAt)]
      );
      await connection.commit();
      return { order, reused: false };
    } catch (error) {
      await connection.rollback();
      if (!isMysqlDuplicateEntry(error)) throw error;

      const concurrent = await findMysqlOrderCreationIdempotency(mysql, input.customerId, idempotencyKey);
      if (!concurrent) throw error;
      assertCompatibleOrderAttempt(concurrent, payloadHash);
      const existingOrder = await getOrder(concurrent.orderId);
      if (!existingOrder || existingOrder.customerId !== input.customerId) {
        throw new Error('order_idempotency_mapping_invalid');
      }
      return { order: existingOrder, reused: true };
    } finally {
      connection.release();
    }
  }

  const attemptId = JSON.stringify([input.customerId, idempotencyKey]);
  const idempotencyState = readOrderCreationIdempotency();
  const existing = idempotencyState[attemptId];
  if (existing) {
    assertCompatibleOrderAttempt(existing, payloadHash);
    const order = await getOrder(existing.orderId);
    if (!order || order.customerId !== input.customerId) {
      throw new Error('order_idempotency_mapping_invalid');
    }
    return { order, reused: true };
  }

  const order = await createPlacedOrder(input);
  idempotencyState[attemptId] = { orderId: order.orderId, payloadHash };
  writeOrderCreationIdempotency(idempotencyState);
  return { order, reused: false };
}

export async function getOrder(orderId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM orders WHERE order_id = ?`, [orderId]);
    return rows[0] ? rowToOrder(rows[0]) : null;
  }

  const state = readOrders();
  const raw = state[orderId];
  if (!raw) return null;
  return {
    ...raw,
    items: raw.items.map((item) => normalizeOrderItem(item as unknown as Record<string, unknown>)),
  };
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
  const items = Object.values(state)
    .map((row) => ({
      ...row,
      items: row.items.map((item) => normalizeOrderItem(item as unknown as Record<string, unknown>)),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
