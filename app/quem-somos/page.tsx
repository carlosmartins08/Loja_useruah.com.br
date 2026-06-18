'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { AppImage } from '@/components/shared/AppImage';
import { Footer } from '@/components/navigation/Footer';
import { Header } from '@/components/navigation/Header';
import { BRAND_EDITORIAL_ASSETS } from '@/lib/brand-assets';

const FAQ_ITEMS = [
  {
    question: "O que significa 'Ruah'?",
    answer: 'Ruah é uma palavra hebraica ligada a sopro, vento e espírito. Na marca, ela funciona como eixo simbólico para uma moda cristã com linguagem visual contemplativa e direção própria.',
  },
  {
    question: 'Como os produtos são fabricados?',
    answer: 'A operação pública trabalha com produção sob demanda. A peça entra em produção depois da compra, o que reduz estoque parado e mantém a vitrine mais aderente ao catálogo real.',
  },
  {
    question: 'Qual é o papel da UseRuah hoje?',
    answer: 'Hoje o papel da UseRuah é mais objetivo do que parte do discurso antigo sugeria: reunir peças publicadas, organizar leitura editorial de coleção e sustentar compra, pagamento e atendimento com rastreabilidade.',
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-ruah-100 last:border-0 overflow-hidden">
      <button onClick={() => setIsOpen((value) => !value)} className="w-full py-8 flex justify-between items-center text-left group">
        <span className="text-sm font-black uppercase tracking-widest text-ruah-950 group-hover:text-accent-gold transition-colors">{question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="text-ruah-300 group-hover:text-accent-gold">
          <ChevronDown size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
            <p className="pb-8 text-xs font-medium text-ruah-500 uppercase tracking-widest leading-loose max-w-3xl">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="bg-white page-header-offset">
      <Header />

      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-ruah-950 text-white">
        <div className="absolute inset-0 z-0 overflow-hidden opacity-40">
          <AppImage context="content-banner" src={BRAND_EDITORIAL_ASSETS.aboutHero} alt="Manifesto visual UseRuah" fill className="object-cover grayscale" />
        </div>

        <div className="section-container relative z-10">
          <div className="max-w-4xl">
            <motion.span initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="tech-label text-accent-gold mb-12 block">
              Manifesto UseRuah
            </motion.span>
            <motion.h1 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="ur-type-display-xl italic leading-[0.85] tracking-tighter uppercase mb-16">
              Catálogo com <br /> <span className="not-italic">linguagem própria.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-lg lg:text-xl font-medium uppercase tracking-[0.2em] leading-relaxed text-white/60 max-w-2xl">
              A UseRuah existe para traduzir fé em forma visual sem prometer capacidades que o produto ainda não entrega. Hoje isso significa coleção publicada, direção editorial e operação sob demanda.
            </motion.p>
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <div className="w-px h-12 bg-white" />
        </div>
      </section>

      <section className="py-48 overflow-hidden">
        <div className="section-container">
          <div className="layout-grid-media gap-20 lg:gap-24 mb-48">
            <div className="lg:col-span-5 flex flex-col gap-12 self-center">
              <h2 className="text-5xl font-serif uppercase italic leading-none tracking-tighter font-black text-ruah-950">
                O SOPRO <br /> DA MARCA.
              </h2>
              <div className="flex flex-col gap-8 text-ruah-500 font-medium uppercase text-[10px] tracking-widest leading-loose">
                <p>Ruah, em hebraico, carrega a ideia de sopro, vento e espírito. A marca usa esse eixo como linguagem, não como desculpa para inflar promessa operacional.</p>
                <p>O objetivo prático é construir uma presença visual coerente: peças que já existem no catálogo, leitura clara de coleção e uma estética que não dependa de clichê religioso.</p>
              </div>
            </div>
            <div className="lg:col-span-7 relative aspect-square rounded-[4rem] overflow-hidden shadow-fancy">
              <AppImage context="content-banner" src={BRAND_EDITORIAL_ASSETS.aboutArt} alt="Editorial UseRuah" fill className="object-cover" />
            </div>
          </div>

          <div className="layout-grid-media gap-20 lg:gap-24 items-center">
            <div className="lg:col-span-7 relative aspect-square rounded-[4rem] overflow-hidden shadow-fancy order-2 lg:order-1">
              <AppImage context="content-banner" src={BRAND_EDITORIAL_ASSETS.aboutCommunity} alt="Coleção UseRuah" fill className="object-cover" />
            </div>
            <div className="lg:col-span-5 flex flex-col gap-12 order-1 lg:order-2 self-center">
              <h2 className="text-5xl font-serif uppercase italic leading-none tracking-tighter font-black text-ruah-950">
                VISTA-SE DE <br /> CONTEXTO.
              </h2>
              <div className="flex flex-col gap-8 text-ruah-500 font-medium uppercase text-[10px] tracking-widest leading-loose">
                <p>A UseRuah não opera hoje como plataforma aberta para igreja, artista e customização em escala. O que existe publicamente é uma loja com catálogo publicado, compra simples e atendimento rastreável.</p>
                <p>Isso não diminui a marca. Pelo contrário: obriga cada página a dizer a verdade sobre o estágio atual do produto.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ruah-50 py-32 border-y border-ruah-100">
        <div className="section-container text-center">
          <span className="tech-label text-accent-gold mb-8 block">Base operacional</span>
          <h3 className="text-4xl font-serif mb-12 max-w-3xl mx-auto italic font-black text-ruah-950">
            Produção sob demanda, catálogo publicado e menos distância entre discurso de marca e runtime.
          </h3>
          <div className="flex justify-center flex-wrap gap-16">
            <div className="flex flex-col gap-2">
              <span className="text-3xl font-serif font-black italic">100%</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-ruah-400">Sob demanda</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-3xl font-serif font-black italic">1</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-ruah-400">Catálogo público coerente</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-3xl font-serif font-black italic">0%</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-ruah-400">Estoque ocioso</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-48 bg-white" id="faq">
        <div className="section-container">
          <div className="layout-grid-product gap-12 lg:gap-16">
            <div className="lg:col-span-4 self-start">
              <span className="tech-label text-accent-gold mb-8 block">Dúvidas Frequentes</span>
              <h2 className="text-5xl font-serif uppercase italic leading-none tracking-tighter font-black text-ruah-950 mb-8">
                TRANSPARÊNCIA <br /> ANTES DO MITO.
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest leading-loose text-ruah-400 max-w-xs">
                Entenda o que a marca significa, o que a operação sustenta hoje e o que ainda não deve ser vendido como capacidade pronta.
              </p>
            </div>
            <div className="lg:col-span-8 border-t border-ruah-100">
              {FAQ_ITEMS.map((item, index) => (
                <FaqItem key={index} {...item} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
