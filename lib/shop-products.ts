import 'server-only';

import { findBrandProductMerchandising, findBrandProductSeed } from '@/lib/brand-assets';
import { listCatalogItems, type CatalogItemRecord } from '@/lib/catalog-item-store';
import type { ShopProduct } from '@/components/shop/shop-data';

function pickHoverImage(item: CatalogItemRecord) {
  const candidates = [
    ...Object.values(item.colorImages),
    ...item.detailImages.map((asset) => asset.src),
    ...item.modelMockups.map((asset) => asset.src),
    ...item.variants.map((variant) => variant.image),
  ];

  return candidates.find((src) => src && src !== item.image);
}

function mapCatalogItemToShopProduct(item: CatalogItemRecord): ShopProduct {
  const seed = findBrandProductSeed(item.catalogItemId);
  const merchandising = findBrandProductMerchandising(item.catalogItemId);

  return {
    id: item.catalogItemId,
    name: seed?.name ?? item.name,
    price: seed?.price ?? item.price,
    category: merchandising?.category ?? item.category ?? 'Autoral',
    segment: merchandising?.segment ?? item.segment ?? 'Customizada',
    image: merchandising?.image ?? item.image,
    hoverImage: merchandising?.hoverImage ?? pickHoverImage(item),
    badge:
      merchandising?.segment === 'Base'
        ? 'Linha Base'
        : merchandising?.category === 'Campanhas'
          ? 'Campanha'
          : undefined,
    tags: merchandising?.tags ?? item.tags ?? [],
  };
}

export async function getPublishedShopProducts(): Promise<ShopProduct[]> {
  const items = await listCatalogItems({ publicationStatus: 'published' });
  return items.map(mapCatalogItemToShopProduct);
}
