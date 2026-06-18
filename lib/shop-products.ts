import 'server-only';

import { findBrandProductMerchandising, findBrandProductSeed } from '@/lib/brand-assets';
import { listCampaignCatalogItemIds } from '@/lib/campaign-product-store';
import { getCampaign, type CampaignRecord } from '@/lib/campaign-store';
import { listCatalogItems, type CatalogItemRecord } from '@/lib/catalog-item-store';
import type { ShopProduct } from '@/components/shop/shop-data';

export interface ShopCampaignContext {
  campaignId: string;
  campaignName: string;
  organizationId: string;
  progressivePriceRule: string;
}

export interface ShopCampaignSummary {
  campaignId: string;
  campaignName: string;
  organizationId: string;
  progressivePriceRule: string;
  isActive: boolean;
}

export type ShopStorefrontState = 'default' | 'active' | 'empty' | 'inactive' | 'not_found';

export interface ShopCampaignResolution {
  requestedCampaignId?: string;
  storefrontState: ShopStorefrontState;
  message: string | null;
  campaignSummary: ShopCampaignSummary | null;
  campaignContext: ShopCampaignContext | null;
}

function toShopCampaignSummary(campaign: CampaignRecord): ShopCampaignSummary {
  return {
    campaignId: campaign.campaignId,
    campaignName: campaign.name,
    organizationId: campaign.organizationId,
    progressivePriceRule: campaign.progressivePriceRule,
    isActive: campaign.status === 'active',
  };
}

function toShopCampaignContext(campaignId: string) {
  const campaign = getCampaign(campaignId);
  if (!campaign || campaign.status !== 'active') return null;
  const summary = toShopCampaignSummary(campaign);
  return {
    campaignId: summary.campaignId,
    campaignName: summary.campaignName,
    organizationId: summary.organizationId,
    progressivePriceRule: summary.progressivePriceRule,
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

export function resolveShopCampaign(input?: { campaignId?: string }): ShopCampaignResolution {
  const campaignId = input?.campaignId?.trim();
  if (!campaignId) {
    return {
      storefrontState: 'default',
      message: null,
      campaignSummary: null,
      campaignContext: null,
    };
  }

  const campaign = getCampaign(campaignId);
  if (!campaign) {
    return {
      requestedCampaignId: campaignId,
      storefrontState: 'not_found',
      message: 'Essa campanha pública não existe ou já foi removida.',
      campaignSummary: null,
      campaignContext: null,
    };
  }

  const campaignSummary = toShopCampaignSummary(campaign);
  if (campaign.status !== 'active') {
    return {
      requestedCampaignId: campaignId,
      storefrontState: 'inactive',
      message: 'Esta campanha existe, mas a vitrine pública não está ativa agora.',
      campaignSummary,
      campaignContext: null,
    };
  }

  return {
    requestedCampaignId: campaignId,
    storefrontState: 'active',
    message: null,
    campaignSummary,
    campaignContext: toShopCampaignContext(campaignId),
  };
}

export async function getPublishedShopProducts(input?: {
  campaignId?: string;
}): Promise<{
  products: ShopProduct[];
  campaignContext: ShopCampaignContext | null;
  campaignSummary: ShopCampaignSummary | null;
  storefrontState: ShopStorefrontState;
  message: string | null;
  requestedCampaignId?: string;
}> {
  const items = await listCatalogItems({ publicationStatus: 'published' });
  const resolution = resolveShopCampaign(input);

  if (resolution.storefrontState === 'default') {
    return {
      products: items.map(mapCatalogItemToShopProduct),
      ...resolution,
    };
  }

  if (resolution.storefrontState === 'inactive' || resolution.storefrontState === 'not_found') {
    return {
      products: [],
      ...resolution,
    };
  }

  const linkedCatalogItemIds = new Set(listCampaignCatalogItemIds(resolution.campaignContext?.campaignId ?? ''));
  const filteredItems = items.filter((item) => linkedCatalogItemIds.has(item.catalogItemId));
  const storefrontState = filteredItems.length > 0 ? 'active' : 'empty';
  const message =
    storefrontState === 'empty'
      ? 'Esta campanha está ativa, mas ainda não tem itens publicados visíveis na vitrine.'
      : null;

  return {
    products: filteredItems.map(mapCatalogItemToShopProduct),
    campaignContext: resolution.campaignContext,
    campaignSummary: resolution.campaignSummary,
    storefrontState,
    message,
    requestedCampaignId: resolution.requestedCampaignId,
  };
}
