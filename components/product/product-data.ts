import {
  findBrandProductMerchandising,
  findBrandProductSeed,
  type BrandPackagingOption,
} from '@/lib/brand-assets';
import type { CatalogItemRecord } from '@/lib/catalog-item-store';

export interface ProductPageModel {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  segment: string;
  tags: string[];
  colorImages: Record<string, string>;
  fit: 'slim' | 'regular' | 'oversized';
  fabric: string;
  printTypeDescription: string;
  washGuide: string;
  installmentCount: number;
  productionDays: number;
  sizeOptions: string[];
  printOptions: string[];
  packagingOptions: BrandPackagingOption[];
  detailImages: Array<{ label: string; src: string }>;
  modelMockups: Array<{ label: string; src: string }>;
}

export function mapCatalogItemToProductPageModel(item: CatalogItemRecord): ProductPageModel {
  const seed = findBrandProductSeed(item.catalogItemId);
  const merchandising = findBrandProductMerchandising(item.catalogItemId);

  return {
    id: item.catalogItemId,
    name: seed?.name ?? item.name,
    price: seed?.price ?? item.price,
    image: merchandising?.image ?? item.image,
    category: merchandising?.category ?? item.category ?? 'Autoral',
    segment: merchandising?.segment ?? item.segment ?? 'Customizada',
    tags: merchandising?.tags ?? item.tags ?? [],
    colorImages: merchandising?.colorImages ?? item.colorImages,
    fit: merchandising?.fit ?? item.fit,
    fabric: merchandising?.fabric ?? item.fabric,
    printTypeDescription: merchandising?.printTypeDescription ?? item.printTypeDescription,
    washGuide: merchandising?.washGuide ?? item.washGuide,
    installmentCount: merchandising?.installmentCount ?? item.installmentCount,
    productionDays: merchandising?.productionDays ?? 7,
    sizeOptions: merchandising?.sizeOptions ?? ['P', 'M', 'G', 'GG'],
    printOptions: merchandising?.printOptions ?? ['Serigrafia premium'],
    packagingOptions: merchandising?.packagingOptions ?? [
      { name: 'Pack UseRuah', description: 'Proteção essencial com apresentação limpa.' },
    ],
    detailImages: merchandising?.detailImages ?? item.detailImages,
    modelMockups: merchandising?.modelMockups ?? item.modelMockups,
  };
}

export function buildProductJsonLd(product: ProductPageModel) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.image,
      description: `${product.name} da UseRuah. Moda cristã com propósito, categoria ${product.category.toLowerCase()} e produção sob demanda.`,
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
