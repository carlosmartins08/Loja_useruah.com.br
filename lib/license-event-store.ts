import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export interface LicenseEventRecord {
  licenseEventId: string;
  orderId: string;
  orderItemId: string;
  artistId: string;
  artworkId: string;
  supplierId: string;
  productId: string;
  buyerId: string;
  licenseType: 'commercial_use';
  quantity: number;
  grossSaleAmount: number;
  artistPercentage: number;
  artistLicenseAmount: number;
  platformCommissionAmount: number;
  supplierAmount: number;
  paymentStatus: 'pending' | 'approved' | 'failed' | 'refunded';
  createdAt: string;
  paidAt?: string;
  canceledAt?: string;
  refundedAt?: string;
}

interface LicenseState {
  events: Record<string, LicenseEventRecord>;
  byOrder: Record<string, string[]>;
}

function readState(): LicenseState {
  return readStoreFile<LicenseState>('license-events', { events: {}, byOrder: {} });
}

function writeState(value: LicenseState) {
  writeStoreFile('license-events', value);
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToRecord(row: MysqlRow): LicenseEventRecord {
  return {
    licenseEventId: String(row.license_event_id),
    orderId: String(row.order_id),
    orderItemId: String(row.order_item_id),
    artistId: String(row.artist_id),
    artworkId: String(row.artwork_id),
    supplierId: String(row.supplier_id),
    productId: String(row.product_id),
    buyerId: String(row.buyer_id),
    licenseType: 'commercial_use',
    quantity: Number(row.quantity),
    grossSaleAmount: Number(row.gross_sale_amount),
    artistPercentage: Number(row.artist_percentage),
    artistLicenseAmount: Number(row.artist_license_amount),
    platformCommissionAmount: Number(row.platform_commission_amount),
    supplierAmount: Number(row.supplier_amount),
    paymentStatus: row.payment_status as LicenseEventRecord['paymentStatus'],
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    paidAt: mysqlDatetimeToIso(row.paid_at),
    canceledAt: mysqlDatetimeToIso(row.canceled_at),
    refundedAt: mysqlDatetimeToIso(row.refunded_at),
  };
}

export async function createLicenseEvents(input: Omit<LicenseEventRecord, 'licenseEventId' | 'createdAt'>[]) {
  const now = new Date().toISOString();
  const mysql = await getMysqlPool();

  if (mysql && shouldUseMysql()) {
    const created: LicenseEventRecord[] = [];
    for (const row of input) {
      const existingSql =
        'SELECT * FROM license_events WHERE order_id = ? AND order_item_id = ? AND artwork_id = ? LIMIT 1';
      const [existingRows] = await mysql.execute<MysqlRow[]>(existingSql, [row.orderId, row.orderItemId, row.artworkId]);
      if (existingRows[0]) {
        created.push(rowToRecord(existingRows[0]));
        continue;
      }

      const record: LicenseEventRecord = {
        licenseEventId: `LIC-${randomUUID()}`,
        createdAt: now,
        ...row,
      };
      await mysql.execute<MysqlResult>(
        `INSERT INTO license_events
        (license_event_id, order_id, order_item_id, artist_id, artwork_id, supplier_id, product_id, buyer_id, license_type, quantity, gross_sale_amount, artist_percentage, artist_license_amount, platform_commission_amount, supplier_amount, payment_status, created_at, paid_at, canceled_at, refunded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.licenseEventId,
          record.orderId,
          record.orderItemId,
          record.artistId,
          record.artworkId,
          record.supplierId,
          record.productId,
          record.buyerId,
          record.licenseType,
          record.quantity,
          record.grossSaleAmount,
          record.artistPercentage,
          record.artistLicenseAmount,
          record.platformCommissionAmount,
          record.supplierAmount,
          record.paymentStatus,
          toMysqlDatetime(record.createdAt),
          record.paidAt ? toMysqlDatetime(record.paidAt) : null,
          record.canceledAt ? toMysqlDatetime(record.canceledAt) : null,
          record.refundedAt ? toMysqlDatetime(record.refundedAt) : null,
        ]
      );
      created.push(record);
    }
    return created;
  }

  const state = readState();
  const created: LicenseEventRecord[] = [];
  for (const row of input) {
    const existing = Object.values(state.events).find((event) => event.orderId === row.orderId && event.orderItemId === row.orderItemId && event.artworkId === row.artworkId);
    if (existing) {
      created.push(existing);
      continue;
    }
    const record: LicenseEventRecord = {
      licenseEventId: `LIC-${randomUUID()}`,
      createdAt: now,
      ...row,
    };
    state.events[record.licenseEventId] = record;
    state.byOrder[row.orderId] = [...(state.byOrder[row.orderId] ?? []), record.licenseEventId];
    created.push(record);
  }
  writeState(state);
  return created;
}

export async function listLicenseEventsByOrderId(orderId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM license_events WHERE order_id = ? ORDER BY created_at ASC`, [orderId]);
    return rows.map(rowToRecord);
  }

  const state = readState();
  const ids = state.byOrder[orderId] ?? [];
  return ids.map((id) => state.events[id]).filter((row): row is LicenseEventRecord => Boolean(row));
}
