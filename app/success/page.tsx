'use client';

import React from 'react';
import { Header } from '@/components/navigation/Header';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, Package, Mail, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function SuccessPage() {
  const [orderNumber] = React.useState(() => Math.floor(Math.random() * 900000) + 100000);

  return (
    <main className="bg-white min-h-screen pb-40 font-sans page-header-offset">
      <Header />
      
      <div className="pt-12 section-container flex flex-col items-center text-center">
         <motion.div
           initial={{ scale: 0.5, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-8"
         >
           <CheckCircle2 size={48} />
         </motion.div>

         <h1 className="text-6xl font-serif italic tracking-tighter uppercase mb-4">Pedido <span className="text-accent-gold">Confirmado.</span></h1>
         <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-ruah-400 mb-12">Obrigado pela sua confiança — sua arte está a caminho.</p>

         <div className="bg-ruah-50 p-12 rounded-[3.5rem] border border-ruah-100 w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-12 text-left mb-16 shadow-fancy">
            <div className="flex flex-col gap-4">
               <span className="tech-label text-accent-gold">Detalhes do Pedido</span>
               <div>
                  <span className="text-[10px] text-ruah-400 font-bold uppercase tracking-widest block mb-1">Número</span>
                  <span className="text-xl font-mono font-bold text-ruah-950">#RUAH-{orderNumber}</span>
               </div>
               <div>
                  <span className="text-[10px] text-ruah-400 font-bold uppercase tracking-widest block mb-1">Status</span>
                  <span className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase tracking-widest">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Pagamento Aprovado
                  </span>
               </div>
            </div>
            <div className="flex flex-col gap-6">
               <div className="flex items-start gap-3">
                  <Mail size={16} className="text-ruah-300 shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-ruah-950">
                     Um e-mail de confirmação foi enviado para seu endereço cadastrado.
                  </p>
               </div>
               <div className="flex items-start gap-3">
                  <Calendar size={16} className="text-ruah-300 shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-ruah-950">
                     Previsão de entrega: 5-7 dias úteis.
                  </p>
               </div>
               <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-ruah-300 shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-ruah-950">
                     Rastreamento disponível via WhatsApp Ruah em 24h.
                  </p>
               </div>
            </div>
         </div>

          <div className="flex flex-col md:flex-row gap-6">
            <Link href="/" className="bg-ruah-950 text-white px-12 py-5 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-accent-gold transition-all flex items-center justify-center gap-3 shadow-xl">
               Voltar para Início
            </Link>
            <Link 
              href={`https://tracker.useruah.com.br/RUAH-${orderNumber}`}
              target="_blank"
              className="bg-white border border-ruah-100 px-12 py-5 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] hover:border-ruah-950 transition-all flex items-center justify-center gap-3"
            >
               Acompanhar Sopro <ArrowRight size={16} />
            </Link>
         </div>

         <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-12 text-left border-t border-ruah-100 pt-20">
            <div className="flex flex-col gap-4">
               <Package className="text-accent-gold mb-2" />
               <h4 className="text-[10px] font-black uppercase tracking-widest text-ruah-950">Pack Respiro</h4>
               <p className="text-[10px] font-bold text-ruah-400 uppercase tracking-widest leading-relaxed">
                  Sua peça será entregue em nossa embalagem minimalista com fragrância exclusiva.
               </p>
            </div>
            <div className="flex flex-col gap-4">
               <MapPin className="text-accent-gold mb-2" />
               <h4 className="text-[10px] font-black uppercase tracking-widest text-ruah-950">Logística de Fé</h4>
               <p className="text-[10px] font-bold text-ruah-400 uppercase tracking-widest leading-relaxed">
                  Utilizamos transportadoras que respeitam o tempo e a integridade da arte.
               </p>
            </div>
            <div className="flex flex-col gap-4">
               <CheckCircle2 className="text-accent-gold mb-2" />
               <h4 className="text-[10px] font-black uppercase tracking-widest text-ruah-950">Garantia Ruah</h4>
               <p className="text-[10px] font-bold text-ruah-400 uppercase tracking-widest leading-relaxed">
                  Compromisso total com a qualidade do tecido e a perfeição da estampa.
               </p>
            </div>
         </div>
      </div>
    </main>
  );
}
