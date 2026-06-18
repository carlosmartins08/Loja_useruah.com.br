import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ProductPageView } from '@/components/product/ProductPageView';
import { buildProductJsonLd, mapCatalogItemToProductPageModel } from '@/components/product/product-data';
import { findBrandProductMerchandising, findBrandProductSeed } from '@/lib/brand-assets';
import { appendAuditLog } from '@/lib/audit-log-store';
import { isCatalogItemLinkedToCampaign, listCampaignCatalogItemIds } from '@/lib/campaign-product-store';
import { getCatalogItem, listCatalogItems } from '@/lib/catalog-item-store';
import { resolveShopCampaignContext } from '@/lib/shop-products';

interface ProductPageParams {
  id: string;
}

async function getPublishedProduct(id: string) {
  const item = await getCatalogItem(id);
  if (!item || item.publicationStatus !== 'published') return null;
  return { item, product: mapCatalogItemToProductPageModel(item) };
}

async function resolveProductCampaignContext(id: string, rawCampaignId?: string) {
  const cookieCampaignId = (await cookies()).get('ruah_campaign_id')?.value;
  const explicitCampaignId = rawCampaignId?.trim();

  if (explicitCampaignId) {
    const explicitContext = resolveShopCampaignContext(explicitCampaignId);
    if (!explicitContext || !isCatalogItemLinkedToCampaign(explicitContext.campaignId, id)) {
      appendAuditLog({
        actor_id: 'public-visitor',
        actor_role: 'public',
        action: 'campaign.context_redirected',
        entity_type: 'Campaign',
        entity_id: explicitCampaignId,
        reason: `source:/product/${id}|target:/shop?campaignId=${explicitCampaignId}|detail:product_outside_campaign`,
      });
      redirect(`/shop?campaignId=${encodeURIComponent(explicitCampaignId)}`);
    }
    return explicitContext;
  }

  const cookieContext = resolveShopCampaignContext(cookieCampaignId);
  if (!cookieContext) return null;
  return isCatalogItemLinkedToCampaign(cookieContext.campaignId, id) ? cookieContext : null;
}

export async function generateMetadata({ params }: { params: Promise<ProductPageParams> }): Promise<Metadata> {
  const { id } = await params;
  const current = await getPublishedProduct(id);
  if (!current) {
    return {
      title: 'Produto não encontrado | UseRuah',
      description: 'Este produto não está publicado no catálogo.',
    };
  }

  return {
    title: `${current.product.name} | UseRuah`,
    description: `Descubra o ${current.product.name}. Moda cristã com propósito e design autoral.`,
    openGraph: {
      images: [current.product.image],
    },
  };
}

export default async function ProductPage(props: {
  params: Promise<ProductPageParams>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const rawCampaignId = searchParams.campaignId;
  const campaignId = Array.isArray(rawCampaignId) ? rawCampaignId[0] : rawCampaignId;
  const { id } = await props.params;
  const current = await getPublishedProduct(id);
  if (!current) notFound();

  const { product } = current;
  const campaignContext = await resolveProductCampaignContext(id, campaignId);
  const campaignCatalogIds = campaignContext ? new Set(listCampaignCatalogItemIds(campaignContext.campaignId)) : null;
  const catalog = await listCatalogItems({ publicationStatus: 'published' });
  const visibleCatalog = campaignCatalogIds
    ? catalog.filter((item) => item.catalogItemId !== id && campaignCatalogIds.has(item.catalogItemId))
    : catalog.filter((item) => item.catalogItemId !== id);
  const scoreRecommendation = (item: Awaited<ReturnType<typeof listCatalogItems>>[number]) => {
    const merchandising = findBrandProductMerchandising(item.catalogItemId);
    const category = merchandising?.category ?? item.category;
    const segment = merchandising?.segment ?? item.segment;
    let score = 0;
    if (category === product.category) score += 2;
    if (segment === product.segment) score += 1;
    return score;
  };

  const recommendations = visibleCatalog
    .sort((left, right) => scoreRecommendation(right) - scoreRecommendation(left))
    .slice(0, 3)
    .map((item) => {
      const seed = findBrandProductSeed(item.catalogItemId);
      const merchandising = findBrandProductMerchandising(item.catalogItemId);
      const category = merchandising?.category ?? item.category;
      const segment = merchandising?.segment ?? item.segment;

      return {
        id: item.catalogItemId,
        name: seed?.name ?? item.name,
        price: item.variants.find((variant) => variant.inStock)?.price ?? item.price,
        image: merchandising?.image ?? item.image,
        href: campaignContext ? `/product/${item.catalogItemId}?campaignId=${campaignContext.campaignId}` : `/product/${item.catalogItemId}`,
        bundleHint:
          category === product.category
            ? `Continua a leitura da categoria ${product.category.toLowerCase()}.`
            : segment === product.segment
              ? `Segue a mesma linha ${product.segment.toLowerCase()} do produto atual.`
              : 'Amplia a coleção com outra leitura da UseRuah.',
      };
    });

  const jsonLd = buildProductJsonLd(product);
  return <ProductPageView product={product} jsonLd={jsonLd} recommendations={recommendations} campaignContext={campaignContext} />;
}
