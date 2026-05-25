'use client';

import React from 'react';

interface StickyMobileBarProps {
  price: number;
}

export function StickyMobileBar({ price }: StickyMobileBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-ruah-100 p-4 lg:hidden flex items-center justify-between shadow-2xl">
       <div className="flex flex-col">
          <span className="text-xs font-bold text-ruah-300 uppercase tracking-[0.1em]">Preco Individual</span>
          <span className="text-lg font-serif italic text-accent-gold font-bold">R$ {price.toLocaleString('pt-BR')}</span>
       </div>
       <button 
         className="bg-ruah-950 text-white px-8 py-4 rounded-xl font-bold uppercase text-xs tracking-[0.1em] active:scale-95 transition-all"
         onClick={() => {
           window.scrollTo({ top: 0, behavior: 'smooth' });
         }}
       >
          Adicionar Itens
       </button>
    </div>
  );
}


