import { ShopPageView } from '@/components/shop/ShopPageView';
import { getPublishedShopProducts } from '@/lib/shop-products';

export default function ShopPage() {
  const products = getPublishedShopProducts();
  return <ShopPageView products={products} />;
}
