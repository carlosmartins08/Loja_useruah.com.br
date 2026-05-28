import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';

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

export function createImpactReview(input: {
  domain: ImpactReviewDomain;
  entityType: ImpactReviewEntityType;
  entityId: string;
  sensitiveFields: string[];
  requestedBy: string;
  priority?: ImpactReviewPriority;
  slaHours?: number;
}) {
  const now = new Date().toISOString();
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
    dueAt: addHours(now, input.slaHours ?? 2),
    requestedBy: input.requestedBy,
  };
  state.reviews[review.reviewId] = review;
  writeState(state);
  return { review, created: true as const };
}

export function listImpactReviews(filters?: { status?: ImpactReviewStatus; onlyOverdue?: boolean }) {
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

export function getImpactReview(reviewId: string) {
  return readState().reviews[reviewId] ?? null;
}

export function getPendingImpactReviewByEntity(entityType: ImpactReviewEntityType, entityId: string) {
  return (
    Object.values(readState().reviews).find(
      (row) => row.entityType === entityType && row.entityId === entityId && row.status === 'pending_review'
    ) ?? null
  );
}

export function getLatestImpactReviewByEntity(entityType: ImpactReviewEntityType, entityId: string) {
  const rows = Object.values(readState().reviews)
    .filter((row) => row.entityType === entityType && row.entityId === entityId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return rows[0] ?? null;
}

export function listImpactReviewsByEntities(entityType: ImpactReviewEntityType, entityIds: string[]) {
  const ids = new Set(entityIds);
  return Object.values(readState().reviews).filter((row) => row.entityType === entityType && ids.has(row.entityId));
}

export function approveImpactReview(input: { reviewId: string; approvedBy: string; reason?: string }) {
  const state = readState();
  const current = state.reviews[input.reviewId];
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
  state.reviews[input.reviewId] = updated;
  writeState(state);
  return { kind: 'updated' as const, previous: current, review: updated };
}

export function rejectImpactReview(input: { reviewId: string; rejectedBy: string; reason: string }) {
  const state = readState();
  const current = state.reviews[input.reviewId];
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
  state.reviews[input.reviewId] = updated;
  writeState(state);
  return { kind: 'updated' as const, previous: current, review: updated };
}
