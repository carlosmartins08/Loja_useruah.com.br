import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canManageCatalog, getActorFromRequest } from '@/lib/access-control';
import { createCatalogItem, markCatalogItemReady, publishCatalogItem } from '@/lib/catalog-item-store';
import { upsertApprovedArtwork } from '@/lib/artwork-store';
import { approveImpactReview, createImpactReview, getPendingImpactReviewByEntity } from '@/lib/impact-review-store';
import { BRAND_BOOTSTRAP_SEEDS } from '@/lib/brand-assets';

export async function POST(request: Request) {
  const actor = getActorFromRequest(request);
  if (!canManageCatalog(actor)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const results: Array<{ catalogItemId: string; created: boolean; published: boolean }> = [];

  for (const seed of BRAND_BOOTSTRAP_SEEDS) {
    const artworkId = `ART-SEED-${seed.id}`;
    await upsertApprovedArtwork({
      artworkId,
      authorId: 'seed-author',
      sourceAsset: seed.image,
      metadata: {
        theme: 'seed',
        category: seed.catalogCategory,
        tags: [...seed.tags, seed.segment, 'seed'],
      },
    });

    const { item, created } = await createCatalogItem({
      catalogItemId: seed.id,
      overwriteExisting: true,
      artworkId,
      productBaseId: seed.productBaseId,
      name: seed.name,
      price: seed.price,
      image: seed.image,
      colorImages: seed.colorImages,
      fit: seed.fit,
      fabric: seed.fabric,
      printTypeDescription: seed.printTypeDescription,
      washGuide: seed.washGuide,
      installmentCount: seed.installmentCount,
      detailImages: seed.detailImages,
      modelMockups: seed.modelMockups,
      variants: Object.entries(seed.colorImages).map(([label, image]) => ({
        variantId: `VAR-${seed.id}-${label.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`,
        label,
        price: seed.price,
        image,
        inStock: true,
      })),
      category: seed.catalogCategory,
      segment: seed.segment === 'base' ? 'Base' : 'Customizada',
      tags: [...seed.tags, 'Seed', seed.segment === 'base' ? 'Volume' : seed.catalogCategory],
      pricingPolicy: {
        minPrice: Number((seed.price * 0.9).toFixed(2)),
        suggestedPrice: Number(seed.price.toFixed(2)),
        promoPriceFloor: Number((seed.price * 0.95).toFixed(2)),
      },
    });
    const pendingReview = await getPendingImpactReviewByEntity('CatalogItem', item.catalogItemId);
    if (pendingReview) {
      await approveImpactReview({
        reviewId: pendingReview.reviewId,
        approvedBy: actor?.actorId ?? 'bootstrap-system',
        reason: 'bootstrap_auto_approve_for_seed',
      });
    }
    const freshReview = await createImpactReview({
      domain: 'supplier_catalog',
      entityType: 'CatalogItem',
      entityId: item.catalogItemId,
      sensitiveFields: ['priceTable'],
      requestedBy: actor?.actorId ?? 'bootstrap-system',
      priority: 'normal',
      slaHours: 2,
    });
    await approveImpactReview({
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
