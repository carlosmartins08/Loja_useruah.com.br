import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canManageCatalog, getActorFromRequest } from '@/lib/access-control';
import { markCatalogItemReady } from '@/lib/catalog-item-store';

interface ReadyPayload {
  reason?: string;
}

function isValidPayload(payload: unknown): payload is ReadyPayload {
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
  const result = markCatalogItemReady({ catalogItemId: id, reason: payload.reason });
  if (result.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (result.kind === 'invalid_transition') return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });
  if (result.kind === 'already_ready') return NextResponse.json({ ok: true, item: result.item, reused: true });

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'catalog_item_ready',
    entity_type: 'CatalogItem',
    entity_id: result.item.catalogItemId,
    previous_status: result.previous.publicationStatus,
    new_status: result.item.publicationStatus,
    reason: result.item.publicationReason ?? 'catalog_ready',
  });

  return NextResponse.json({ ok: true, item: result.item });
}
