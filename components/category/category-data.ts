import { BRAND_CATEGORY_PRODUCTS } from '@/lib/brand-assets';

export interface CategoryProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  hoverImage?: string;
  badge?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  autoral: 'Autoral',
  campanhas: 'Campanhas',
  acessorios: 'Acessórios',
  artistas: 'Artistas',
};

export const categoryProducts: CategoryProduct[] = BRAND_CATEGORY_PRODUCTS;

export const categoryFilters = ['Minimalista', 'Histórica', 'Tipografia', 'Iconografia'];

export function formatCategoryName(slug: string) {
  return CATEGORY_LABELS[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function getCategoryProductsBySlug(slug: string) {
  if (slug === 'campanhas') {
    return categoryProducts.filter((product) => product.category === 'Campanha');
  }

  if (slug in CATEGORY_LABELS) {
    return categoryProducts.filter((product) => product.category === CATEGORY_LABELS[slug]);
  }

  return categoryProducts;
}

export function buildCategoryJsonLd(slug: string, categoryName: string) {
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
        item: `https://useruah.com.br/category/${slug}`,
      },
    ],
  };
}
