import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export interface ShipmentRecord {
  shipmentId: string;
  orderId: string;
  trackingCode: string;
  carrier: string;
  status: 'created';
  createdAt: string;
  updatedAt: string;
}

interface ShipmentState {
  shipments: Record<string, ShipmentRecord>;
  byOrder: Record<string, string>;
}

function readState(): ShipmentState {
  return readStoreFile<ShipmentState>('shipments', { shipments: {}, byOrder: {} });
}

function writeState(value: ShipmentState) {
  writeStoreFile('shipments', value);
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToShipment(row: MysqlRow): ShipmentRecord {
  return {
    shipmentId: String(row.shipment_id),
    orderId: String(row.order_id),
    trackingCode: String(row.tracking_code),
    carrier: String(row.carrier),
    status: 'created',
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: mysqlDatetimeToIso(row.updated_at) ?? new Date().toISOString(),
  };
}

export async function createOrGetShipment(input: {
  orderId: string;
  trackingCode: string;
  carrier: string;
}): Promise<{ shipment: ShipmentRecord; created: boolean }> {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [existingRows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM shipments WHERE order_id = ? LIMIT 1`, [input.orderId]);
    if (existingRows[0]) {
      return { shipment: rowToShipment(existingRows[0]), created: false };
    }

    const now = new Date().toISOString();
    const shipment: ShipmentRecord = {
      shipmentId: `SHP-${randomUUID()}`,
      orderId: input.orderId,
      trackingCode: input.trackingCode,
      carrier: input.carrier,
      status: 'created',
      createdAt: now,
      updatedAt: now,
    };

    await mysql.execute<MysqlResult>(
      `INSERT INTO shipments (shipment_id, order_id, tracking_code, carrier, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        shipment.shipmentId,
        shipment.orderId,
        shipment.trackingCode,
        shipment.carrier,
        shipment.status,
        toMysqlDatetime(shipment.createdAt),
        toMysqlDatetime(shipment.updatedAt),
      ]
    );
    return { shipment, created: true };
  }

  const state = readState();
  const existingId = state.byOrder[input.orderId];
  if (existingId) {
    const existing = state.shipments[existingId];
    if (existing) return { shipment: existing, created: false };
  }

  const now = new Date().toISOString();
  const shipment: ShipmentRecord = {
    shipmentId: `SHP-${randomUUID()}`,
    orderId: input.orderId,
    trackingCode: input.trackingCode,
    carrier: input.carrier,
    status: 'created',
    createdAt: now,
    updatedAt: now,
  };

  state.shipments[shipment.shipmentId] = shipment;
  state.byOrder[input.orderId] = shipment.shipmentId;
  writeState(state);
  return { shipment, created: true };
}

export async function getShipmentByOrderId(orderId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM shipments WHERE order_id = ? LIMIT 1`, [orderId]);
    return rows[0] ? rowToShipment(rows[0]) : null;
  }

  const state = readState();
  const id = state.byOrder[orderId];
  if (!id) return null;
  return state.shipments[id] ?? null;
}
