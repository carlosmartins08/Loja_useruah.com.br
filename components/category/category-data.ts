export interface CategoryProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  badge?: string;
}

export const categoryProducts: CategoryProduct[] = [
  { id: '1', name: 'Camiseta Respiro', category: 'Autoral', price: 89.9, image: 'https://picsum.photos/seed/ruah-p1/800/1000' },
  { id: '2', name: 'Moletom FÃ© Viva', category: 'Autoral', price: 159.9, image: 'https://picsum.photos/seed/ruah-p2/800/1000' },
  { id: '3', name: 'Bolsa Sopro', category: 'Autoral', price: 45.0, image: 'https://picsum.photos/seed/ruah-p3/800/1000' },
  { id: '4', name: 'T-Shirt GeraÃ§Ã£o', category: 'Autoral', price: 95.0, image: 'https://picsum.photos/seed/ruah-p4/800/1000' },
  { id: '5', name: 'Almofada Paz', category: 'Autoral', price: 65.0, image: 'https://picsum.photos/seed/ruah-p5/800/1000' },
  { id: '6', name: 'Ecobag Reino', category: 'Autoral', price: 35.0, image: 'https://picsum.photos/seed/ruah-p6/800/1000', badge: 'Limitado' },
];

export const categoryFilters = ['Minimalista', 'HistÃ³rica', 'Tipografia', 'Iconografia'];

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
