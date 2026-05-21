import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { createArtwork, listArtworks, type ArtworkStatus } from '@/lib/artwork-store';
import { canCreateArtwork, canReviewArtwork, getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { isTermsGateEnabledFor, validateTermsAcceptance } from '@/lib/terms-enforcement';

interface CreateArtworkPayload {
  sourceAsset: string;
  metadata: {
    theme: string;
    category: string;
    tags: string[];
  };
}

function isValidCreatePayload(payload: unknown): payload is CreateArtworkPayload {
  if (!payload || typeof payload !== 'object') return false;
  const body = payload as Record<string, unknown>;
  const metadata = body.metadata as Record<string, unknown> | undefined;
  return (
    typeof body.sourceAsset === 'string' &&
    body.sourceAsset.trim().length > 0 &&
    metadata !== undefined &&
    typeof metadata.theme === 'string' &&
    metadata.theme.trim().length > 0 &&
    typeof metadata.category === 'string' &&
    metadata.category.trim().length > 0 &&
    Array.isArray(metadata.tags) &&
    metadata.tags.every((tag) => typeof tag === 'string' && tag.trim().length > 0)
  );
}

function parseStatus(input: string | null): ArtworkStatus | undefined {
  if (!input) return undefined;
  if (input === 'submitted' || input === 'under_review' || input === 'approved' || input === 'rejected') return input;
  return undefined;
}

export async function GET(request: Request) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const requestedAuthor = searchParams.get('authorId');
  const status = parseStatus(searchParams.get('status'));
  const submittedFrom = searchParams.get('submittedFrom') ?? undefined;
  const submittedTo = searchParams.get('submittedTo') ?? undefined;

  const canReadFullQueue = canReviewArtwork(actor);
  if (isRbacActive() && !canReadFullQueue && requestedAuthor && actor && requestedAuthor !== actor.actorId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const authorId = canReadFullQueue ? requestedAuthor ?? undefined : actor?.actorId;
  const artworks = listArtworks({ status, authorId, submittedFrom, submittedTo });
  return NextResponse.json({ ok: true, artworks });
}

export async function POST(request: Request) {
  const actor = getActorFromRequest(request);
  if (!canCreateArtwork(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (actor?.actorId && isTermsGateEnabledFor('artist')) {
    const accepted = await validateTermsAcceptance({ userId: actor.actorId, termType: 'artist_base' });
    if (!accepted) {
      return NextResponse.json({ error: 'forbidden', detail: 'terms_not_accepted' }, { status: 403 });
    }
  }

  const payload = await request.json().catch(() => null);
  if (!isValidCreatePayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const artwork = createArtwork({
    authorId: actor?.actorId ?? 'anonymous-author',
    sourceAsset: payload.sourceAsset,
    metadata: payload.metadata,
  });

  appendAuditLog({
    actor_id: actor?.actorId ?? 'anonymous-author',
    actor_role: actor?.actorRole ?? 'anonymous',
    action: 'artwork_submitted',
    entity_type: 'Artwork',
    entity_id: artwork.artworkId,
    previous_status: 'none',
    new_status: artwork.status,
    reason: 'catalog_submission',
  });

  return NextResponse.json({ ok: true, artwork }, { status: 201 });
}
