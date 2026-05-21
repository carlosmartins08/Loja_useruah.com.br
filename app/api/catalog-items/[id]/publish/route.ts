import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canManageCatalog, getActorFromRequest } from '@/lib/access-control';
import { getArtwork } from '@/lib/artwork-store';
import { getCatalogItem, publishCatalogItem } from '@/lib/catalog-item-store';

interface PublishPayload {
  reason?: string;
}

function isValidPayload(payload: unknown): payload is PublishPayload {
  if (payload === null || payload === undefined) return true;
  if (typeof payload !== 'object') return false;
  const body = payload as Record<string, unknown>;
  return body.reason === undefined || typeof body.reason === 'string';
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (!canManageCatalog(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const { id } = await context.params;
  const current = getCatalogItem(id);
  if (!current) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const artwork = getArtwork(current.artworkId);
  if (!artwork) return NextResponse.json({ error: 'artwork_not_found' }, { status: 404 });
  if (artwork.status === 'rejected') {
    return NextResponse.json({ error: 'invalid_transition', detail: 'rejected_artwork_cannot_be_published' }, { status: 409 });
  }
  if (artwork.status !== 'approved') {
    return NextResponse.json({ error: 'invalid_transition', detail: 'artwork_must_be_approved' }, { status: 409 });
  }

  const result = publishCatalogItem({ catalogItemId: id, reason: payload.reason });
  if (result.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (result.kind === 'invalid_transition') return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });
  if (result.kind === 'already_published') return NextResponse.json({ ok: true, item: result.item, reused: true });

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'catalog_item_published',
    entity_type: 'CatalogItem',
    entity_id: result.item.catalogItemId,
    previous_status: result.previous.publicationStatus,
    new_status: result.item.publicationStatus,
    reason: result.item.publicationReason ?? 'manual_publish',
  });

  return NextResponse.json({ ok: true, item: result.item });
}
