import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getActorFromRequest, isRbacActive } from '@/lib/access-control';
import { canManageCampaignProducts, canReadCampaign, isCampaignProductMutableStatus } from '@/lib/campaign-access';
import { getCampaign } from '@/lib/campaign-store';
import { getCatalogItem } from '@/lib/catalog-item-store';
import { linkCampaignProduct, listCampaignProducts, unlinkCampaignProduct } from '@/lib/campaign-product-store';

interface CampaignProductPayload {
  catalogItemId: string;
}

function isValidPayload(payload: unknown): payload is CampaignProductPayload {
  if (!payload || typeof payload !== 'object') return false;
  const row = payload as Record<string, unknown>;
  return typeof row.catalogItemId === 'string' && row.catalogItemId.trim().length > 0;
}

async function toLinkResponse(campaignId: string) {
  const links = await Promise.all(
    listCampaignProducts(campaignId).map(async (link) => {
      const item = await getCatalogItem(link.catalogItemId);
      return {
        ...link,
        item: item
          ? {
              catalogItemId: item.catalogItemId,
              name: item.name,
              price: item.price,
              image: item.image,
              category: item.category,
              segment: item.segment,
              publicationStatus: item.publicationStatus,
            }
          : null,
      };
    })
  );

  return links;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const campaign = getCampaign(id);
  if (!campaign) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (isRbacActive() && !canReadCampaign(campaign, actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const links = await toLinkResponse(id);
  return NextResponse.json({ ok: true, campaign, links });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const campaign = getCampaign(id);
  if (!campaign) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (isRbacActive() && !canManageCampaignProducts(campaign, actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (!isCampaignProductMutableStatus(campaign.status)) {
    return NextResponse.json({ error: 'invalid_transition', detail: 'campaign_products_locked' }, { status: 409 });
  }

  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const item = await getCatalogItem(payload.catalogItemId.trim());
  if (!item) return NextResponse.json({ error: 'catalog_item_not_found' }, { status: 404 });
  if (item.publicationStatus !== 'published') {
    return NextResponse.json({ error: 'invalid_transition', detail: 'catalog_item_must_be_published' }, { status: 409 });
  }

  const result = linkCampaignProduct({
    campaignId: id,
    catalogItemId: item.catalogItemId,
    linkedBy: actor?.actorId ?? 'unknown',
  });

  if (!result.reused) {
    appendAuditLog({
      actor_id: actor?.actorId ?? 'unknown',
      actor_role: actor?.actorRole ?? 'unknown',
      action: 'campaign.product_linked',
      entity_type: 'Campaign',
      entity_id: campaign.campaignId,
      previous_status: campaign.status,
      new_status: campaign.status,
      reason: `catalogItem:${item.catalogItemId}`,
    });
  }

  return NextResponse.json(
    {
      ok: true,
      reused: result.reused,
      link: {
        ...result.link,
        item: {
          catalogItemId: item.catalogItemId,
          name: item.name,
          price: item.price,
          image: item.image,
          category: item.category,
          segment: item.segment,
          publicationStatus: item.publicationStatus,
        },
      },
    },
    { status: result.reused ? 200 : 201 }
  );
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = getActorFromRequest(request);
  if (isRbacActive() && !actor) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const campaign = getCampaign(id);
  if (!campaign) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (isRbacActive() && !canManageCampaignProducts(campaign, actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (!isCampaignProductMutableStatus(campaign.status)) {
    return NextResponse.json({ error: 'invalid_transition', detail: 'campaign_products_locked' }, { status: 409 });
  }

  const payload = await request.json().catch(() => null);
  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'validation_error' }, { status: 422 });
  }

  const result = unlinkCampaignProduct({ campaignId: id, catalogItemId: payload.catalogItemId.trim() });
  if (!result.removed || !result.link) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'campaign.product_unlinked',
    entity_type: 'Campaign',
    entity_id: campaign.campaignId,
    previous_status: campaign.status,
    new_status: campaign.status,
    reason: `catalogItem:${result.link.catalogItemId}`,
  });

  return NextResponse.json({ ok: true, link: result.link });
}
