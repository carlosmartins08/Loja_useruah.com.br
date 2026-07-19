import {
  findBrandProductMerchandising,
  type BrandPackagingOption,
} from '@/lib/brand-assets';
import type { CatalogItemRecord } from '@/lib/catalog-item-store';

export interface ProductPageModel {
  id: string;
  name: string;
  price: number;
  basePrice: number;
  image: string;
  category: string;
  segment: string;
  tags: string[];
  variantId: string;
  variantLabel: string;
  pricingPolicyMinPrice?: number;
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
  const merchandising = findBrandProductMerchandising(item.catalogItemId);
  const primaryVariant = item.variants.find((variant) => variant.inStock) ?? item.variants[0] ?? null;
  const basePrice = primaryVariant?.price ?? item.price;

  return {
    id: item.catalogItemId,
    name: item.name,
    price: basePrice,
    basePrice,
    image: item.image,
    category: item.category ?? 'Autoral',
    segment: item.segment ?? 'Customizada',
    tags: item.tags ?? [],
    variantId: primaryVariant?.variantId ?? 'default',
    variantLabel: primaryVariant?.label ?? 'Padrão',
    pricingPolicyMinPrice: item.pricingPolicy?.minPrice,
    colorImages: item.colorImages,
    fit: item.fit,
    fabric: item.fabric,
    printTypeDescription: item.printTypeDescription,
    washGuide: item.washGuide,
    installmentCount: item.installmentCount,
    productionDays: merchandising?.productionDays ?? 7,
    sizeOptions: merchandising?.sizeOptions ?? ['P', 'M', 'G', 'GG'],
    printOptions: merchandising?.printOptions ?? ['Serigrafia premium'],
    packagingOptions: merchandising?.packagingOptions ?? [
      { name: 'Pack UseRuah', description: 'Proteção essencial com apresentação limpa.' },
    ],
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
