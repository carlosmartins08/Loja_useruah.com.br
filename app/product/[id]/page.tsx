import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductPageView } from '@/components/product/ProductPageView';
import { buildProductJsonLd, mapCatalogItemToProductPageModel } from '@/components/product/product-data';
import { findBrandProductMerchandising, findBrandProductSeed } from '@/lib/brand-assets';
import { getCatalogItem, listCatalogItems } from '@/lib/catalog-item-store';

interface ProductPageParams {
  id: string;
}

async function getPublishedProduct(id: string) {
  const item = await getCatalogItem(id);
  if (!item || item.publicationStatus !== 'published') return null;
  return mapCatalogItemToProductPageModel(item);
}

export async function generateMetadata({ params }: { params: Promise<ProductPageParams> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getPublishedProduct(id);
  if (!product) {
    return {
      title: 'Produto não encontrado | UseRuah',
      description: 'Este produto não está publicado no catálogo.',
    };
  }

  return {
    title: `${product.name} | UseRuah`,
    description: `Descubra o ${product.name}. Moda cristã com propósito e design autoral.`,
    openGraph: {
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<ProductPageParams> }) {
  const { id } = await params;
  const product = await getPublishedProduct(id);
  if (!product) notFound();

  const catalog = await listCatalogItems({ publicationStatus: 'published' });
  const scoreRecommendation = (item: Awaited<ReturnType<typeof listCatalogItems>>[number]) => {
    const merchandising = findBrandProductMerchandising(item.catalogItemId);
    const category = merchandising?.category ?? item.category;
    const segment = merchandising?.segment ?? item.segment;
    let score = 0;
    if (category === product.category) score += 2;
    if (segment === product.segment) score += 1;
    return score;
  };

  const recommendations = catalog
    .filter((item) => item.catalogItemId !== id)
    .sort((left, right) => scoreRecommendation(right) - scoreRecommendation(left))
    .slice(0, 3)
    .map((item) => {
      const seed = findBrandProductSeed(item.catalogItemId);
      const merchandising = findBrandProductMerchandising(item.catalogItemId);
      const category = merchandising?.category ?? item.category;
      const segment = merchandising?.segment ?? item.segment;

      return {
        id: item.catalogItemId,
        name: seed?.name ?? item.name,
        price: seed?.price ?? item.price,
        image: merchandising?.image ?? item.image,
        bundleHint:
          category === product.category
            ? `Continua a leitura da categoria ${product.category.toLowerCase()}.`
            : segment === product.segment
              ? `Segue a mesma linha ${product.segment.toLowerCase()} do produto atual.`
              : 'Amplia a coleção com outra leitura da UseRuah.',
      };
    });

  const jsonLd = buildProductJsonLd(product);
  return <ProductPageView product={product} jsonLd={jsonLd} recommendations={recommendations} />;
}
