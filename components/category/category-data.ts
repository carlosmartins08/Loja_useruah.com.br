const CATEGORY_LABELS: Record<string, string> = {
  autoral: 'Autoral',
  campanhas: 'Campanhas',
  acessorios: 'Acessórios',
  fardamento: 'Fardamento',
};

export const categoryFilters = ['Minimalista', 'Histórica', 'Tipografia', 'Iconografia'];

export function formatCategoryName(slug: string) {
  return CATEGORY_LABELS[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function getCategorySlug(category: string) {
  const normalized = category
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  return normalized || 'colecao';
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
