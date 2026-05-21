'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/navigation/Header';
import { ArrowRight, Search, Home, ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white page-header-offset">
      <Header />
      <div className="section-container min-h-[70vh] flex flex-col items-center justify-center text-center">
         
         <div className="relative mb-12">
            <span className="text-[20vw] font-serif font-black leading-none text-ruah-50 select-none uppercase">RUAH</span>
            <div className="absolute inset-0 flex items-center justify-center">
               <h1 className="text-4xl lg:text-6xl font-serif italic uppercase tracking-tighter">O sopro não chegou aqui.</h1>
            </div>
         </div>

         <p className="max-w-md text-sm font-medium uppercase tracking-[0.2em] text-ruah-400 leading-relaxed mb-16">
            O caminho que você procura ainda está sendo trilhado ou não existe. Deixe-nos guiá-lo de volta para a comunidade.
         </p>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            <Link href="/" className="group p-10 bg-ruah-50 rounded-[2.5rem] border border-ruah-100 hover:border-accent-gold transition-all flex flex-col items-center gap-6">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-accent-gold">
                  <Home size={20} />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest">Início</span>
            </Link>

            <Link href="/shop" className="group p-10 bg-ruah-50 rounded-[2.5rem] border border-ruah-100 hover:border-accent-gold transition-all flex flex-col items-center gap-6">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-accent-gold">
                  <ShoppingBag size={20} />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest">Ver Coleção</span>
            </Link>

            <div className="group p-10 bg-ruah-50 rounded-[2.5rem] border border-ruah-100 hover:border-accent-gold transition-all flex flex-col items-center gap-6 cursor-pointer">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-accent-gold">
                  <Search size={20} />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest">Falar com Concierge</span>
            </div>
         </div>

         <div className="mt-20">
            <Link href="/" className="flex items-center gap-3 text-accent-gold font-bold uppercase text-[10px] tracking-[0.3em] group">
               Voltar para o Rebanho <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </Link>
         </div>

      </div>
    </main>
  );
}
