'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ShieldCheck, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  q: string;
  a: string;
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    q: 'Qual tecido é usado na Camiseta Respiro?',
    a: 'Usamos malha 100% algodão fio 30.1 penteado premium, com toque macio e bom caimento para uso diário.',
  },
  {
    q: 'Como funciona o prazo de produção e entrega?',
    a: 'A peça é produzida sob demanda. O prazo combina produção artesanal e logística, com previsão exibida antes do checkout.',
  },
  {
    q: 'A estampa desbota com o tempo?',
    a: 'Usamos serigrafia premium e DTG com boa resistência. Seguindo o guia de lavagem, a durabilidade da estampa é alta.',
  },
  {
    q: 'Posso trocar se o tamanho não servir?',
    a: 'Sim. Você pode solicitar troca dentro da política vigente. Recomendamos usar o guia de medidas antes de finalizar a compra.',
  },
];

export function ProductFAQ() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-ruah-50 rounded-xl flex items-center justify-center text-accent-gold shadow-sm">
          <HelpCircle size={20} />
        </div>
        <div>
          <h3 className="text-xl font-serif italic uppercase leading-tight">ESPECIFICAÇÕES <br /> E DÚVIDAS.</h3>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {DEFAULT_FAQS.map((item, i) => (
          <div key={i} className="bg-white border border-ruah-100 rounded-3xl overflow-hidden group hover:border-accent-gold/40 transition-all">
            <button
              type="button"
              aria-expanded={openItems.includes(i)}
              aria-controls={`faq-answer-${i}`}
              onClick={() => toggleItem(i)}
              className="w-full p-8 flex items-center justify-between text-left"
            >
              <span className="text-base font-semibold leading-relaxed max-w-[80%]">{item.q}</span>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  openItems.includes(i) ? 'bg-ruah-950 text-white' : 'bg-ruah-50 text-ruah-300'
                }`}
              >
                <ChevronDown size={18} className={`transition-transform duration-500 ${openItems.includes(i) ? 'rotate-180' : ''}`} />
              </div>
            </button>
            <AnimatePresence>
              {openItems.includes(i) && (
                <motion.div id={`faq-answer-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <div className="px-8 pb-8">
                    <div className="h-px bg-ruah-50 mb-8" />
                    <p className="text-sm text-ruah-600 font-medium leading-relaxed">{item.a}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="p-8 bg-ruah-950 rounded-[2.5rem] text-white flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/20 blur-3xl" />
        <div className="flex items-center gap-3 relative z-10">
          <ShieldCheck size={20} className="text-accent-gold" />
          <h4 className="text-sm font-serif italic uppercase">Garantia e Troca</h4>
        </div>
        <p className="text-sm text-white/80 font-medium leading-relaxed relative z-10">
          Produção sob demanda com suporte pós-compra e política de troca transparente para assegurar sua experiência.
        </p>
        <Link href="/policies" className="text-xs font-semibold uppercase tracking-[0.08em] text-accent-gold border-b border-accent-gold/30 pb-1 self-start hover:border-accent-gold transition-all relative z-10">
          Ver política completa
        </Link>
      </div>
    </div>
  );
}

