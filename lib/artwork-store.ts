import { randomUUID } from 'crypto';
import { readStoreFile, writeStoreFile } from '@/lib/dev-store';

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

export function createArtwork(input: {
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

  const state = readArtworks();
  state[artworkId] = artwork;
  writeArtworks(state);
  return artwork;
}

export function upsertApprovedArtwork(input: {
  artworkId: string;
  authorId: string;
  sourceAsset: string;
  metadata: ArtworkRecord['metadata'];
}) {
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

export function listArtworks(filters?: {
  status?: ArtworkStatus;
  authorId?: string;
  submittedFrom?: string;
  submittedTo?: string;
}) {
  const all = Object.values(readArtworks());
  return all.filter((artwork) => {
    if (filters?.status && artwork.status !== filters.status) return false;
    if (filters?.authorId && artwork.authorId !== filters.authorId) return false;
    if (filters?.submittedFrom && artwork.submittedAt < filters.submittedFrom) return false;
    if (filters?.submittedTo && artwork.submittedAt > filters.submittedTo) return false;
    return true;
  });
}

export function getArtwork(artworkId: string) {
  const state = readArtworks();
  return state[artworkId] ?? null;
}

export function updateArtworkReview(input: {
  artworkId: string;
  action: 'approve' | 'reject';
  reason?: string;
}) {
  const state = readArtworks();
  const current = state[input.artworkId];
  if (!current) return { kind: 'not_found' as const };

  if (current.status === 'approved' || current.status === 'rejected') {
    return { kind: 'invalid_transition' as const, current };
  }

  if (input.action === 'reject' && (!input.reason || input.reason.trim().length === 0)) {
    return { kind: 'missing_reason' as const, current };
  }

  const nextStatus: ArtworkStatus = input.action === 'approve' ? 'approved' : 'rejected';
  const now = new Date().toISOString();
  const updated: ArtworkRecord = {
    ...current,
    status: nextStatus,
    reviewedAt: now,
    reviewReason: input.action === 'reject' ? input.reason?.trim() : current.reviewReason,
    updatedAt: now,
  };

  state[input.artworkId] = updated;
  writeArtworks(state);
  return { kind: 'updated' as const, previous: current, artwork: updated };
}
