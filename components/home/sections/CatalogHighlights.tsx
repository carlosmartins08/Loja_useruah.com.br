import { ProductCard } from '@/components/commerce/ProductCard';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { AppImage } from '@/components/shared/AppImage';
import Link from 'next/link';
import { HOME_CATEGORIES, HOME_PRODUCTS } from '@/components/home/home-data';

export function CatalogHighlights() {
  return (
    <>
      <section className="section-space">
        <div className="section-container">
          <div className="flex justify-between items-end mb-16 px-4">
            <div className="flex flex-col gap-4">
              <span className="tech-label">Catálogo</span>
              <h2 className="text-5xl lg:text-7xl font-serif tracking-tight text-ruah-950 uppercase italic font-black leading-none">Nossas Frentes.</h2>
            </div>
            <Link href="/shop" className="bg-ruah-950 text-white rounded-full px-8 py-3 text-xs font-bold uppercase tracking-[0.1em] hover:bg-accent-gold transition-all shadow-lg hover:-translate-y-1">
              Ver Tudo
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOME_CATEGORIES.map((cat) => (
              <Link key={cat.name} href={cat.link} className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-subtle" style={{ position: 'relative' }}>
                <AppImage context="product-thumb" src={cat.image} alt={cat.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-ruah-950/80 via-ruah-950/20 to-transparent flex items-end p-10">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex flex-col">
                      <span className="text-accent-gold text-xs font-bold uppercase tracking-[0.1em] mb-1 opacity-0 group-hover:opacity-100 transition-opacity">Explorar</span>
                      <span className="text-white font-bold text-2xl uppercase tracking-tighter">{cat.name}</span>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all shadow-xl">
                      <ChevronRight size={22} className="text-ruah-950" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space bg-white">
        <div className="section-container">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 px-4 gap-8">
            <div className="flex flex-col gap-4">
              <span className="tech-label text-accent-gold">Drops Exclusivos</span>
              <h2 className="text-5xl lg:text-7xl font-serif tracking-tight text-ruah-950 uppercase italic font-black leading-none">Lançamentos <br /> Recentes.</h2>
            </div>
            <p className="text-[11px] font-bold text-ruah-400 uppercase tracking-[0.2em] max-w-xs leading-relaxed">
              As últimas expressões de fé traduzidas em design. Cada peça é um novo capítulo da nossa jornada.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {HOME_PRODUCTS.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          <div className="mt-24 flex justify-center">
            <Link href="/shop" className="group flex items-center gap-6">
              <div className="w-16 h-16 rounded-full border border-ruah-100 flex items-center justify-center group-hover:border-accent-gold group-hover:bg-accent-gold transition-all duration-500">
                <ArrowRight size={24} className="text-ruah-950 group-hover:text-white transition-colors" />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-ruah-950 group-hover:text-accent-gold transition-colors">Explorar Coleção Completa</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}



