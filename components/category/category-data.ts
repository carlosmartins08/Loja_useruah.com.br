import { BRAND_PRODUCT_SEEDS } from '@/lib/brand-assets';

export interface CategoryProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  hoverImage?: string;
  badge?: string;
}

export const categoryProducts: CategoryProduct[] = BRAND_PRODUCT_SEEDS.map((product, index) => ({
  id: product.id,
  name: product.name,
  category: 'Autoral',
  price: product.price,
  image: product.image,
  hoverImage: product.hoverImage,
  badge: index === BRAND_PRODUCT_SEEDS.length - 1 ? 'Limitado' : undefined,
}));

export const categoryFilters = ['Minimalista', 'Histórica', 'Tipografia', 'Iconografia'];

export function formatCategoryName(slug: string) {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function buildCategoryJsonLd(categoryName: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://useruah.com.br',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: categoryName,
        item: `https://useruah.com.br/category/${categoryName}`,
      },
    ],
  };
}
