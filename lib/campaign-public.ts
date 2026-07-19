import 'server-only';

import { listCampaignCatalogItemIds } from '@/lib/campaign-product-store';
import { getCampaign } from '@/lib/campaign-store';
import { listCatalogItems, type CatalogItemRecord } from '@/lib/catalog-item-store';

export type PublicCampaignState = 'active' | 'inactive' | 'not_found';

export interface PublicCampaignSummary {
  campaignId: string;
  name: string;
  description: string;
  progressivePriceRule: string;
  startsAt?: string;
  endsAt?: string;
}

export interface PublicCampaignStorefront {
  href: string;
  isActive: boolean;
  publishedProductCount: number;
}

export interface PublicCampaignProduct {
  catalogItemId: string;
  name: string;
  image: string;
  price: number;
  category: 'Autoral' | 'Campanhas' | 'Fardamento' | 'Acessórios';
  segment: 'Base' | 'Customizada';
  href: string;
}

export interface PublicCampaignDetail {
  state: PublicCampaignState;
  message: string;
  campaign: PublicCampaignSummary | null;
  storefront: PublicCampaignStorefront;
  products: PublicCampaignProduct[];
}

function pickPrimaryPrice(item: CatalogItemRecord) {
  return item.variants.find((variant) => variant.inStock)?.price ?? item.price;
}

function toPublicCampaignProduct(item: CatalogItemRecord, campaignId: string): PublicCampaignProduct {
  return {
    catalogItemId: item.catalogItemId,
    name: item.name,
    image: item.image,
    price: pickPrimaryPrice(item),
    category: item.category ?? 'Autoral',
    segment: item.segment ?? 'Customizada',
    href: `/product/${item.catalogItemId}?campaignId=${encodeURIComponent(campaignId)}`,
  };
}

export async function getPublicCampaignDetail(campaignId: string): Promise<PublicCampaignDetail> {
  const normalizedCampaignId = campaignId.trim();
  const storefrontHref = `/c/${encodeURIComponent(normalizedCampaignId)}/shop`;
  const campaign = await getCampaign(normalizedCampaignId);

  if (!campaign) {
    return {
      state: 'not_found',
      message: 'Campanha não encontrada.',
      campaign: null,
      storefront: {
        href: storefrontHref,
        isActive: false,
        publishedProductCount: 0,
      },
      products: [],
    };
  }

  const publicCampaign: PublicCampaignSummary = {
    campaignId: campaign.campaignId,
    name: campaign.name,
    description: campaign.description,
    progressivePriceRule: campaign.progressivePriceRule,
    startsAt: campaign.startsAt,
    endsAt: campaign.endsAt,
  };

  if (campaign.status !== 'active') {
    return {
      state: 'inactive',
      message: 'Esta campanha não está ativa no momento.',
      campaign: publicCampaign,
      storefront: {
        href: storefrontHref,
        isActive: false,
        publishedProductCount: 0,
      },
      products: [],
    };
  }

  const linkedCatalogItemIds = new Set(await listCampaignCatalogItemIds(campaign.campaignId));
  const linkedPublishedProducts = (await listCatalogItems({ publicationStatus: 'published' }))
    .filter((item) => linkedCatalogItemIds.has(item.catalogItemId))
    .map((item) => toPublicCampaignProduct(item, campaign.campaignId));

  return {
    state: 'active',
    message:
      linkedPublishedProducts.length > 0
        ? 'Campanha ativa com vitrine publicada.'
        : 'Campanha ativa sem vitrine publicada neste momento.',
    campaign: publicCampaign,
    storefront: {
      href: storefrontHref,
      isActive: true,
      publishedProductCount: linkedPublishedProducts.length,
    },
    products: linkedPublishedProducts,
  };
}
