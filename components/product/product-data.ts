import type { CatalogItemRecord } from '@/lib/catalog-item-store';

export interface ProductPageModel {
  id: string;
  name: string;
  price: number;
  image: string;
  colorImages: Record<string, string>;
  fit: 'slim' | 'regular' | 'oversized';
  fabric: string;
  printTypeDescription: string;
  washGuide: string;
  installmentCount: number;
  detailImages: Array<{ label: string; src: string }>;
  modelMockups: Array<{ label: string; src: string }>;
}

export function mapCatalogItemToProductPageModel(item: CatalogItemRecord): ProductPageModel {
  return {
    id: item.catalogItemId,
    name: item.name,
    price: item.price,
    image: item.image,
    colorImages: item.colorImages,
    fit: item.fit,
    fabric: item.fabric,
    printTypeDescription: item.printTypeDescription,
    washGuide: item.washGuide,
    installmentCount: item.installmentCount,
    detailImages: item.detailImages,
    modelMockups: item.modelMockups,
  };
}

export function buildProductJsonLd(product: ProductPageModel) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.image,
      description: 'Moda cristã e produtos personalizados sob demanda.',
      brand: {
        '@type': 'Brand',
        name: 'UseRuah',
      },
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'BRL',
        availability: 'https://schema.org/InStock',
      },
    },
    {
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
          name: 'Produtos',
          item: 'https://useruah.com.br/shop',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: product.name,
          item: `https://useruah.com.br/product/${product.id}`,
        },
      ],
    },
  ];
}
