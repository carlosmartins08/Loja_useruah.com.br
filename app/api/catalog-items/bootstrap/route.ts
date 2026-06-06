import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canManageCatalog, getActorFromRequest } from '@/lib/access-control';
import { createCatalogItem, markCatalogItemReady, publishCatalogItem } from '@/lib/catalog-item-store';
import { upsertApprovedArtwork } from '@/lib/artwork-store';
import { approveImpactReview, createImpactReview, getPendingImpactReviewByEntity } from '@/lib/impact-review-store';
import { getBrandProductVisual } from '@/lib/brand-assets';

const SEED_ITEMS = [
  { id: '1', name: 'Camiseta Oração', price: 89.9, category: 'autoral', segment: 'customizada', image: getBrandProductVisual('1').image },
  { id: '2', name: 'Moletom Presença', price: 159.9, category: 'campanhas', segment: 'customizada', image: getBrandProductVisual('2').image },
  { id: '3', name: 'Ecobag Reino', price: 45, category: 'acessorios', segment: 'customizada', image: getBrandProductVisual('3').image },
  { id: '4', name: 'Uniforme Base G1', price: 55, category: 'fardamento', segment: 'base', image: getBrandProductVisual('4').image },
  { id: '5', name: 'Camiseta Base Cotton', price: 42.9, category: 'fardamento', segment: 'base', image: getBrandProductVisual('5').image },
  { id: '6', name: 'Ecobag Presença', price: 12, category: 'acessorios', segment: 'customizada', image: getBrandProductVisual('6').image },
] as const;

export async function POST(request: Request) {
  const actor = getActorFromRequest(request);
  if (!canManageCatalog(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const results: Array<{ catalogItemId: string; created: boolean; published: boolean }> = [];

  for (const seed of SEED_ITEMS) {
    const artworkId = `ART-SEED-${seed.id}`;
    upsertApprovedArtwork({
      artworkId,
      authorId: 'seed-author',
      sourceAsset: seed.image,
      metadata: {
        theme: 'seed',
        category: seed.category,
        tags: [seed.segment, 'seed'],
      },
    });

    const { item, created } = await createCatalogItem({
      catalogItemId: seed.id,
      artworkId,
      productBaseId: `BASE-${seed.id}`,
      name: seed.name,
      price: seed.price,
      image: seed.image,
      colorImages: {
        'Off White': seed.image,
      },
      fit: 'regular',
      fabric: '100% algodão fio 30.1 penteado premium',
      printTypeDescription: 'Serigrafia premium e DTG com tinta à base d\'agua para alta durabilidade.',
      washGuide: 'Lavar do avesso, água fria, não usar alvejante, secar à sombra.',
      installmentCount: 3,
      detailImages: [{ label: 'Detalhe', src: seed.image }],
      modelMockups: [{ label: 'Mockup', src: seed.image }],
      variants: [
        {
          variantId: `VAR-${seed.id}-OFFWHITE`,
          label: 'Off White',
          price: seed.price,
          image: seed.image,
          inStock: true,
        },
      ],
      category: seed.category === 'autoral' ? 'Autoral' : seed.category === 'campanhas' ? 'Campanhas' : seed.category === 'fardamento' ? 'Fardamento' : 'Acessórios',
      segment: seed.segment === 'base' ? 'Base' : 'Customizada',
      tags: ['Seed', seed.segment === 'base' ? 'Volume' : 'Autoral'],
      pricingPolicy: {
        minPrice: Number((seed.price * 0.9).toFixed(2)),
        suggestedPrice: Number(seed.price.toFixed(2)),
        promoPriceFloor: Number((seed.price * 0.95).toFixed(2)),
      },
    });
    const pendingReview = getPendingImpactReviewByEntity('CatalogItem', item.catalogItemId);
    if (pendingReview) {
      approveImpactReview({
        reviewId: pendingReview.reviewId,
        approvedBy: actor?.actorId ?? 'bootstrap-system',
        reason: 'bootstrap_auto_approve_for_seed',
      });
    }
    const freshReview = createImpactReview({
      domain: 'supplier_catalog',
      entityType: 'CatalogItem',
      entityId: item.catalogItemId,
      sensitiveFields: ['priceTable'],
      requestedBy: actor?.actorId ?? 'bootstrap-system',
      priority: 'normal',
      slaHours: 2,
    });
    approveImpactReview({
      reviewId: freshReview.review.reviewId,
      approvedBy: actor?.actorId ?? 'bootstrap-system',
      reason: 'bootstrap_latest_approved_review',
    });

    await markCatalogItemReady({ catalogItemId: item.catalogItemId, reason: 'bootstrap_seed_ready' });
    const published = await publishCatalogItem({ catalogItemId: item.catalogItemId, reason: 'bootstrap_seed' });
    results.push({ catalogItemId: item.catalogItemId, created, published: published.kind === 'updated' || published.kind === 'already_published' });
  }

  appendAuditLog({
    actor_id: actor?.actorId ?? 'unknown',
    actor_role: actor?.actorRole ?? 'unknown',
    action: 'catalog_bootstrap_seeded',
    entity_type: 'CatalogItem',
    entity_id: 'seed-batch',
    previous_status: 'none',
    new_status: 'published',
    reason: 'bootstrap_seed',
  });

  return NextResponse.json({ ok: true, results });
}
