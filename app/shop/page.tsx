import { ShopPageView } from '@/components/shop/ShopPageView';
import { getPublishedShopProducts } from '@/lib/shop-products';

export const dynamic = 'force-dynamic';

export default async function ShopPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const rawCampaignId = searchParams.campaignId;
  const campaignId = Array.isArray(rawCampaignId) ? rawCampaignId[0] : rawCampaignId;
  const { products, campaignContext, campaignSummary, storefrontState, message, requestedCampaignId } = await getPublishedShopProducts({
    campaignId,
  });

  return (
    <ShopPageView
      products={products}
      campaignContext={campaignContext}
      campaignSummary={campaignSummary}
      storefrontState={storefrontState}
      storefrontMessage={message}
      requestedCampaignId={requestedCampaignId}
    />
  );
}
