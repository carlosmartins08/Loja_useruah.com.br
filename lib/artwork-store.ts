import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';
import { getMysqlPool, shouldUseMysql, type MysqlResult, type MysqlRow } from '@/lib/mysql-runtime';

export type ArtworkStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';

export interface ArtworkRecord {
  artworkId: string;
  authorId: string;
  status: ArtworkStatus;
  sourceAsset: string;
  metadata: {
    theme: string;
    category: string;
    tags: string[];
    applicability?: {
      allowedProductBaseIds?: string[];
      allowedCategories?: string[];
      allowedFits?: Array<'slim' | 'regular' | 'oversized'>;
      allowedPrintTypes?: string[];
      blockedProductBaseIds?: string[];
    };
  };
  submittedAt: string;
  reviewedAt?: string;
  reviewReason?: string;
  createdAt: string;
  updatedAt: string;
}

type ArtworkState = Record<string, ArtworkRecord>;

function readArtworks(): ArtworkState {
  return readStoreFile<ArtworkState>('artworks', {});
}

function writeArtworks(value: ArtworkState) {
  writeStoreFile('artworks', value);
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

function rowToArtwork(row: MysqlRow): ArtworkRecord {
  return {
    artworkId: String(row.artwork_id),
    authorId: String(row.author_id),
    status: row.status as ArtworkStatus,
    sourceAsset: String(row.source_asset),
    metadata: parseMysqlJson(row.metadata_json, { theme: '', category: '', tags: [] }),
    submittedAt: mysqlDatetimeToIso(row.submitted_at) ?? new Date().toISOString(),
    reviewedAt: mysqlDatetimeToIso(row.reviewed_at),
    reviewReason: row.review_reason ? String(row.review_reason) : undefined,
    createdAt: mysqlDatetimeToIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: mysqlDatetimeToIso(row.updated_at) ?? new Date().toISOString(),
  };
}

export async function createArtwork(input: {
  authorId: string;
  sourceAsset: string;
  metadata: ArtworkRecord['metadata'];
}) {
  const now = new Date().toISOString();
  const artworkId = `ART-${randomUUID()}`;
  const artwork: ArtworkRecord = {
    artworkId,
    authorId: input.authorId,
    status: 'submitted',
    sourceAsset: input.sourceAsset,
    metadata: input.metadata,
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(
      `INSERT INTO artworks (
        artwork_id, author_id, status, source_asset, metadata_json, submitted_at, reviewed_at, review_reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        artwork.artworkId,
        artwork.authorId,
        artwork.status,
        artwork.sourceAsset,
        JSON.stringify(artwork.metadata),
        toMysqlDatetime(artwork.submittedAt),
        null,
        null,
        toMysqlDatetime(artwork.createdAt),
        toMysqlDatetime(artwork.updatedAt),
      ]
    );
    return artwork;
  }

  const state = readArtworks();
  state[artworkId] = artwork;
  writeArtworks(state);
  return artwork;
}

export async function upsertApprovedArtwork(input: {
  artworkId: string;
  authorId: string;
  sourceAsset: string;
  metadata: ArtworkRecord['metadata'];
}) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM artworks WHERE artwork_id = ?`, [input.artworkId]);
    if (rows[0]) return { artwork: rowToArtwork(rows[0]), created: false as const };

    const now = new Date().toISOString();
    const artwork: ArtworkRecord = {
      artworkId: input.artworkId,
      authorId: input.authorId,
      status: 'approved',
      sourceAsset: input.sourceAsset,
      metadata: input.metadata,
      submittedAt: now,
      reviewedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    await mysql.execute<MysqlResult>(
      `INSERT INTO artworks (
        artwork_id, author_id, status, source_asset, metadata_json, submitted_at, reviewed_at, review_reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        artwork.artworkId,
        artwork.authorId,
        artwork.status,
        artwork.sourceAsset,
        JSON.stringify(artwork.metadata),
        toMysqlDatetime(artwork.submittedAt),
        toMysqlDatetime(artwork.reviewedAt ?? now),
        null,
        toMysqlDatetime(artwork.createdAt),
        toMysqlDatetime(artwork.updatedAt),
      ]
    );
    return { artwork, created: true as const };
  }

  const state = readArtworks();
  const existing = state[input.artworkId];
  if (existing) return { artwork: existing, created: false as const };

  const now = new Date().toISOString();
  const artwork: ArtworkRecord = {
    artworkId: input.artworkId,
    authorId: input.authorId,
    status: 'approved',
    sourceAsset: input.sourceAsset,
    metadata: input.metadata,
    submittedAt: now,
    reviewedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  state[input.artworkId] = artwork;
  writeArtworks(state);
  return { artwork, created: true as const };
}

export async function listArtworks(filters?: {
  status?: ArtworkStatus;
  authorId?: string;
  submittedFrom?: string;
  submittedTo?: string;
}) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const conditions: string[] = [];
    const params: string[] = [];
    if (filters?.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }
    if (filters?.authorId) {
      conditions.push('author_id = ?');
      params.push(filters.authorId);
    }
    if (filters?.submittedFrom) {
      conditions.push('submitted_at >= ?');
      params.push(toMysqlDatetime(filters.submittedFrom));
    }
    if (filters?.submittedTo) {
      conditions.push('submitted_at <= ?');
      params.push(toMysqlDatetime(filters.submittedTo));
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM artworks ${whereClause} ORDER BY submitted_at DESC`, params);
    return rows.map(rowToArtwork);
  }

  const all = Object.values(readArtworks());
  return all.filter((artwork) => {
    if (filters?.status && artwork.status !== filters.status) return false;
    if (filters?.authorId && artwork.authorId !== filters.authorId) return false;
    if (filters?.submittedFrom && artwork.submittedAt < filters.submittedFrom) return false;
    if (filters?.submittedTo && artwork.submittedAt > filters.submittedTo) return false;
    return true;
  });
}

export async function getArtwork(artworkId: string) {
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    const [rows] = await mysql.execute<MysqlRow[]>(`SELECT * FROM artworks WHERE artwork_id = ?`, [artworkId]);
    return rows[0] ? rowToArtwork(rows[0]) : null;
  }

  return readArtworks()[artworkId] ?? null;
}

export async function updateArtworkReview(input: {
  artworkId: string;
  action: 'approve' | 'reject';
  reason?: string;
}) {
  const current = await getArtwork(input.artworkId);
  if (!current) return { kind: 'not_found' as const };
  if (current.status !== 'under_review') return { kind: 'invalid_transition' as const, current };
  if (input.action === 'reject' && (!input.reason || input.reason.trim().length === 0)) {
    return { kind: 'missing_reason' as const, current };
  }

  const nextStatus: ArtworkStatus = input.action === 'approve' ? 'approved' : 'rejected';
  const now = new Date().toISOString();
  const reviewReason = input.action === 'reject' ? input.reason?.trim() : current.reviewReason;
  const updated: ArtworkRecord = {
    ...current,
    status: nextStatus,
    reviewedAt: now,
    reviewReason,
    updatedAt: now,
  };

  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(
      `UPDATE artworks SET status = ?, reviewed_at = ?, review_reason = ?, updated_at = ? WHERE artwork_id = ?`,
      [updated.status, toMysqlDatetime(now), updated.reviewReason ?? null, toMysqlDatetime(now), updated.artworkId]
    );
  } else {
    const state = readArtworks();
    state[input.artworkId] = updated;
    writeArtworks(state);
  }

  return { kind: 'updated' as const, previous: current, artwork: updated };
}

export async function startArtworkReview(input: { artworkId: string }) {
  const current = await getArtwork(input.artworkId);
  if (!current) return { kind: 'not_found' as const };
  if (current.status !== 'submitted') return { kind: 'invalid_transition' as const, current };

  const now = new Date().toISOString();
  const updated: ArtworkRecord = { ...current, status: 'under_review', updatedAt: now };
  const mysql = await getMysqlPool();
  if (mysql && shouldUseMysql()) {
    await mysql.execute<MysqlResult>(`UPDATE artworks SET status = ?, updated_at = ? WHERE artwork_id = ?`, [
      updated.status,
      toMysqlDatetime(now),
      updated.artworkId,
    ]);
  } else {
    const state = readArtworks();
    state[input.artworkId] = updated;
    writeArtworks(state);
  }

  return { kind: 'updated' as const, previous: current, artwork: updated };
}
