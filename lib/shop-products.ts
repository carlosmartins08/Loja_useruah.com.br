import 'server-only';

import { findBrandProductMerchandising, findBrandProductSeed } from '@/lib/brand-assets';
import { listCampaignCatalogItemIds } from '@/lib/campaign-product-store';
import { getCampaign } from '@/lib/campaign-store';
import { listCatalogItems, type CatalogItemRecord } from '@/lib/catalog-item-store';
import type { ShopProduct } from '@/components/shop/shop-data';

export interface ShopCampaignContext {
  campaignId: string;
  campaignName: string;
  organizationId: string;
  progressivePriceRule: string;
}

function toShopCampaignContext(campaignId: string) {
  const campaign = getCampaign(campaignId);
  if (!campaign || campaign.status !== 'active') return null;
  return {
    campaignId: campaign.campaignId,
    campaignName: campaign.name,
    organizationId: campaign.organizationId,
    progressivePriceRule: campaign.progressivePriceRule,
  } satisfies ShopCampaignContext;
}

function pickPrimaryVariant(item: CatalogItemRecord) {
  return item.variants.find((variant) => variant.inStock) ?? item.variants[0] ?? null;
}

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
  const primaryVariant = pickPrimaryVariant(item);
  const basePrice = primaryVariant?.price ?? item.price;

  return {
    id: item.catalogItemId,
    name: seed?.name ?? item.name,
    price: basePrice,
    basePrice,
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
    variantId: primaryVariant?.variantId ?? 'default',
    variantLabel: primaryVariant?.label ?? 'Padrão',
    pricingPolicyMinPrice: item.pricingPolicy?.minPrice,
  };
}

export function resolveShopCampaignContext(campaignId?: string) {
  const normalized = campaignId?.trim();
  if (!normalized) return null;
  return toShopCampaignContext(normalized);
}

export async function getPublishedShopProducts(input?: {
  campaignId?: string;
}): Promise<{ products: ShopProduct[]; campaignContext: ShopCampaignContext | null }> {
  const items = await listCatalogItems({ publicationStatus: 'published' });
  const campaignId = input?.campaignId?.trim();

  if (!campaignId) {
    return {
      products: items.map(mapCatalogItemToShopProduct),
      campaignContext: null,
    };
  }

  const campaignContext = toShopCampaignContext(campaignId);
  if (!campaignContext) {
    return {
      products: items.map(mapCatalogItemToShopProduct),
      campaignContext: null,
    };
  }

  const linkedCatalogItemIds = new Set(listCampaignCatalogItemIds(campaignId));
  const filteredItems = items.filter((item) => linkedCatalogItemIds.has(item.catalogItemId));

  return {
    products: filteredItems.map(mapCatalogItemToShopProduct),
    campaignContext,
  };
}
