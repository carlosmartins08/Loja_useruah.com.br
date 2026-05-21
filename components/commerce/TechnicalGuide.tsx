'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Ruler, Maximize, Scissors, AlertTriangle, CheckCircle2, Factory, ArrowRight } from 'lucide-react';

export function TechnicalGuide() {
  return (
    <div className="bg-white border border-ruah-100 rounded-[2.5rem] shadow-2xl overflow-hidden font-sans">
       {/* Header */}
       <div className="p-12 bg-ruah-950 text-white flex flex-col gap-8 relative">
          <div className="absolute top-0 right-0 w-40 h-full bg-accent-gold/10 blur-3xl" />
          <div className="flex items-center gap-5 relative z-10">
             <div className="w-12 h-12 bg-accent-gold rounded-2xl flex items-center justify-center text-white shadow-fancy">
                <Ruler size={24} />
             </div>
             <div>
                <h3 className="text-3xl font-serif italic uppercase leading-none">GUIA TÉCNICO DE <br /> <span className="text-accent-gold">VESTE & CORTE.</span></h3>
                <span className="text-[10px] font-black text-accent-gold uppercase tracking-[0.3em] mt-2 block">Sopro de Precisão</span>
             </div>
          </div>
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest leading-relaxed max-w-xl">
             Cada peça Ruah é soprada exclusivamente sob demanda. Para evitar o desperdício e garantir o caimento perfeito da sua arte, utilize nosso guia de medidas artesanais.
          </p>
       </div>

       {/* Content */}
       <div className="p-12 flex flex-col gap-12">
          
          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
             <div className="flex flex-col gap-4">
                <span className="text-[9px] font-black text-accent-gold uppercase tracking-widest">01. Consciência Corporal</span>
                <h4 className="text-sm font-black uppercase tracking-tight text-ruah-950">Meça o corpo, não a peça</h4>
                <p className="text-[10px] font-bold text-ruah-400 uppercase tracking-widest leading-loose">
                   Utilize uma fita métrica firme ao corpo. Como nossas tramas são naturais, considere um respiro de 1cm para maior conforto.
                </p>
             </div>
             <div className="flex flex-col gap-4">
                <span className="text-[9px] font-black text-accent-gold uppercase tracking-widest">02. Caimento & Alma</span>
                <h4 className="text-sm font-black uppercase tracking-tight text-ruah-950">Dinâmica do Tear</h4>
                <p className="text-[10px] font-bold text-ruah-400 uppercase tracking-widest leading-loose">
                   Nossa fibra de algodão orgânico tem comportamento vivo. Peças Oversized exigem atenção ao comprimento da manga.
                </p>
             </div>
             <div className="flex flex-col gap-4">
                <span className="text-[9px] font-black text-accent-gold uppercase tracking-widest">03. Ajuste de Sopro</span>
                <h4 className="text-sm font-black uppercase tracking-tight text-ruah-950">Artesania Final</h4>
                <p className="text-[10px] font-bold text-ruah-400 uppercase tracking-widest leading-loose">
                   As estampas em serigrafia manual podem apresentar variações sutis — é a assinatura de quem soprou sua arte.
                </p>
             </div>
          </div>

          <div className="h-px bg-ruah-50" />

          {/* Tips Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="p-8 bg-ruah-50 rounded-[2rem] border border-ruah-100 flex items-start gap-4">
                <AlertTriangle size={24} className="text-accent-gold shrink-0" />
                <div className="flex flex-col gap-2">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-ruah-950">Tolerância do Tear</h4>
                   <p className="text-[9px] font-bold text-ruah-400 uppercase tracking-widest leading-relaxed">
                      Por ser um processo 100% manual, as medidas nominais podem variar até 1.5cm. É o respiro necessário da fibra natural.
                   </p>
                </div>
             </div>
             <div className="p-8 bg-ruah-950 text-white rounded-[2rem] flex items-center justify-between group cursor-pointer hover:bg-accent-gold transition-all shadow-xl">
                <div className="flex flex-col gap-1">
                   <span className="text-[8px] font-black text-accent-gold uppercase tracking-widest group-hover:text-white transition-colors">Manifesto Digital</span>
                   <span className="text-[10px] font-black uppercase tracking-widest">Solicitar Consultoria de Sopro</span>
                </div>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
             </div>
          </div>

          {/* Manifesto */}
          <div className="flex flex-col gap-4 pt-6 border-t border-ruah-50">
             <div className="flex items-center gap-3">
                <Factory size={16} className="text-accent-gold" />
                <span className="text-[9px] font-black text-ruah-950 uppercase tracking-[0.3em]">Manifesto de Sustentabilidade</span>
             </div>
             <p className="text-[10px] font-bold text-ruah-400 uppercase tracking-widest leading-loose">
                Ao produzir sob demanda, eliminamos o estoque morto e o descarte têxtil industrial. Seu pedido é soprado com carinho, consciência e respeito ao tempo humano.
             </p>
          </div>
       </div>

       {/* Footer CTA */}
       <div className="p-8 bg-ruah-50 border-t border-ruah-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <CheckCircle2 size={16} className="text-green-500" />
             <span className="text-[9px] font-black uppercase tracking-widest text-ruah-400">99% de satisfação artesanal</span>
          </div>
          <button className="text-[9px] font-black uppercase tracking-widest text-accent-gold border-b border-accent-gold/30 pb-1 hover:border-accent-gold transition-all">
             Falar com o Concierge Ruah
          </button>
       </div>
    </div>
  );
}
