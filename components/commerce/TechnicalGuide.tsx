'use client';

import React from 'react';
import { Ruler, AlertTriangle, CheckCircle2, Factory, ArrowRight } from 'lucide-react';

export function TechnicalGuide() {
  return (
    <div className="bg-white border border-ruah-100 rounded-[2.5rem] shadow-2xl overflow-hidden font-sans self-start">
      <div className="p-8 lg:p-10 bg-ruah-950 text-white flex flex-col gap-6 relative">
        <div className="absolute top-0 right-0 w-40 h-full bg-accent-gold/10 blur-3xl" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-accent-gold rounded-2xl flex items-center justify-center text-white shadow-fancy">
            <Ruler size={24} />
          </div>
          <div>
            <h3 className="text-2xl lg:text-3xl font-serif italic uppercase leading-none">
              Guia Técnico de <br />
              <span className="text-accent-gold">Veste & Corte</span>
            </h3>
            <span className="text-xs font-black text-accent-gold uppercase tracking-[0.2em] mt-2 block">Sopro de precisão</span>
          </div>
        </div>
        <p className="text-sm text-white/80 leading-relaxed max-w-2xl">
          Cada peça Ruah é produzida sob demanda. Para reduzir desperdício e melhorar o caimento da sua arte,
          use nosso guia de medidas.
        </p>
      </div>

      <div className="p-8 lg:p-10 flex flex-col gap-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-black text-accent-gold uppercase tracking-[0.12em]">01. Consciência corporal</span>
            <h4 className="text-lg font-serif italic text-ruah-950">Meça o corpo, não a peça</h4>
            <p className="text-sm text-ruah-600 leading-relaxed">
              Utilize fita métrica firme ao corpo. Como nossas tramas são naturais, considere um respiro de 1 cm para maior conforto.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-xs font-black text-accent-gold uppercase tracking-[0.12em]">02. Caimento & alma</span>
            <h4 className="text-lg font-serif italic text-ruah-950">Dinâmica do tear</h4>
            <p className="text-sm text-ruah-600 leading-relaxed">
              Nossa fibra de algodão tem comportamento vivo. Modelos oversized exigem atenção ao comprimento da manga.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-xs font-black text-accent-gold uppercase tracking-[0.12em]">03. Ajuste de sopro</span>
            <h4 className="text-lg font-serif italic text-ruah-950">Artesania final</h4>
            <p className="text-sm text-ruah-600 leading-relaxed">
              Estampas em serigrafia manual podem ter variações sutis. Essa é a assinatura de um processo artesanal real.
            </p>
          </div>
        </div>

        <div className="h-px bg-ruah-100" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-ruah-50 rounded-[2rem] border border-ruah-100 flex items-start gap-4">
            <AlertTriangle size={22} className="text-accent-gold shrink-0" />
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-bold uppercase tracking-[0.08em] text-ruah-950">Tolerância do tear</h4>
              <p className="text-sm text-ruah-600 leading-relaxed">
                Por ser um processo manual, as medidas nominais podem variar até 1,5 cm.
              </p>
            </div>
          </div>

          <button type="button" className="p-6 bg-ruah-950 text-white rounded-[2rem] flex items-center justify-between group hover:bg-accent-gold transition-all shadow-xl">
            <div className="flex flex-col items-start gap-1 text-left">
              <span className="text-xs font-black text-accent-gold uppercase tracking-[0.12em] group-hover:text-white transition-colors">Manifesto digital</span>
              <span className="text-sm font-semibold uppercase tracking-[0.08em]">Solicitar consultoria de sopro</span>
            </div>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="flex flex-col gap-3 pt-4 border-t border-ruah-100">
          <div className="flex items-center gap-3">
            <Factory size={16} className="text-accent-gold" />
            <span className="text-xs font-black text-ruah-950 uppercase tracking-[0.2em]">Manifesto de sustentabilidade</span>
          </div>
          <p className="text-sm text-ruah-600 leading-relaxed">
            Ao produzir sob demanda, reduzimos estoque morto e descarte têxtil industrial. Seu pedido é feito com cuidado e respeito ao tempo humano.
          </p>
        </div>
      </div>

      <div className="p-6 bg-ruah-50 border-t border-ruah-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-500" />
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ruah-500">99% de satisfação artesanal</span>
        </div>
        <button type="button" className="text-xs font-semibold uppercase tracking-[0.08em] text-accent-gold border-b border-accent-gold/40 pb-1 hover:border-accent-gold transition-all">
          Falar com o concierge Ruah
        </button>
      </div>
    </div>
  );
}

