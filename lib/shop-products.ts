import 'server-only';

import { listCatalogItems, type CatalogItemRecord } from '@/lib/catalog-item-store';
import type { ShopProduct } from '@/components/shop/shop-data';

function mapCatalogItemToShopProduct(item: CatalogItemRecord): ShopProduct {
  return {
    id: item.catalogItemId,
    name: item.name,
    price: item.price,
    category: item.category ?? 'Autoral',
    segment: item.segment ?? 'Customizada',
    image: item.image,
    tags: item.tags ?? [],
  };
}

export function getPublishedShopProducts(): ShopProduct[] {
  return listCatalogItems({ publicationStatus: 'published' }).map(mapCatalogItemToShopProduct);
}
