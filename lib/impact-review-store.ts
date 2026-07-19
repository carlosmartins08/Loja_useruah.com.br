import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export type ImpactReviewStatus = 'pending_review' | 'approved' | 'rejected';
export type ImpactReviewPriority = 'high' | 'normal';
export type ImpactReviewDomain = 'supplier_catalog' | 'payout_finance' | 'campaign_growth';
export type ImpactReviewEntityType = 'CatalogItem' | 'Payout' | 'Campaign' | 'Refund' | 'Chargeback';

export interface ImpactReviewRecord {
  reviewId: string;
  domain: ImpactReviewDomain;
  entityType: ImpactReviewEntityType;
  entityId: string;
  sensitiveFields: string[];
  status: ImpactReviewStatus;
  priority: ImpactReviewPriority;
  createdAt: string;
  updatedAt: string;
  dueAt: string;
  requestedBy: string;
  approvedBy?: string;
  rejectedBy?: string;
  decisionReason?: string;
}

interface ImpactReviewState {
  reviews: Record<string, ImpactReviewRecord>;
}

function readState(): ImpactReviewState {
  return readStoreFile<ImpactReviewState>('impact-reviews', { reviews: {} });
}

function writeState(state: ImpactReviewState) {
  writeStoreFile('impact-reviews', state);
}

function addHours(iso: string, hours: number) {
  const d = new Date(iso);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function parseMysqlJson<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  if (value !== null && typeof value === 'object') return value as T;
  return fallback;
}

function rowToImpactReview(row: MysqlRow): ImpactReviewRecord {
  return {
    reviewId: String(row.review_id),
    domain: row.domain as ImpactReviewDomain,
    entityType: row.entity_type as ImpactReviewEntityType,
    entityId: String(row.entity_id),
    sensitiveFields: parseMysqlJson(row.sensitive_fields_json, []),
    status: row.status as ImpactReviewStatus,
    priority: row.priority as ImpactReviewPriority,
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: mysqlDatetimeToIso(row.updated_at) ?? new Date().toISOString(),
    dueAt: mysqlDatetimeToIso(row.due_at) ?? new Date().toISOString(),
    requestedBy: String(row.requested_by),
    approvedBy: row.approved_by ? String(row.approved_by) : undefined,
    rejectedBy: row.rejected_by ? String(row.rejected_by) : undefined,
    decisionReason: row.decision_reason ? String(row.decision_reason) : undefined,
  };
}

export async function createImpactReview(input: {
  domain: ImpactReviewDomain;
  entityType: ImpactReviewEntityType;
  entityId: string;
  sensitiveFields: string[];
  requestedBy: string;
  priority?: ImpactReviewPriority;
  slaHours?: number;
}) {
  const now = new Date().toISOString();
  const dueAt = addHours(now, input.slaHours ?? 2);
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [existingRows] = await mysql.execute<MysqlRow[]>(
      `SELECT * FROM impact_reviews
       WHERE domain = ? AND entity_type = ? AND entity_id = ? AND status = 'pending_review'
       ORDER BY updated_at DESC LIMIT 1`,
      [input.domain, input.entityType, input.entityId]
    );
    if (existingRows[0]) return { review: rowToImpactReview(existingRows[0]), created: false as const };

    const review: ImpactReviewRecord = {
      reviewId: `IMPACT-${randomUUID()}`,
      domain: input.domain,
      entityType: input.entityType,
      entityId: input.entityId,
      sensitiveFields: Array.from(new Set(input.sensitiveFields)),
      status: 'pending_review',
      priority: input.priority ?? 'normal',
      createdAt: now,
      updatedAt: now,
      dueAt,
      requestedBy: input.requestedBy,
    };
    await mysql.execute<MysqlResult>(
      `INSERT INTO impact_reviews (
        review_id, domain, entity_type, entity_id, sensitive_fields_json, status, priority,
        created_at, updated_at, due_at, requested_by, approved_by, rejected_by, decision_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        review.reviewId,
        review.domain,
        review.entityType,
        review.entityId,
        JSON.stringify(review.sensitiveFields),
        review.status,
        review.priority,
        toMysqlDatetime(review.createdAt),
        toMysqlDatetime(review.updatedAt),
        toMysqlDatetime(review.dueAt),
        review.requestedBy,
        null,
        null,
        null,
      ]
    );
    return { review, created: true as const };
  }

  const state = readState();
  const existing = Object.values(state.reviews).find(
    (row) =>
      row.domain === input.domain &&
      row.entityType === input.entityType &&
      row.entityId === input.entityId &&
      row.status === 'pending_review'
  );
  if (existing) return { review: existing, created: false as const };

  const review: ImpactReviewRecord = {
    reviewId: `IMPACT-${randomUUID()}`,
    domain: input.domain,
    entityType: input.entityType,
    entityId: input.entityId,
    sensitiveFields: Array.from(new Set(input.sensitiveFields)),
    status: 'pending_review',
    priority: input.priority ?? 'normal',
    createdAt: now,
    updatedAt: now,
    dueAt,
    requestedBy: input.requestedBy,
  };
  state.reviews[review.reviewId] = review;
  writeState(state);
  return { review, created: true as const };
}

export async function listImpactReviews(filters?: { status?: ImpactReviewStatus; onlyOverdue?: boolean }) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const conditions: string[] = [];
    const params: string[] = [];
    if (filters?.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }
    if (filters?.onlyOverdue) {
      conditions.push("status = 'pending_review'", 'due_at < NOW(3)');
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM impact_reviews ${whereClause} ORDER BY updated_at DESC`, params);
    return rows.map(rowToImpactReview);
  }

  const now = new Date();
  return Object.values(readState().reviews).filter((row) => {
    if (filters?.status && row.status !== filters.status) return false;
    if (filters?.onlyOverdue) {
      if (row.status !== 'pending_review') return false;
      if (new Date(row.dueAt) >= now) return false;
    }
    return true;
  });
}

export async function getImpactReview(reviewId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM impact_reviews WHERE review_id = ?`, [reviewId]);
    return rows[0] ? rowToImpactReview(rows[0]) : null;
  }
  return readState().reviews[reviewId] ?? null;
}

export async function getPendingImpactReviewByEntity(entityType: ImpactReviewEntityType, entityId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(
      `SELECT * FROM impact_reviews WHERE entity_type = ? AND entity_id = ? AND status = 'pending_review' ORDER BY updated_at DESC LIMIT 1`,
      [entityType, entityId]
    );
    return rows[0] ? rowToImpactReview(rows[0]) : null;
  }
  return (
    Object.values(readState().reviews).find(
      (row) => row.entityType === entityType && row.entityId === entityId && row.status === 'pending_review'
    ) ?? null
  );
}

export async function getLatestImpactReviewByEntity(entityType: ImpactReviewEntityType, entityId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(
      `SELECT * FROM impact_reviews WHERE entity_type = ? AND entity_id = ? ORDER BY updated_at DESC LIMIT 1`,
      [entityType, entityId]
    );
    return rows[0] ? rowToImpactReview(rows[0]) : null;
  }
  const rows = Object.values(readState().reviews)
    .filter((row) => row.entityType === entityType && row.entityId === entityId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return rows[0] ?? null;
}

export async function listImpactReviewsByEntities(entityType: ImpactReviewEntityType, entityIds: string[]) {
  if (entityIds.length === 0) return [];
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const placeholders = entityIds.map(() => '?').join(', ');
    const [rows] = await mysql.execute<MysqlRow[]>(
      `SELECT * FROM impact_reviews WHERE entity_type = ? AND entity_id IN (${placeholders}) ORDER BY updated_at DESC`,
      [entityType, ...entityIds]
    );
    return rows.map(rowToImpactReview);
  }
  const ids = new Set(entityIds);
  return Object.values(readState().reviews).filter((row) => row.entityType === entityType && ids.has(row.entityId));
}

export async function approveImpactReview(input: { reviewId: string; approvedBy: string; reason?: string }) {
  const current = await getImpactReview(input.reviewId);
  if (!current) return { kind: 'not_found' as const };
  if (current.status !== 'pending_review') return { kind: 'invalid_transition' as const, review: current };
  const now = new Date().toISOString();
  const updated: ImpactReviewRecord = {
    ...current,
    status: 'approved',
    approvedBy: input.approvedBy,
    decisionReason: input.reason?.trim() || undefined,
    updatedAt: now,
  };

  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(
      `UPDATE impact_reviews SET status = ?, approved_by = ?, decision_reason = ?, updated_at = ? WHERE review_id = ?`,
      [updated.status, updated.approvedBy ?? null, updated.decisionReason ?? null, toMysqlDatetime(now), updated.reviewId]
    );
  } else {
    const state = readState();
    state.reviews[input.reviewId] = updated;
    writeState(state);
  }
  return { kind: 'updated' as const, previous: current, review: updated };
}

export async function rejectImpactReview(input: { reviewId: string; rejectedBy: string; reason: string }) {
  const current = await getImpactReview(input.reviewId);
  if (!current) return { kind: 'not_found' as const };
  if (current.status !== 'pending_review') return { kind: 'invalid_transition' as const, review: current };
  const trimmedReason = input.reason.trim();
  if (!trimmedReason) return { kind: 'missing_reason' as const, review: current };
  const now = new Date().toISOString();
  const updated: ImpactReviewRecord = {
    ...current,
    status: 'rejected',
    rejectedBy: input.rejectedBy,
    decisionReason: trimmedReason,
    updatedAt: now,
  };

  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(
      `UPDATE impact_reviews SET status = ?, rejected_by = ?, decision_reason = ?, updated_at = ? WHERE review_id = ?`,
      [updated.status, updated.rejectedBy ?? null, updated.decisionReason ?? null, toMysqlDatetime(now), updated.reviewId]
    );
  } else {
    const state = readState();
    state.reviews[input.reviewId] = updated;
    writeState(state);
  }
  return { kind: 'updated' as const, previous: current, review: updated };
}
