'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ArrowUpRight, History, Compass, TrendingUp } from 'lucide-react';
import { AppImage } from '@/components/shared/AppImage';
import Link from 'next/link';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { BRAND_SEARCH_BANNERS, BRAND_SEARCH_SUGGESTIONS, getBrandProductVisual } from '@/lib/brand-assets';
import { searchBrandProducts } from '@/lib/brand-discovery';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResultItem {
  id: string;
  name: string;
  category: string;
  reason?: string;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const [query, setQuery] = React.useState('');
  const [recentSearches] = React.useState(['Oração', 'Campanhas', 'Acessórios']);
  const deferredQuery = React.useDeferredValue(query);

  const guidedResults = React.useMemo<SearchResultItem[]>(() => {
    if (deferredQuery.length < 3) return [];

    try {
      return searchBrandProducts(deferredQuery).map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        reason: item.reason,
      }));
    } catch (error) {
      console.error('Guided search error:', error);
      return [];
    }
  }, [deferredQuery]);

  const isSearching = query.length >= 3 && deferredQuery !== query;
  const resultsToDisplay = query.length < 3 ? BRAND_SEARCH_SUGGESTIONS : guidedResults;

  useFocusTrap({
    active: isOpen,
    containerRef: overlayRef,
    onEscape: onClose,
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white z-modal flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Busca guiada"
          ref={overlayRef}
          tabIndex={-1}
        >
          <div className="section-container pt-12">
            <div className="flex justify-between items-center mb-12">
              <span className="font-serif text-2xl uppercase tracking-tighter">Exploração Ruah</span>
              <button onClick={onClose} className="p-4 hover:bg-ruah-50 rounded-full transition-colors flex items-center gap-3 group">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] opacity-50 group-hover:opacity-100 transition-opacity">Fechar</span>
                <X size={24} />
              </button>
            </div>

            <div className="relative group">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-ruah-400 group-focus-within:text-accent-gold transition-colors" size={32} />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Qual o seu chamado artístico hoje?"
                className="w-full bg-transparent border-b-2 border-ruah-100 py-8 pl-16 text-3xl font-serif focus:outline-none focus:border-accent-gold transition-all lowercase placeholder:text-ruah-200"
              />
              {isSearching ? (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-3">
                  <Compass size={20} className="text-accent-gold animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold">Refinando combinações...</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="section-container flex-1 overflow-hidden flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 flex-1 overflow-y-auto py-16 pb-28">
              <div className="lg:col-span-8 flex flex-col gap-10">
                <div className="flex justify-between items-end">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ruah-400">
                    {query.length < 3 ? 'Sugestões de propósito' : guidedResults.length > 0 ? 'Conexões identificadas' : 'Sem conexão direta'}
                  </h3>
                </div>

                {resultsToDisplay.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {resultsToDisplay.map((item, index) => {
                      const visual = getBrandProductVisual(item.id);

                      return (
                        <motion.div
                          key={`${item.id}-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Link href={`/product/${item.id}`} onClick={onClose} className="flex gap-6 group bg-ruah-50/30 p-4 rounded-[2rem] border border-transparent hover:border-ruah-100 hover:bg-white transition-all shadow-sm">
                            <div className="relative w-28 h-36 rounded-2xl overflow-hidden shrink-0 bg-ruah-100">
                              <AppImage context="content-banner" src={visual.image} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                            </div>
                            <div className="flex flex-col justify-center gap-2">
                              <span className="text-xs font-semibold text-accent-gold uppercase tracking-[0.1em]">{item.category}</span>
                              <h4 className="text-xl font-serif italic group-hover:text-accent-gold transition-colors leading-tight">{item.name}</h4>
                              {item.reason ? <p className="text-sm text-ruah-500 font-medium leading-relaxed mt-1">{item.reason}</p> : null}
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ruah-400 group-hover:text-ruah-950 transition-colors mt-2">
                                Ver detalhes <ArrowUpRight size={14} />
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : query.length >= 3 && !isSearching ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                    <p className="text-sm font-serif italic text-ruah-400">Nenhum resultado direto. Tente termos como “presença”, “autoral” ou “ecobag”.</p>
                  </div>
                ) : null}

                {query.length < 2 ? (
                  <div className="mt-10 pt-10 border-t border-ruah-50">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ruah-400 mb-6">Navegação visual</h3>
                    <div className="grid grid-cols-2 gap-6">
                      {BRAND_SEARCH_BANNERS.map((banner, index) => (
                        <Link key={index} href="/shop" onClick={onClose} className="relative aspect-[16/6] rounded-[2.5rem] overflow-hidden group">
                          <AppImage context="content-banner" src={banner.image} alt={banner.title} fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
                          <div className="absolute inset-0 bg-ruah-950/30 flex items-center justify-between px-8">
                            <div className="text-white">
                              <span className="text-xs font-semibold uppercase tracking-[0.1em] block mb-2 text-accent-gold">{banner.tag}</span>
                              <h4 className="text-2xl font-serif italic">{banner.title}</h4>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-ruah-950 -rotate-45 group-hover:rotate-0 transition-transform">
                              <ArrowUpRight size={20} />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="lg:col-span-4 flex flex-col gap-12 border-l border-ruah-100 pl-12 lg:block hidden">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ruah-400 mb-6 flex items-center gap-2">
                    <History size={14} /> Histórico recente
                  </h3>
                  <div className="flex flex-col gap-3">
                    {recentSearches.map((term) => (
                      <button key={term} onClick={() => setQuery(term)} className="text-left text-sm font-serif italic text-ruah-950 hover:text-accent-gold transition-colors">
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ruah-400 mb-6 flex items-center gap-2">
                    <TrendingUp size={14} /> Leituras Ruah
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {['Oração', 'Presença', 'Campanhas', 'Manifesto', 'Serena'].map((tag) => (
                      <button key={tag} onClick={() => setQuery(tag)} className="px-5 py-2 border border-ruah-100 rounded-full text-xs font-semibold uppercase tracking-[0.08em] hover:border-accent-gold hover:text-accent-gold transition-all">
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
