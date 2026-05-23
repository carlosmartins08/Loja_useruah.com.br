import { ShopPageView } from '@/components/shop/ShopPageView';
import { getPublishedShopProducts } from '@/lib/shop-products';

export default async function ShopPage() {
  const products = await getPublishedShopProducts();
  return <ShopPageView products={products} />;
}
