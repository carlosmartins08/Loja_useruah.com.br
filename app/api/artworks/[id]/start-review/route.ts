import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canReviewArtwork, getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { startArtworkReview } from '@/lib/artwork-store';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!canReviewArtwork(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  let result;
  try {
    result = await startArtworkReview({ artworkId: id });
  } catch {
    return NextResponse.json({ error: 'artwork_persistence_unavailable' }, { status: 503 });
  }

  if (result.kind === 'not_found') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (result.kind !== 'updated') {
    return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });
  }

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'artwork_review_started',
    entity_type: 'Artwork',
    entity_id: result.artwork.artworkId,
    previous_status: result.previous.status,
    new_status: result.artwork.status,
    reason: 'curation_review_started',
  });

  return NextResponse.json({ ok: true, artwork: result.artwork });
}
