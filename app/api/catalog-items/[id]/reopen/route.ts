import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canManageCatalog, getActorFromRequest } from '@/lib/access-control';
import { reopenCatalogItem } from '@/lib/catalog-item-store';

interface ReopenPayload {
  reason: string;
}

function isValidPayload(payload: unknown): payload is ReopenPayload {
  if (!payload || typeof payload !== 'object') return false;
  const body = payload as Record<string, unknown>;
  return typeof body.reason === 'string' && body.reason.trim().length > 0;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (!canManageCatalog(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error', detail: 'reason_required' }, { status: 422 });
  }

  const { id } = await context.params;
  const result = reopenCatalogItem({ catalogItemId: id, reason: payload.reason });
  if (result.kind === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (result.kind === 'missing_reason') return NextResponse.json({ error: 'validation_error', detail: 'reason_required' }, { status: 422 });
  if (result.kind !== 'updated') return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'catalog_item_reopened',
    entity_type: 'CatalogItem',
    entity_id: result.item.catalogItemId,
    previous_status: result.previous.publicationStatus,
    new_status: result.item.publicationStatus,
    reason: result.item.publicationReason ?? 'manual_reopen',
  });

  return NextResponse.json({ ok: true, item: result.item });
}
