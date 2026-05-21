'use client';

import React from 'react';
import { Header } from '@/components/navigation/Header';
import { Trash2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CartPage() {
  return (
    <main className="bg-ruah-25 min-h-screen pb-32 font-sans page-header-offset">
      <Header />
      
      <div className="pt-8 pb-16">
        <div className="section-container">
           <div className="flex items-center gap-2 mb-2">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-gold">Seu Respiro</span>
             <div className="w-1 h-1 rounded-full bg-ruah-200" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-ruah-400">Seleção de Arte</span>
           </div>
           <h1 className="text-5xl font-serif font-black tracking-tighter text-ruah-950 uppercase italic">Carrinho de <span className="text-accent-gold">Compras.</span></h1>
        </div>
      </div>

      <section className="section-container grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* Items List */}
        <div className="lg:col-span-8 space-y-8">
           {[1, 2].map(item => (
             <div key={item} className="flex gap-8 pb-8 border-b border-ruah-100 group bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all">
                <div className="relative w-32 aspect-square bg-ruah-50 rounded-2xl overflow-hidden shrink-0 border border-ruah-100 group-hover:border-accent-gold transition-colors">
                   <Image 
                     src={`https://picsum.photos/seed/cart-${item}/400/400`}
                     alt="Product"
                     fill
                     className="object-cover group-hover:scale-110 transition-transform duration-700"
                     referrerPolicy="no-referrer"
                   />
                </div>
                <div className="flex-1 flex flex-col justify-between py-2">
                   <div>
                      <div className="flex justify-between items-start mb-2">
                         <h3 className="font-black text-xl text-ruah-950 uppercase tracking-tight">Peça de Sopro Pro {item}</h3>
                         <span className="font-mono font-bold text-accent-gold">R$ 3.490,00</span>
                      </div>
                      <div className="flex gap-4 text-[10px] uppercase font-black text-ruah-400 tracking-widest">
                         <span>Black Edition</span>
                         <span className="text-accent-gold">•</span>
                         <span>Arte Autoral</span>
                         <span className="text-accent-gold">•</span>
                         <span>Soprado sob Demanda</span>
                      </div>
                   </div>
                   
                   <div className="flex items-center justify-between mt-8">
                      <div className="flex items-center border border-ruah-100 rounded-xl p-2 gap-6 bg-ruah-25/50">
                         <button className="w-8 h-8 rounded-lg flex items-center justify-center text-ruah-400 hover:text-accent-gold hover:bg-white transition-all">-</button>
                         <span className="text-xs font-mono font-black text-ruah-950">1</span>
                         <button className="w-8 h-8 rounded-lg flex items-center justify-center text-ruah-400 hover:text-accent-gold hover:bg-white transition-all">+</button>
                      </div>
                      <button className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-ruah-300 hover:text-red-500 transition-colors py-2 px-4 hover:bg-red-50 rounded-xl">
                        <Trash2 size={14} /> Remover Arte
                      </button>
                   </div>
                </div>
             </div>
           ))}

           <div className="bg-ruah-950 text-white p-8 flex items-start gap-6 rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-full bg-accent-gold/10 blur-3xl" />
              <AlertCircle className="text-accent-gold shrink-0 mt-1" size={24} />
              <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-gold mb-2">Compromisso Ruah</h4>
                <p className="text-xs text-ruah-400 font-medium uppercase tracking-widest leading-loose">
                  Esta peça entra em produção artesanal no Módulo 4 (Parceiro) imediatamente após o Handover. 
                  O tempo de cura e sopro garante a energia exclusiva da sua peça autoral.
                </p>
              </div>
           </div>
        </div>

        {/* Summary Box */}
        <div className="lg:col-span-4">
           <div className="bg-white p-10 rounded-[3rem] sticky top-32 border border-ruah-100 shadow-fancy">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-ruah-300 mb-10 pb-4 border-b border-ruah-50">Resumo da Arte</h2>
              
              <div className="space-y-4 mb-10">
                 <div className="flex justify-between text-xs uppercase font-bold tracking-widest">
                    <span className="text-ruah-500">Subtotal</span>
                    <span className="font-mono font-bold text-ruah-950">R$ 6.980,00</span>
                 </div>
                 <div className="flex justify-between text-xs uppercase font-bold tracking-widest">
                    <span className="text-ruah-500">Fluxo de Entrega</span>
                    <span className="font-mono text-green-600 font-bold uppercase tracking-[0.2em]">Grátis (Sopro de Fé)</span>
                 </div>
                 <div className="flex justify-between text-xs uppercase font-bold tracking-widest">
                    <span className="text-ruah-500">Taxa Operacional</span>
                    <span className="font-mono font-bold text-ruah-950">R$ 45,00</span>
                 </div>
              </div>

              <div className="flex justify-between items-end mb-12 pt-8 border-t border-ruah-50">
                 <span className="font-black text-sm uppercase tracking-widest text-ruah-950">Total Final</span>
                 <div className="text-right">
                    <div className="text-4xl font-serif italic font-black text-accent-gold">R$ 7.025,00</div>
                    <div className="text-[9px] text-ruah-400 font-bold uppercase tracking-[0.2em] mt-2">Até 10x de R$ 702,50</div>
                 </div>
              </div>

              <Link href="/checkout" className="w-full bg-ruah-950 text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-accent-gold shadow-2xl shadow-ruah-950/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] group">
                 Validar Handover <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </Link>

              <div className="mt-10 pt-10 border-t border-ruah-50">
                 <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-ruah-400">
                    <ShieldCheck size={16} className="text-green-500" /> Transação Protegida Protocolo Ruah
                 </div>
              </div>
           </div>
        </div>

      </section>
    </main>
  );
}
