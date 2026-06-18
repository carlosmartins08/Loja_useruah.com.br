import { getCategorySlug } from '@/components/category/category-data';
import { HomePage } from '@/components/home/HomePage';
import { getPublishedShopProducts } from '@/lib/shop-products';

export default async function Page() {
  const { products } = await getPublishedShopProducts();
  const featuredProducts = products.slice(0, 4);
  const categoryMap = new Map<string, { name: string; image: string; link: string }>();

  for (const product of products) {
    if (categoryMap.has(product.category)) continue;
    categoryMap.set(product.category, {
      name: product.category,
      image: product.image,
      link: `/category/${getCategorySlug(product.category)}`,
    });
    if (categoryMap.size >= 3) break;
  }

  return <HomePage featuredCategories={Array.from(categoryMap.values())} featuredProducts={featuredProducts} />;
}
