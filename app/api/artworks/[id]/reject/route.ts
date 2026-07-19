import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canReviewArtwork, getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { updateArtworkReview } from '@/lib/artwork-store';

interface RejectPayload {
  reason: string;
}

function isValidRejectPayload(payload: unknown): payload is RejectPayload {
  if (!payload || typeof payload !== 'object') return false;
  const body = payload as Record<string, unknown>;
  return typeof body.reason === 'string' && body.reason.trim().length > 0;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!canReviewArtwork(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!isValidRejectPayload(payload)) {
    return NextResponse.json({ error: 'validation_error', detail: 'reason_required' }, { status: 422 });
  }

  const { id } = await context.params;
  let result;
  try {
    result = await updateArtworkReview({ artworkId: id, action: 'reject', reason: payload.reason });
  } catch {
    return NextResponse.json({ error: 'artwork_persistence_unavailable' }, { status: 503 });
  }

  if (result.kind === 'not_found') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (result.kind === 'missing_reason') {
    return NextResponse.json({ error: 'validation_error', detail: 'reason_required' }, { status: 422 });
  }
  if (result.kind !== 'updated') {
    return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });
  }

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'artwork_rejected',
    entity_type: 'Artwork',
    entity_id: result.artwork.artworkId,
    previous_status: result.previous.status,
    new_status: result.artwork.status,
    reason: result.artwork.reviewReason ?? 'curation_rejected',
  });

  return NextResponse.json({ ok: true, artwork: result.artwork });
}
