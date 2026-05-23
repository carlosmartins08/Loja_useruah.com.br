import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductPageView } from '@/components/product/ProductPageView';
import { buildProductJsonLd, mapCatalogItemToProductPageModel } from '@/components/product/product-data';
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
  const recommendations = catalog
    .filter((item) => item.catalogItemId !== id)
    .slice(0, 3)
    .map((item) => ({
      id: item.catalogItemId,
      name: item.name,
      price: item.price,
      image: item.image,
      bundleHint: 'Complete o look com este item da coleção.',
    }));

  const jsonLd = buildProductJsonLd(product);
  return <ProductPageView product={product} jsonLd={jsonLd} recommendations={recommendations} />;
}
