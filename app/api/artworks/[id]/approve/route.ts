import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canReviewArtwork, getActorFromRequest } from '@/lib/access-control';
import { updateArtworkReview } from '@/lib/artwork-store';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (!canReviewArtwork(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const result = updateArtworkReview({ artworkId: id, action: 'approve' });

  if (result.kind === 'not_found') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (result.kind !== 'updated') {
    return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });
  }

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'artwork_approved',
    entity_type: 'Artwork',
    entity_id: result.artwork.artworkId,
    previous_status: result.previous.status,
    new_status: result.artwork.status,
    reason: 'curation_approved',
  });

  return NextResponse.json({ ok: true, artwork: result.artwork });
}
