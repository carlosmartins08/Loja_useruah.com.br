import { NextResponse } from 'next/server';
import { appendAuditLog } from '@/lib/audit-log-store';
import { canManageCatalog, getActorFromRequest } from '@/lib/access-control';
import { createCatalogItem, markCatalogItemReady, publishCatalogItem } from '@/lib/catalog-item-store';
import { upsertApprovedArtwork } from '@/lib/artwork-store';

const SEED_ITEMS = [
  { id: '1', name: 'Camiseta Respiro', price: 89.9, category: 'autoral', segment: 'customizada', image: 'https://picsum.photos/seed/ruah-p1/1000/1000' },
  { id: '2', name: 'Moletom Fé Viva', price: 159.9, category: 'campanhas', segment: 'customizada', image: 'https://picsum.photos/seed/ruah-p2/1000/1000' },
  { id: '3', name: 'Bolsa Sopro', price: 45, category: 'acessorios', segment: 'customizada', image: 'https://picsum.photos/seed/ruah-p3/1000/1000' },
  { id: '4', name: 'Uniforme Base G1', price: 55, category: 'fardamento', segment: 'base', image: 'https://picsum.photos/seed/ruah-p4/1000/1000' },
  { id: '5', name: 'Camiseta Base Cotton', price: 42.9, category: 'fardamento', segment: 'base', image: 'https://picsum.photos/seed/ruah-p5/1000/1000' },
  { id: '6', name: 'Botton Símbolo', price: 12, category: 'acessorios', segment: 'customizada', image: 'https://picsum.photos/seed/ruah-p6/1000/1000' },
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
