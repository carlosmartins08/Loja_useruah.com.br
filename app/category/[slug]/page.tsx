import React from 'react';
import { Metadata } from 'next';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { ProductCard } from '@/components/commerce/ProductCard';
import { ChevronDown, Search, X, ArrowUpRight } from 'lucide-react';
import { AppImage } from '@/components/shared/AppImage';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1);
  return {
    title: `${categoryName} | Universo Ruah`,
    description: `Descubra a coleÃ§Ã£o ${categoryName} da UseRuah. Arte cristÃ£ autÃªntica para manifestar sua fÃ© com propÃ³sito.`,
  };
}

const categoryProducts = [
  { id: '1', name: 'Camiseta Respiro', category: 'Autoral', price: 89.90, image: 'https://picsum.photos/seed/ruah-p1/800/1000' },
  { id: '2', name: 'Moletom FÃ© Viva', category: 'Autoral', price: 159.90, image: 'https://picsum.photos/seed/ruah-p2/800/1000' },
  { id: '3', name: 'Bolsa Sopro', category: 'Autoral', price: 45.00, image: 'https://picsum.photos/seed/ruah-p3/800/1000' },
  { id: '4', name: 'T-Shirt GeraÃ§Ã£o', category: 'Autoral', price: 95.00, image: 'https://picsum.photos/seed/ruah-p4/800/1000' },
  { id: '5', name: 'Almofada Paz', category: 'Autoral', price: 65, image: 'https://picsum.photos/seed/ruah-p5/800/1000' },
  { id: '6', name: 'Ecobag Reino', category: 'Autoral', price: 35, image: 'https://picsum.photos/seed/ruah-p6/800/1000', badge: 'Limitado' },
];

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: categoryName } = await params;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://useruah.com.br'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: categoryName,
        item: `https://useruah.com.br/category/${categoryName}`
      }
    ]
  };

  return (
    <main className="bg-white min-h-screen pb-32 page-header-offset">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      
      {/* Editorial Header */}
      <section className="pt-12 pb-12" aria-labelledby="category-title">
        <div className="section-container">
          <Breadcrumbs 
            items={[
              { label: 'Universo', href: '/shop' },
              { label: categoryName }
            ]} 
            className="mb-8"
          />
          <h1 id="category-title" className="text-[clamp(3rem,10vw,10rem)] font-serif leading-[0.8] tracking-tighter mb-8 italic font-black uppercase text-ruah-950">
            {categoryName}.
          </h1>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-t border-ruah-100 pt-8">
            <p className="text-[10px] font-bold text-ruah-300 max-w-sm tracking-widest leading-relaxed uppercase">
              Arte que respira. Cada peÃ§a nesta coleÃ§Ã£o foi curada para conectar sua identidade cristÃ£ com o design contemporÃ¢neo.
            </p>
            <p className="text-[10px] font-bold text-ruah-300 max-w-sm tracking-widest text-left md:text-right uppercase">
               PeÃ§as sustentÃ¡veis, produzidas sob demanda para evitar o desperdÃ­cio e honrar a criaÃ§Ã£o.
            </p>
          </div>
        </div>
      </section>

      {/* Artist Spotlight Strategic Section */}
      <section className="section-container mb-24">
         <div className="bg-ruah-950 rounded-[3rem] p-10 lg:p-20 flex flex-col lg:flex-row items-center gap-16 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(196,164,132,0.15),transparent_60%)]" />
            <div className="w-full lg:w-1/2 relative z-10">
               <span className="tech-label text-accent-gold mb-8">Destaque da ColeÃ§Ã£o</span>
               <h2 className="ur-type-display-md text-white italic uppercase mb-8">
                 O TraÃ§o de <br /> Lucas Sant&apos;Ana.
               </h2>
               <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest leading-loose mb-10 max-w-md">
                 &quot;Minha arte para a coleÃ§Ã£o {categoryName} busca traduzir o silÃªncio da oraÃ§Ã£o em linhas minimalistas e cores que remetem Ã  terra.&quot;
               </p>
               <Link href="/artista/lucas-santana" className="inline-flex items-center gap-4 text-white hover:text-accent-gold transition-colors">
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                     <ArrowUpRight size={18} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Ver Todas as Artes Dele</span>
               </Link>
            </div>
            <div className="w-full lg:w-1/2 aspect-square rounded-[2rem] overflow-hidden relative shadow-2xl">
               <AppImage context="content-banner" 
                 src="https://picsum.photos/seed/artist-cat/800/800" 
                 alt="Artista em destaque" 
                 fill 
                 className="object-cover"
               />
            </div>
         </div>
      </section>

      {/* Grid Layout */}
      <section className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-3 flex flex-col gap-8 pt-6">
             <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-ruah-200 italic font-serif uppercase tracking-widest">/ColeÃ§Ã£o Geral</span>
                <h3 className="ur-type-display-md italic uppercase mb-4 text-ruah-950">
                  Respiro <br /> Urbano.
                </h3>
             </div>
             
             <div className="flex flex-col gap-4 mt-8">
                <span className="text-[9px] font-bold text-ruah-200 uppercase tracking-[0.2em] mb-2">Filtrar por Estampa</span>
                {['Minimalista', 'HistÃ³rica', 'Tipografia', 'Iconografia'].map(f => (
                  <button key={f} className="text-left py-2 border-b border-ruah-50 text-[10px] font-bold uppercase tracking-widest hover:text-accent-gold transition-colors flex justify-between items-center group">
                    {f} <ChevronDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
             </div>
          </div>

          <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
             {categoryProducts.map(p => (
                <ProductCard key={p.id} {...p} />
             ))}
          </div>
        </div>

        <div className="mt-32 flex justify-center">
           <button className="flex items-center gap-3 bg-ruah-950 text-white px-12 py-5 rounded-full font-bold text-[10px] tracking-[0.3em] hover:bg-accent-gold motion-base active:scale-95 shadow-xl shadow-ruah-950/10">
              Carregar Mais Obras <ArrowUpRight size={18} />
           </button>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}

