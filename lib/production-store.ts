import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export type ProductionStatus = 'queued' | 'in_progress' | 'ready_to_ship' | 'shipped' | 'issue_reported' | 'cancelled';

export interface ProductionJobRecord {
  productionJobId: string;
  orderId: string;
  status: ProductionStatus;
  createdAt: string;
  updatedAt: string;
}

interface ProductionState {
  jobs: Record<string, ProductionJobRecord>;
  byOrder: Record<string, string>;
}

function readState(): ProductionState {
  return readStoreFile<ProductionState>('production', { jobs: {}, byOrder: {} });
}

function writeState(value: ProductionState) {
  writeStoreFile('production', value);
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToJob(row: MysqlRow): ProductionJobRecord {
  return {
    productionJobId: String(row.production_job_id),
    orderId: String(row.order_id),
    status: row.status as ProductionStatus,
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: mysqlDatetimeToIso(row.updated_at) ?? new Date().toISOString(),
  };
}

export async function createQueuedProductionJob(orderId: string): Promise<{ job: ProductionJobRecord; created: boolean }> {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [existingRows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM production_jobs WHERE order_id = ? LIMIT 1`, [orderId]);
    if (existingRows[0]) {
      return { job: rowToJob(existingRows[0]), created: false };
    }

    const now = new Date().toISOString();
    const job: ProductionJobRecord = {
      productionJobId: `PROD-${randomUUID()}`,
      orderId,
      status: 'queued',
      createdAt: now,
      updatedAt: now,
    };

    await mysql.execute<MysqlResult>(
      `INSERT INTO production_jobs (production_job_id, order_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [job.productionJobId, job.orderId, job.status, toMysqlDatetime(job.createdAt), toMysqlDatetime(job.updatedAt)]
    );

    return { job, created: true };
  }

  const state = readState();
  const existingId = state.byOrder[orderId];
  if (existingId) {
    const existing = state.jobs[existingId];
    if (existing) return { job: existing, created: false };
  }

  const now = new Date().toISOString();
  const job: ProductionJobRecord = {
    productionJobId: `PROD-${randomUUID()}`,
    orderId,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
  };

  state.jobs[job.productionJobId] = job;
  state.byOrder[orderId] = job.productionJobId;
  writeState(state);
  return { job, created: true };
}

export async function getProductionJobByOrderId(orderId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM production_jobs WHERE order_id = ? LIMIT 1`, [orderId]);
    return rows[0] ? rowToJob(rows[0]) : null;
  }

  const state = readState();
  const id = state.byOrder[orderId];
  if (!id) return null;
  return state.jobs[id] ?? null;
}

export async function getProductionJobById(productionJobId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM production_jobs WHERE production_job_id = ?`, [productionJobId]);
    return rows[0] ? rowToJob(rows[0]) : null;
  }

  const state = readState();
  return state.jobs[productionJobId] ?? null;
}

export async function listProductionJobs() {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM production_jobs ORDER BY created_at DESC`);
    return rows.map(rowToJob);
  }

  const state = readState();
  return Object.values(state.jobs);
}

export async function updateProductionJobStatus(productionJobId: string, nextStatus: ProductionStatus) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM production_jobs WHERE production_job_id = ?`, [productionJobId]);
    const current = rows[0];
    if (!current) return null;

    const now = new Date().toISOString();
    await mysql.execute<MysqlResult>(`UPDATE production_jobs SET status = ?, updated_at = ? WHERE production_job_id = ?`, [
      nextStatus,
      toMysqlDatetime(now),
      productionJobId,
    ]);

    const [updatedRows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM production_jobs WHERE production_job_id = ?`, [productionJobId]);
    return updatedRows[0] ? rowToJob(updatedRows[0]) : null;
  }

  const state = readState();
  const current = state.jobs[productionJobId];
  if (!current) return null;

  const updated: ProductionJobRecord = {
    ...current,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };

  state.jobs[productionJobId] = updated;
  writeState(state);
  return updated;
}
