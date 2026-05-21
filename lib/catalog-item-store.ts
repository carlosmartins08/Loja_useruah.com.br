import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';

export type CatalogItemStatus = 'draft' | 'ready' | 'published' | 'archived';

export interface CatalogItemVariant {
  variantId: string;
  label: string;
  price: number;
  image: string;
  inStock: boolean;
}

export interface CatalogItemRecord {
  catalogItemId: string;
  artworkId: string;
  productBaseId: string;
  name: string;
  price: number;
  image: string;
  colorImages: Record<string, string>;
  fit: 'slim' | 'regular' | 'oversized';
  fabric: string;
  printTypeDescription: string;
  washGuide: string;
  installmentCount: number;
  detailImages: Array<{ label: string; src: string }>;
  modelMockups: Array<{ label: string; src: string }>;
  variants: CatalogItemVariant[];
  category?: 'Autoral' | 'Campanhas' | 'Fardamento' | 'Acessórios';
  segment?: 'Base' | 'Customizada';
  tags?: string[];
  publicationStatus: CatalogItemStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  unpublishedAt?: string;
  publicationReason?: string;
}

type CatalogState = Record<string, CatalogItemRecord>;

function readCatalog(): CatalogState {
  return readStoreFile<CatalogState>('catalog-items', {});
}

function writeCatalog(value: CatalogState) {
  writeStoreFile('catalog-items', value);
}

export function createCatalogItem(
  input: Omit<CatalogItemRecord, 'catalogItemId' | 'publicationStatus' | 'createdAt' | 'updatedAt'> & {
    catalogItemId?: string;
  }
) {
  const now = new Date().toISOString();
  const catalogItemId = input.catalogItemId?.trim() || `CAT-${randomUUID()}`;
  const state = readCatalog();
  if (state[catalogItemId]) {
    return { item: state[catalogItemId], created: false as const };
  }
  const record: CatalogItemRecord = {
    ...input,
    catalogItemId,
    publicationStatus: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  state[catalogItemId] = record;
  writeCatalog(state);
  return { item: record, created: true as const };
}

export function listCatalogItems(filters?: {
  publicationStatus?: CatalogItemStatus;
  artworkId?: string;
}) {
  return Object.values(readCatalog()).filter((item) => {
    if (filters?.publicationStatus && item.publicationStatus !== filters.publicationStatus) return false;
    if (filters?.artworkId && item.artworkId !== filters.artworkId) return false;
    return true;
  });
}

export function getCatalogItem(catalogItemId: string) {
  const state = readCatalog();
  return state[catalogItemId] ?? null;
}

export function publishCatalogItem(input: { catalogItemId: string; reason?: string }) {
  const state = readCatalog();
  const current = state[input.catalogItemId];
  if (!current) return { kind: 'not_found' as const };
  if (current.publicationStatus === 'published') return { kind: 'already_published' as const, item: current };
  if (current.publicationStatus !== 'ready') return { kind: 'invalid_transition' as const, item: current };

  const updated: CatalogItemRecord = {
    ...current,
    publicationStatus: 'published',
    publishedAt: new Date().toISOString(),
    publicationReason: input.reason?.trim(),
    updatedAt: new Date().toISOString(),
  };
  state[input.catalogItemId] = updated;
  writeCatalog(state);
  return { kind: 'updated' as const, previous: current, item: updated };
}

export function markCatalogItemReady(input: { catalogItemId: string; reason?: string }) {
  const state = readCatalog();
  const current = state[input.catalogItemId];
  if (!current) return { kind: 'not_found' as const };
  if (current.publicationStatus === 'ready') return { kind: 'already_ready' as const, item: current };
  if (current.publicationStatus !== 'draft') return { kind: 'invalid_transition' as const, item: current };

  const updated: CatalogItemRecord = {
    ...current,
    publicationStatus: 'ready',
    publicationReason: input.reason?.trim(),
    updatedAt: new Date().toISOString(),
  };
  state[input.catalogItemId] = updated;
  writeCatalog(state);
  return { kind: 'updated' as const, previous: current, item: updated };
}

export function unpublishCatalogItem(input: { catalogItemId: string; reason: string }) {
  const state = readCatalog();
  const current = state[input.catalogItemId];
  if (!current) return { kind: 'not_found' as const };
  if (current.publicationStatus !== 'published') return { kind: 'invalid_transition' as const, item: current };
  if (!input.reason.trim()) return { kind: 'missing_reason' as const, item: current };

  const updated: CatalogItemRecord = {
    ...current,
    publicationStatus: 'archived',
    unpublishedAt: new Date().toISOString(),
    publicationReason: input.reason.trim(),
    updatedAt: new Date().toISOString(),
  };
  state[input.catalogItemId] = updated;
  writeCatalog(state);
  return { kind: 'updated' as const, previous: current, item: updated };
}

export function reopenCatalogItem(input: { catalogItemId: string; reason: string }) {
  const state = readCatalog();
  const current = state[input.catalogItemId];
  if (!current) return { kind: 'not_found' as const };
  if (current.publicationStatus !== 'archived') return { kind: 'invalid_transition' as const, item: current };
  if (!input.reason.trim()) return { kind: 'missing_reason' as const, item: current };

  const updated: CatalogItemRecord = {
    ...current,
    publicationStatus: 'draft',
    publicationReason: input.reason.trim(),
    updatedAt: new Date().toISOString(),
  };
  state[input.catalogItemId] = updated;
  writeCatalog(state);
  return { kind: 'updated' as const, previous: current, item: updated };
}
