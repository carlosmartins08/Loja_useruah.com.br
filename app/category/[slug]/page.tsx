import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { ProductCard } from '@/components/commerce/ProductCard';
import { AppImage } from '@/components/shared/AppImage';
import { buildCategoryJsonLd, categoryFilters, formatCategoryName } from '@/components/category/category-data';
import { getPublishedShopProducts } from '@/lib/shop-products';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = formatCategoryName(slug);

  return {
    title: `${categoryName} | Universo Ruah`,
    description: `Descubra a colecao ${categoryName} da UseRuah. Somente itens publicados no catalogo real entram aqui.`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categoryName = formatCategoryName(slug);
  const { products: publishedProducts } = await getPublishedShopProducts();
  const products = publishedProducts.filter((product) => product.category === categoryName);
  const jsonLd = buildCategoryJsonLd(slug, categoryName);

  return (
    <main className="bg-white min-h-screen pb-32 page-header-offset">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />

      <section className="pt-12 pb-16 relative overflow-hidden" aria-labelledby="category-title">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_24%,rgba(197,160,89,0.1),transparent_26%),radial-gradient(circle_at_82%_14%,rgba(23,44,54,0.06),transparent_22%)]" />
        <div className="section-container relative z-10">
          <Breadcrumbs items={[{ label: 'Universo', href: '/shop' }, { label: categoryName }]} className="mb-8" />
          <div className="layout-grid-media gap-10 lg:gap-16 items-end">
            <div className="lg:col-span-7">
              <h1 id="category-title" className="ur-type-display-xl leading-[0.8] tracking-tighter mb-8 italic font-black uppercase text-ruah-950">
                {categoryName}.
              </h1>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-t border-ruah-100 pt-8">
                <p className="text-[10px] font-bold text-ruah-300 max-w-sm tracking-widest leading-relaxed uppercase">
                  Arte que respira. Cada peca desta colecao foi publicada no catalogo real antes de aparecer aqui.
                </p>
                <p className="text-[10px] font-bold text-ruah-300 max-w-sm tracking-widest text-left md:text-right uppercase">
                  Pecas sustentaveis, produzidas sob demanda para evitar desperdicio e honrar a criacao.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-[3rem] border border-ruah-100 bg-white/90 p-8 lg:p-10 shadow-fancy backdrop-blur-sm">
                <span className="tech-label text-accent-gold">Curadoria da categoria</span>
                <h2 className="mt-5 text-3xl font-serif italic uppercase leading-none text-ruah-950">Uma vitrine com leitura clara e presenca de marca.</h2>
                <p className="mt-5 text-sm font-medium leading-relaxed text-ruah-500">
                  A categoria funciona como ponte entre narrativa editorial e intencao de compra. Aqui so entra item ja publicado no catalogo.
                </p>
                <div className="mt-8 grid grid-cols-3 gap-4 border-t border-ruah-100 pt-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-2xl font-serif italic font-black text-ruah-950">{products.length}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ruah-400">Itens</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-2xl font-serif italic font-black text-ruah-950">{products.length > 0 ? 'SIM' : 'NAO'}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ruah-400">Curadoria ativa</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-2xl font-serif italic font-black text-ruah-950">100%</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ruah-400">Sob demanda</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container mb-24">
        <div className="bg-ruah-950 rounded-[3rem] p-10 lg:p-20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(196,164,132,0.15),transparent_60%)]" />
          <div className="layout-grid-media gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-5 relative z-10">
              <span className="tech-label text-accent-gold mb-8">Leitura da Colecao</span>
              <h2 className="ur-type-display-md text-white italic uppercase mb-8">
                O Recorte de
                <br />
                {categoryName}.
              </h2>
              <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest leading-loose mb-10 max-w-md">
                Este bloco editorial nao promete portfolio publico por artista. Ele contextualiza a atmosfera visual da categoria e direciona para superficies reais.
              </p>
              <Link href="/journal" className="inline-flex items-center gap-4 text-white hover:text-accent-gold transition-colors">
                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                  <ArrowUpRight size={18} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Abrir Leituras Da Marca</span>
              </Link>
            </div>
            <div className="lg:col-span-7 aspect-square rounded-[2rem] overflow-hidden relative shadow-2xl">
              <AppImage context="content-banner" src="/assets/editorial/artist-spotlight.svg" alt="Leitura editorial da categoria" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="section-container">
        <div className="layout-grid-product gap-8">
          <div className="lg:col-span-3 flex flex-col gap-8 pt-6 self-start rounded-[2.5rem] border border-ruah-100 bg-ruah-50/70 p-6 shadow-subtle">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-ruah-200 italic font-serif uppercase tracking-widest">/Colecao Geral</span>
              <h3 className="ur-type-display-md italic uppercase mb-4 text-ruah-950">
                Respiro
                <br />
                Urbano.
              </h3>
            </div>

            <div className="flex flex-col gap-4 mt-8">
              <span className="text-[9px] font-bold text-ruah-200 uppercase tracking-[0.2em] mb-2">Recortes Visuais Da Categoria</span>
              {categoryFilters.map((filter) => (
                <div key={filter} className="py-3 px-4 rounded-2xl border border-transparent bg-white/80 text-[10px] font-bold uppercase tracking-widest text-ruah-500 shadow-sm">
                  {filter}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-9">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-ruah-100 bg-white p-10 text-center shadow-sm">
                <h2 className="text-2xl font-serif italic uppercase text-ruah-950">Nenhum item publicado nesta categoria.</h2>
                <p className="mt-4 text-sm font-medium text-ruah-500">
                  A categoria continua visivel, mas nao vai inventar produto fora do catalogo vivo. Volte para a colecao completa e escolha outro recorte.
                </p>
                <Link href="/shop" className="mt-8 inline-flex items-center gap-2 bg-ruah-950 text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-[0.16em] hover:bg-accent-gold transition-colors">
                  Ver Catalogo Completo <ArrowUpRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-32 flex flex-col items-center gap-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ruah-400 max-w-lg">
            Este recorte mostra tudo o que esta publicado hoje nesta categoria. Quando a curadoria crescer, a vitrine cresce junto.
          </p>
          <Link href="/shop" className="flex items-center gap-3 bg-ruah-950 text-white px-12 py-5 rounded-full font-bold text-[10px] tracking-[0.3em] hover:bg-accent-gold motion-base active:scale-95 shadow-xl shadow-ruah-950/10">
            Ver Catalogo Completo <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
