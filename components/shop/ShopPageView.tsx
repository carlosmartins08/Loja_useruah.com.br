'use client';

import React, { useMemo, useState } from 'react';
import { Header } from '@/components/navigation/Header';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { ProductCard } from '@/components/commerce/ProductCard';
import { ChevronDown, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SHOP_CATEGORIES, SHOP_SEGMENTS, ShopCategory, ShopProduct, ShopSegment } from '@/components/shop/shop-data';

interface ShopPageViewProps {
  products: ShopProduct[];
}

export function ShopPageView({ products }: ShopPageViewProps) {
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('All');
  const [activeSegment, setActiveSegment] = useState<ShopSegment>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCategory !== 'All') list = list.filter((p) => p.category === activeCategory);
    if (activeSegment !== 'All') list = list.filter((p) => p.segment === activeSegment);
    return list;
  }, [activeCategory, activeSegment, products]);
  const hasActiveFilters = activeCategory !== 'All' || activeSegment !== 'All';

  const clearFilters = () => {
    setActiveCategory('All');
    setActiveSegment('All');
  };

  return (
    <main className="bg-white min-h-screen page-header-offset">
      <Header />

      <section className="pt-12 pb-16 bg-white">
        <div className="section-container">
          <Breadcrumbs items={[{ label: 'Coleção' }]} className="mb-12 text-accent-gold" />

          <div className="flex flex-col gap-16">
            <div className="max-w-3xl">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-gold mb-6 block">Ecossistema UseRuah 2026</span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif leading-[0.9] tracking-tight uppercase mb-6 italic font-black text-ruah-950 opacity-95">
                O SOPRO <br /> DA ARTE.
              </h1>
              <p className="text-sm font-medium text-ruah-500 max-w-xl leading-relaxed">
                Direcionando sua jornada entre volume recorrente e peças autênticas de design exclusivo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SHOP_SEGMENTS.map((seg) => (
                <button
                  key={seg.id}
                  onClick={() => {
                    setActiveSegment(seg.id);
                    setActiveCategory('All');
                  }}
                  className={`group p-8 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-3 ${
                    activeSegment === seg.id ? 'border-ruah-950 bg-ruah-950 text-white shadow-xl translate-y-[-4px]' : 'border-ruah-100 hover:border-accent-gold hover:bg-ruah-50'
                  }`}
                >
                  <span className={`text-xs font-semibold uppercase tracking-[0.12em] ${activeSegment === seg.id ? 'text-accent-gold' : 'text-ruah-300'}`}>
                    {seg.id === 'All' ? 'Filtro Global' : seg.id === 'Base' ? 'Segmento A' : 'Segmento B'}
                  </span>
                  <h3 className="text-xl font-serif italic uppercase leading-none">{seg.label}</h3>
                  <p className={`text-sm font-medium leading-relaxed ${activeSegment === seg.id ? 'text-white/70' : 'text-ruah-500'}`}>{seg.detail}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="bg-ruah-50/50 border-y border-ruah-100 py-6">
        <div className="section-container">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400 mb-3 md:hidden">Deslize para ver mais categorias</p>
          <div className="flex flex-nowrap md:flex-wrap gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide snap-x">
            {SHOP_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-3 rounded-full text-xs font-semibold uppercase tracking-[0.1em] transition-all whitespace-nowrap snap-start ${
                  activeCategory === cat ? 'bg-accent-gold text-white shadow-lg' : 'bg-white text-ruah-400 border border-ruah-100 hover:border-accent-gold hover:text-accent-gold'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky top-[64px] z-30 bg-white/95 backdrop-blur-md border-b border-ruah-100 py-3 shadow-sm transition-all duration-300">
        <div className="section-container flex justify-between items-center">
          <div className="flex items-center gap-8">
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] hover:text-accent-gold transition-colors text-ruah-950">
              <SlidersHorizontal size={14} className="text-accent-gold" />
              Filtros de Propósito
            </button>
            <div className="h-4 w-px bg-ruah-100 hidden sm:block" />
            <span className="text-xs font-mono text-ruah-500 hidden sm:block">{filteredProducts.length} peças encontradas</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 border-r border-ruah-100 pr-6">
              <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors rounded-lg ${viewMode === 'grid' ? 'bg-ruah-50 text-accent-gold' : 'text-ruah-300 hover:text-ruah-950 hover:bg-ruah-50'}`}>
                <LayoutGrid size={16} />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 transition-colors rounded-lg ${viewMode === 'list' ? 'bg-ruah-50 text-accent-gold' : 'text-ruah-300 hover:text-ruah-950 hover:bg-ruah-50'}`}>
                <List size={16} />
              </button>
            </div>
            <button className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-ruah-950 hover:text-accent-gold transition-colors">
              Ordenar por <ChevronDown size={14} />
            </button>
          </div>
        </div>
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="section-container mt-3 pb-3"
            >
              <div className="rounded-2xl border border-ruah-100 bg-ruah-50/70 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ruah-400">Filtros ativos:</span>
                  <span className="px-3 py-1 rounded-full bg-white border border-ruah-100 text-[10px] font-bold uppercase tracking-[0.1em] text-ruah-700">Segmento: {activeSegment}</span>
                  <span className="px-3 py-1 rounded-full bg-white border border-ruah-100 text-[10px] font-bold uppercase tracking-[0.1em] text-ruah-700">Categoria: {activeCategory}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="px-4 py-2 rounded-xl border border-ruah-100 bg-white text-[10px] font-bold uppercase tracking-[0.1em] text-ruah-600 disabled:opacity-50 disabled:cursor-not-allowed hover:border-accent-gold hover:text-accent-gold transition-colors"
                  >
                    Limpar filtros
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <section className="py-20">
        <div className="section-container">
          {filteredProducts.length === 0 ? (
            <div className="rounded-[2rem] border border-ruah-100 bg-ruah-50/60 p-10 text-center flex flex-col items-center gap-5">
              <h2 className="text-2xl font-serif italic uppercase text-ruah-950">Nenhuma peca encontrada.</h2>
              <p className="text-sm font-medium text-ruah-500 max-w-xl">
                Tente outra combinacao de filtros ou volte para o catalogo completo.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 rounded-xl bg-ruah-950 text-white text-xs font-bold uppercase tracking-[0.1em] hover:bg-accent-gold transition-colors"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          ) : (
            <div className={`grid gap-x-8 gap-y-16 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <motion.div key={product.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4 }}>
                    <ProductCard {...product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <div className="mt-32 flex flex-col items-center gap-8">
            <div className="w-1.5 h-1.5 bg-accent-gold rounded-full animate-bounce" />
            <button className="text-[10px] font-bold uppercase tracking-[0.4em] text-ruah-950 border-b-2 border-ruah-950 pb-2 hover:text-accent-gold hover:border-accent-gold transition-all">
              Ver Mais Arte
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}


