import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export type CatalogItemStatus = 'draft' | 'pending_review' | 'ready' | 'published' | 'archived';

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

function toMysqlDatetime(iso: string) {
  return iso.replace('T', ' ').replace('Z', '');
}

function mysqlDatetimeToIso(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const withT = value.includes('T') ? value : value.replace(' ', 'T');
  return withT.endsWith('Z') ? withT : `${withT}Z`;
}

function rowToCatalogItem(row: MysqlRow): CatalogItemRecord {
  return {
    catalogItemId: String(row.catalog_item_id),
    artworkId: String(row.artwork_id),
    productBaseId: String(row.product_base_id),
    name: String(row.name),
    price: Number(row.price),
    image: String(row.image),
    colorImages: typeof row.color_images_json === 'string' ? JSON.parse(row.color_images_json) : {},
    fit: row.fit as CatalogItemRecord['fit'],
    fabric: String(row.fabric),
    printTypeDescription: String(row.print_type_description),
    washGuide: String(row.wash_guide),
    installmentCount: Number(row.installment_count),
    detailImages: typeof row.detail_images_json === 'string' ? JSON.parse(row.detail_images_json) : [],
    modelMockups: typeof row.model_mockups_json === 'string' ? JSON.parse(row.model_mockups_json) : [],
    variants: typeof row.variants_json === 'string' ? JSON.parse(row.variants_json) : [],
    category: row.category ? (String(row.category) as CatalogItemRecord['category']) : undefined,
    segment: row.segment ? (String(row.segment) as CatalogItemRecord['segment']) : undefined,
    tags: typeof row.tags_json === 'string' ? JSON.parse(row.tags_json) : undefined,
    publicationStatus: row.publication_status as CatalogItemStatus,
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: mysqlDatetimeToIso(row.updated_at) ?? new Date().toISOString(),
    publishedAt: mysqlDatetimeToIso(row.published_at),
    unpublishedAt: mysqlDatetimeToIso(row.unpublished_at),
    publicationReason: row.publication_reason ? String(row.publication_reason) : undefined,
  };
}

export async function createCatalogItem(
  input: Omit<CatalogItemRecord, 'catalogItemId' | 'publicationStatus' | 'createdAt' | 'updatedAt'> & {
    catalogItemId?: string;
    initialStatus?: CatalogItemStatus;
  }
) {
  const now = new Date().toISOString();
  const catalogItemId = input.catalogItemId?.trim() || `CAT-${randomUUID()}`;
  const initialStatus = input.initialStatus ?? 'draft';

  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [existingRows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM catalog_items WHERE catalog_item_id = ?`, [catalogItemId]);
    if (existingRows[0]) {
      return { item: rowToCatalogItem(existingRows[0]), created: false as const };
    }

    await mysql.execute<MysqlResult>(
      `INSERT INTO catalog_items (
        catalog_item_id, artwork_id, product_base_id, name, price, image, color_images_json, fit,
        fabric, print_type_description, wash_guide, installment_count, detail_images_json, model_mockups_json,
        variants_json, category, segment, tags_json, publication_status, created_at, updated_at,
        published_at, unpublished_at, publication_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        catalogItemId,
        input.artworkId,
        input.productBaseId,
        input.name,
        input.price,
        input.image,
        JSON.stringify(input.colorImages),
        input.fit,
        input.fabric,
        input.printTypeDescription,
        input.washGuide,
        input.installmentCount,
        JSON.stringify(input.detailImages),
        JSON.stringify(input.modelMockups),
        JSON.stringify(input.variants),
        input.category ?? null,
        input.segment ?? null,
        input.tags ? JSON.stringify(input.tags) : null,
        initialStatus,
        toMysqlDatetime(now),
        toMysqlDatetime(now),
        null,
        null,
        null,
      ]
    );

    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM catalog_items WHERE catalog_item_id = ?`, [catalogItemId]);
    return { item: rowToCatalogItem(rows[0]), created: true as const };
  }

  const state = readCatalog();
  if (state[catalogItemId]) {
    return { item: state[catalogItemId], created: false as const };
  }

  const record: CatalogItemRecord = {
    ...input,
    catalogItemId,
    publicationStatus: initialStatus,
    createdAt: now,
    updatedAt: now,
  };

  state[catalogItemId] = record;
  writeCatalog(state);
  return { item: record, created: true as const };
}

export async function listCatalogItems(filters?: { publicationStatus?: CatalogItemStatus; artworkId?: string }) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const conditions: string[] = [];
    const params: string[] = [];
    if (filters?.publicationStatus) {
      conditions.push('publication_status = ?');
      params.push(filters.publicationStatus);
    }
    if (filters?.artworkId) {
      conditions.push('artwork_id = ?');
      params.push(filters.artworkId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM catalog_items ${whereClause} ORDER BY created_at DESC`, params);
    return rows.map(rowToCatalogItem);
  }

  return Object.values(readCatalog()).filter((item) => {
    if (filters?.publicationStatus && item.publicationStatus !== filters.publicationStatus) return false;
    if (filters?.artworkId && item.artworkId !== filters.artworkId) return false;
    return true;
  });
}

export async function getCatalogItem(catalogItemId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM catalog_items WHERE catalog_item_id = ?`, [catalogItemId]);
    return rows[0] ? rowToCatalogItem(rows[0]) : null;
  }

  const state = readCatalog();
  return state[catalogItemId] ?? null;
}

export async function publishCatalogItem(input: { catalogItemId: string; reason?: string }) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM catalog_items WHERE catalog_item_id = ?`, [input.catalogItemId]);
    const current = rows[0];
    if (!current) return { kind: 'not_found' as const };
    const currentItem = rowToCatalogItem(current);
    if (currentItem.publicationStatus === 'published') return { kind: 'already_published' as const, item: currentItem };
    if (currentItem.publicationStatus !== 'ready') return { kind: 'invalid_transition' as const, item: currentItem };

    const now = new Date().toISOString();
    await mysql.execute<MysqlResult>(
      `UPDATE catalog_items SET publication_status = ?, published_at = ?, publication_reason = ?, updated_at = ? WHERE catalog_item_id = ?`,
      ['published', toMysqlDatetime(now), input.reason?.trim() ?? null, toMysqlDatetime(now), input.catalogItemId]
    );
    const [updatedRows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM catalog_items WHERE catalog_item_id = ?`, [input.catalogItemId]);
    const updated = rowToCatalogItem(updatedRows[0]);
    return { kind: 'updated' as const, previous: currentItem, item: updated };
  }

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

export async function markCatalogItemReady(input: { catalogItemId: string; reason?: string }) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM catalog_items WHERE catalog_item_id = ?`, [input.catalogItemId]);
    const current = rows[0];
    if (!current) return { kind: 'not_found' as const };
    const currentItem = rowToCatalogItem(current);
    if (currentItem.publicationStatus === 'ready') return { kind: 'already_ready' as const, item: currentItem };
    if (currentItem.publicationStatus !== 'draft' && currentItem.publicationStatus !== 'pending_review') {
      return { kind: 'invalid_transition' as const, item: currentItem };
    }

    const now = new Date().toISOString();
    await mysql.execute<MysqlResult>(
      `UPDATE catalog_items SET publication_status = ?, publication_reason = ?, updated_at = ? WHERE catalog_item_id = ?`,
      ['ready', input.reason?.trim() ?? null, toMysqlDatetime(now), input.catalogItemId]
    );
    const [updatedRows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM catalog_items WHERE catalog_item_id = ?`, [input.catalogItemId]);
    const updated = rowToCatalogItem(updatedRows[0]);
    return { kind: 'updated' as const, previous: currentItem, item: updated };
  }

  const state = readCatalog();
  const current = state[input.catalogItemId];
  if (!current) return { kind: 'not_found' as const };
  if (current.publicationStatus === 'ready') return { kind: 'already_ready' as const, item: current };
  if (current.publicationStatus !== 'draft' && current.publicationStatus !== 'pending_review') {
    return { kind: 'invalid_transition' as const, item: current };
  }

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

export async function unpublishCatalogItem(input: { catalogItemId: string; reason: string }) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM catalog_items WHERE catalog_item_id = ?`, [input.catalogItemId]);
    const current = rows[0];
    if (!current) return { kind: 'not_found' as const };
    const currentItem = rowToCatalogItem(current);
    if (currentItem.publicationStatus !== 'published') return { kind: 'invalid_transition' as const, item: currentItem };
    if (!input.reason.trim()) return { kind: 'missing_reason' as const, item: currentItem };

    const now = new Date().toISOString();
    await mysql.execute<MysqlResult>(
      `UPDATE catalog_items SET publication_status = ?, unpublished_at = ?, publication_reason = ?, updated_at = ? WHERE catalog_item_id = ?`,
      ['archived', toMysqlDatetime(now), input.reason.trim(), toMysqlDatetime(now), input.catalogItemId]
    );
    const [updatedRows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM catalog_items WHERE catalog_item_id = ?`, [input.catalogItemId]);
    const updated = rowToCatalogItem(updatedRows[0]);
    return { kind: 'updated' as const, previous: currentItem, item: updated };
  }

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

export async function reopenCatalogItem(input: { catalogItemId: string; reason: string }) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM catalog_items WHERE catalog_item_id = ?`, [input.catalogItemId]);
    const current = rows[0];
    if (!current) return { kind: 'not_found' as const };
    const currentItem = rowToCatalogItem(current);
    if (currentItem.publicationStatus !== 'archived') return { kind: 'invalid_transition' as const, item: currentItem };
    if (!input.reason.trim()) return { kind: 'missing_reason' as const, item: currentItem };

    const now = new Date().toISOString();
    await mysql.execute<MysqlResult>(
      `UPDATE catalog_items SET publication_status = ?, publication_reason = ?, updated_at = ? WHERE catalog_item_id = ?`,
      ['draft', input.reason.trim(), toMysqlDatetime(now), input.catalogItemId]
    );
    const [updatedRows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM catalog_items WHERE catalog_item_id = ?`, [input.catalogItemId]);
    const updated = rowToCatalogItem(updatedRows[0]);
    return { kind: 'updated' as const, previous: currentItem, item: updated };
  }

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
