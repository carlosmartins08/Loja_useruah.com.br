'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Search, Sparkles, X, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppImage } from '@/components/shared/AppImage';
import Link from 'next/link';
import { useFocusTrap } from '@/hooks/use-focus-trap';

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

interface SearchResult {
  id: string;
  name: string;
  relevance: string;
}

const FALLBACK_RESULTS: SearchResult[] = [
  { id: '1', name: 'Camiseta Respiro', relevance: 'Essencial para uso diÃ¡rio com mensagem sutil.' },
  { id: '2', name: 'Moletom FÃ© Viva', relevance: 'Indicado para conforto e presenÃ§a visual.' },
  { id: '4', name: 'Camiseta GeraÃ§Ã£o', relevance: 'Boa escolha para proposta de impacto.' },
];

export function SmartSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useFocusTrap({
    active: isOpen,
    containerRef: modalRef,
    onEscape: onClose,
  });

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      if (!ai) {
        const normalized = val.toLowerCase();
        setResults(
          FALLBACK_RESULTS.filter(
            (item) =>
              item.name.toLowerCase().includes(normalized) ||
              item.relevance.toLowerCase().includes(normalized)
          )
        );
        return;
      }

      const prompt = `VocÃª Ã© um curador de estilo da UseRuah. 
      Analise o pedido do cliente: "${val}".
      
      Produtos disponÃ­veis:
      1. Camiseta Respiro (Puro AlgodÃ£o, Essencial, Minimalista)
      2. Moletom FÃ© Viva (Conforto, Campanha, mensagem forte)
      3. Bolsa Sopro (AcessÃ³rio, PrÃ¡tico, para o dia a dia)
      4. Camiseta GeraÃ§Ã£o (Arte autoral, Manifesto, Impactante)
      5. Almofada Paz (Home, Conforto, para momentos de oraÃ§Ã£o)
      6. Botton SÃ­mbolo (AcessÃ³rio, Pequeno detalhe de fÃ©)

      Retorne APENAS um array JSON de objetos com {id, name, relevance} onde id Ã© o nÃºmero do produto (1-6) e relevance Ã© uma frase curta explicando por que esse produto atende ao pedido.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                relevance: { type: Type.STRING }
              }
            }
          }
        }
      });

      const data = JSON.parse(response.text || '[]');
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Gemini Search Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-modal bg-white/80 backdrop-blur-3xl flex flex-col pt-32"
          role="dialog"
          aria-modal="true"
          aria-label="Busca semântica"
          ref={modalRef}
          tabIndex={-1}
        >
          <div className="section-container max-w-4xl">
             <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-3">
                   <Sparkles size={20} className="text-accent-gold" />
                   <span className="tech-label text-accent-gold">Busca SemÃ¢ntica Ruah</span>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-ruah-50 rounded-full transition-colors">
                   <X size={24} />
                </button>
             </div>

             <div className="relative group">
                <Search size={32} className="absolute left-0 top-1/2 -translate-y-1/2 text-ruah-100 group-focus-within:text-accent-gold transition-colors" />
                <input 
                  ref={inputRef}
                  type="text" 
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Qual o seu chamado artÃ­stico hoje?"
                  className="w-full bg-transparent border-b-2 border-ruah-100 py-8 pl-16 text-4xl lg:text-5xl font-serif italic outline-none focus:border-accent-gold transition-all"
                />
                {isLoading && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <Loader2 size={24} className="animate-spin text-accent-gold" />
                  </div>
                )}
             </div>

             <div className="mt-20">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-ruah-300 mb-12">
                   {results.length > 0 ? 'ConexÃµes Recomendadas' : 'Tente buscar por "moletom para retiro" ou "presente para afilhado"'}
                </h3>

                <div className="grid grid-cols-1 gap-12">
                   {results.map((res, i) => (
                      <motion.div 
                        key={res.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                         <Link 
                           href={`/product/${res.id}`} 
                           onClick={onClose}
                           className="flex items-center gap-8 group"
                         >
                            <div className="relative w-32 h-32 rounded-3xl overflow-hidden bg-ruah-50 shrink-0">
                               <AppImage context="content-banner" 
                                 src={`https://picsum.photos/seed/p${res.id}/400/400`} 
                                 alt={res.name} 
                                 fill 
                                 className="object-cover group-hover:scale-110 transition-transform duration-700" 
                               />
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                               <div className="flex items-center gap-4">
                                  <h4 className="text-2xl font-serif uppercase">{res.name}</h4>
                                  <span className="tech-label text-accent-gold text-[8px]">Inspirado por Ruah</span>
                               </div>
                               <p className="text-sm text-ruah-400 font-medium uppercase tracking-widest leading-relaxed">
                                  {res.relevance}
                                </p>
                               <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-accent-gold mt-2">
                                  Ver Detalhes do Produto <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                               </div>
                            </div>
                         </Link>
                      </motion.div>
                   ))}
                </div>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

