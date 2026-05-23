import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canManageCatalog, getActorFromRequest } from '@/lib/access-control';
import { createCatalogItem, listCatalogItems, type CatalogItemStatus } from '@/lib/catalog-item-store';
import { getArtwork } from '@/lib/artwork-store';
import { isTermsGateEnabledFor, validateTermsAcceptance } from '@/lib/terms-enforcement';

interface CreateCatalogItemPayload {
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
  variants: Array<{ variantId: string; label: string; price: number; image: string; inStock: boolean }>;
  category?: 'Autoral' | 'Campanhas' | 'Fardamento' | 'Acessórios';
  segment?: 'Base' | 'Customizada';
  tags?: string[];
}

function parseStatus(input: string | null): CatalogItemStatus | undefined {
  if (!input) return undefined;
  if (input === 'draft' || input === 'ready' || input === 'published' || input === 'archived') return input;
  return undefined;
}

function isValidPayload(payload: unknown): payload is CreateCatalogItemPayload {
  if (!payload || typeof payload !== 'object') return false;
  const body = payload as Record<string, unknown>;
  if (
    typeof body.artworkId !== 'string' ||
    typeof body.productBaseId !== 'string' ||
    typeof body.name !== 'string' ||
    typeof body.price !== 'number' ||
    typeof body.image !== 'string' ||
    typeof body.fabric !== 'string' ||
    typeof body.printTypeDescription !== 'string' ||
    typeof body.washGuide !== 'string' ||
    typeof body.installmentCount !== 'number'
  ) {
    return false;
  }
  if (body.fit !== 'slim' && body.fit !== 'regular' && body.fit !== 'oversized') return false;

  const colorImages = body.colorImages as Record<string, unknown> | undefined;
  if (!colorImages || typeof colorImages !== 'object' || Object.keys(colorImages).length === 0) return false;
  if (!Object.values(colorImages).every((value) => typeof value === 'string' && value.length > 0)) return false;

  const detailImages = body.detailImages as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(detailImages)) return false;
  if (!detailImages.every((row) => typeof row.label === 'string' && typeof row.src === 'string')) return false;

  const modelMockups = body.modelMockups as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(modelMockups)) return false;
  if (!modelMockups.every((row) => typeof row.label === 'string' && typeof row.src === 'string')) return false;

  const variants = body.variants as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(variants) || variants.length === 0) return false;
  const variantsOk = variants.every(
    (row) =>
      typeof row.variantId === 'string' &&
      typeof row.label === 'string' &&
      typeof row.price === 'number' &&
      typeof row.image === 'string' &&
      typeof row.inStock === 'boolean'
  );
  if (!variantsOk) return false;

  if (body.category !== undefined && body.category !== 'Autoral' && body.category !== 'Campanhas' && body.category !== 'Fardamento' && body.category !== 'Acessórios') {
    return false;
  }
  if (body.segment !== undefined && body.segment !== 'Base' && body.segment !== 'Customizada') {
    return false;
  }
  if (body.tags !== undefined && (!Array.isArray(body.tags) || !body.tags.every((tag) => typeof tag === 'string'))) {
    return false;
  }
  return true;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publicationStatus = parseStatus(searchParams.get('publicationStatus'));
  const artworkId = searchParams.get('artworkId') ?? undefined;
  const items = await listCatalogItems({ publicationStatus, artworkId });
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  const actor = getActorFromRequest(request);
  if (!canManageCatalog(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (actor?.actorId && isTermsGateEnabledFor('industry')) {
    const accepted = await validateTermsAcceptance({ userId: actor.actorId, termType: 'industry_base' });
    if (!accepted) {
      return NextResponse.json({ error: 'forbidden', detail: 'terms_not_accepted' }, { status: 403 });
    }
  }

  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const artwork = getArtwork(payload.artworkId);
  if (!artwork) return NextResponse.json({ error: 'artwork_not_found' }, { status: 404 });
  if (artwork.status !== 'approved') {
    return NextResponse.json({ error: 'invalid_transition', detail: 'artwork_must_be_approved' }, { status: 409 });
  }

  const { item, created } = await createCatalogItem(payload);
  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'catalog_item_created',
    entity_type: 'CatalogItem',
    entity_id: item.catalogItemId,
    previous_status: created ? 'none' : item.publicationStatus,
    new_status: item.publicationStatus,
    reason: `artwork:${item.artworkId}`,
  });

  return NextResponse.json({ ok: true, item, created }, { status: created ? 201 : 200 });
}
