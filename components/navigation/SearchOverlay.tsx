'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ArrowUpRight, History, Compass, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppImage } from '@/components/shared/AppImage';
import { OverlayPortal } from '@/components/shared/OverlayPortal';
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
  const router = useRouter();
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const [query, setQuery] = React.useState('');
  const [recentSearches] = React.useState(['Oracao', 'Campanhas', 'Acessorios']);
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

  const handleNavigate = (href: string) => {
    router.push(href);
    onClose();
  };

  useFocusTrap({
    active: isOpen,
    containerRef: overlayRef,
    onEscape: onClose,
  });

  React.useEffect(() => {
    if (!isOpen) return;
    overlayRef.current?.scrollTo({ top: 0 });
  }, [isOpen, query]);

  return (
    <OverlayPortal>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-modal overflow-y-auto bg-white"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Busca guiada"
            ref={overlayRef}
            tabIndex={-1}
          >
            <div className="section-container pt-12" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between gap-6 mb-12">
                <span className="font-serif text-2xl uppercase tracking-tighter">Exploracao Ruah</span>
                <button type="button" onClick={onClose} className="flex items-center gap-3 rounded-full p-4 transition-colors hover:bg-ruah-50 group">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] opacity-50 transition-opacity group-hover:opacity-100">Fechar</span>
                  <X size={24} />
                </button>
              </div>

              <div className="relative group">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-ruah-400 transition-colors group-focus-within:text-accent-gold" size={32} />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Qual o seu chamado artistico hoje?"
                  className="w-full border-b-2 border-ruah-100 bg-transparent py-8 pl-16 text-3xl font-serif lowercase transition-all placeholder:text-ruah-200 focus:border-accent-gold focus:outline-none"
                />
                {isSearching ? (
                  <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-3">
                    <Compass size={20} className="animate-pulse text-accent-gold" />
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold">Refinando combinacoes...</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="section-container flex min-h-[calc(100vh-10rem)] flex-col pb-20" onClick={(event) => event.stopPropagation()}>
              <div className="grid flex-1 grid-cols-1 gap-16 overflow-y-auto py-16 pb-28 lg:grid-cols-12">
                <div className="flex flex-col gap-10 lg:col-span-8">
                  <div className="flex items-end justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ruah-400">
                      {query.length < 3 ? 'Sugestoes de proposito' : guidedResults.length > 0 ? 'Conexoes identificadas' : 'Sem conexao direta'}
                    </h3>
                  </div>

                  {resultsToDisplay.length > 0 ? (
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      {resultsToDisplay.map((item, index) => {
                        const visual = getBrandProductVisual(item.id);

                        return (
                          <motion.div
                            key={`${item.id}-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <button
                              type="button"
                              onClick={() => handleNavigate(`/product/${item.id}`)}
                              className="group flex w-full gap-6 rounded-[2rem] border border-transparent bg-ruah-50/30 p-4 text-left shadow-sm transition-all hover:border-ruah-100 hover:bg-white"
                            >
                              <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-2xl bg-ruah-100">
                                <AppImage context="content-banner" src={visual.image} alt={item.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                              </div>
                              <div className="flex flex-col justify-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold">{item.category}</span>
                                <h4 className="text-xl font-serif italic leading-tight transition-colors group-hover:text-accent-gold">{item.name}</h4>
                                {item.reason ? <p className="mt-1 text-sm font-medium leading-relaxed text-ruah-500">{item.reason}</p> : null}
                                <div className="mt-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ruah-400 transition-colors group-hover:text-ruah-950">
                                  Ver detalhes <ArrowUpRight size={14} />
                                </div>
                              </div>
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : query.length >= 3 && !isSearching ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                      <p className="text-sm font-serif italic text-ruah-400">Nenhum resultado direto. Tente termos como &quot;presenca&quot;, &quot;autoral&quot; ou &quot;ecobag&quot;.</p>
                    </div>
                  ) : null}

                  {query.length < 2 ? (
                    <div className="mt-10 border-t border-ruah-50 pt-10">
                      <h3 className="mb-6 text-xs font-semibold uppercase tracking-[0.14em] text-ruah-400">Navegacao visual</h3>
                      <div className="grid grid-cols-2 gap-6">
                        {BRAND_SEARCH_BANNERS.map((banner, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleNavigate('/shop')}
                            className="group relative aspect-[16/6] overflow-hidden rounded-[2.5rem] text-left"
                          >
                            <AppImage context="content-banner" src={banner.image} alt={banner.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                            <div className="absolute inset-0 flex items-center justify-between bg-ruah-950/30 px-8">
                              <div className="text-white">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold">{banner.tag}</span>
                                <h4 className="text-2xl font-serif italic">{banner.title}</h4>
                              </div>
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ruah-950 transition-transform group-hover:rotate-0 -rotate-45">
                                <ArrowUpRight size={20} />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="hidden flex-col gap-12 border-l border-ruah-100 pl-12 lg:block lg:col-span-4">
                  <div>
                    <h3 className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ruah-400">
                      <History size={14} /> Historico recente
                    </h3>
                    <div className="flex flex-col gap-3">
                      {recentSearches.map((term) => (
                        <button key={term} onClick={() => setQuery(term)} className="text-left text-sm font-serif italic text-ruah-950 transition-colors hover:text-accent-gold">
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ruah-400">
                      <TrendingUp size={14} /> Leituras Ruah
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {['Oracao', 'Presenca', 'Campanhas', 'Manifesto', 'Serena'].map((tag) => (
                        <button key={tag} onClick={() => setQuery(tag)} className="rounded-full border border-ruah-100 px-5 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-all hover:border-accent-gold hover:text-accent-gold">
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  );
}
