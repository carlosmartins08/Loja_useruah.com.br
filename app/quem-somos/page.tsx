'use client';

import React, { useState } from 'react';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { AppImage } from '@/components/shared/AppImage';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: "O que significa 'Ruah'?",
    answer: "Ruah é uma palavra hebraica que significa 'sopro', 'vento' ou 'espírito'. No contexto bíblico, representa o fôlego de vida soprado pelo Criador. Nossa marca carrega esse nome para lembrar que cada peça é fruto de um sopro criativo e espiritual."
  },
  {
    question: "Como os produtos são fabricados?",
    answer: "Trabalhamos com o modelo de produção sob demanda (Print-on-Demand). Cada item é fabricado somente após a confirmação do seu pedido. Isso nos permite oferecer uma variedade maior de designs exclusivos, garante a qualidade artesanal e, o mais importante, elimina o desperdício de materiais e estoque ocioso, respeitando o meio ambiente."
  },
  {
    question: "Qual é o propósito da UseRuah?",
    answer: "Nosso propósito é conectar pessoas com sua espiritualidade através do design. Queremos que nossas peças sejam mais do que vestimentas; que sejam expressões de fé, orações materializadas em arte e ferramentas de conexão com o Divino no dia a dia."
  }
];

const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-ruah-100 last:border-0 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-8 flex justify-between items-center text-left group"
      >
        <span className="text-sm font-black uppercase tracking-widest text-ruah-950 group-hover:text-accent-gold transition-colors">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-ruah-300 group-hover:text-accent-gold"
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <p className="pb-8 text-xs font-medium text-ruah-500 uppercase tracking-widest leading-loose max-w-3xl">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function AboutPage() {
  return (
    <main className="bg-white page-header-offset">
      <Header />
      
      {/* Immersive Hero */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-ruah-950 text-white">
         <div className="absolute inset-0 z-0 overflow-hidden opacity-40">
            <AppImage context="content-banner" 
              src="https://picsum.photos/seed/ruah-about-hero/1920/1080" 
              alt="UseRuah Hero"
              fill
              className="object-cover grayscale"
              referrerPolicy="no-referrer"
            />
         </div>

         <div className="section-container relative z-10">
            <div className="max-w-4xl">
               <motion.span 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 className="tech-label text-accent-gold mb-12 block"
               >
                  Manifesto UseRuah
               </motion.span>
               <motion.h1 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                 className="ur-type-display-xl italic leading-[0.85] tracking-tighter uppercase mb-16"
               >
                  TRANSFORMANDO <br /> ORAÇÕES EM <span className="not-italic">ARTE.</span>
               </motion.h1>
               <motion.p 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.4 }}
                 className="text-lg lg:text-xl font-medium uppercase tracking-[0.2em] leading-relaxed text-white/60 max-w-2xl"
               >
                  Ruah é o sopro de vida. O Projeto Ruah nasceu para conectar pessoas com o Criador através de designs que respiram espiritualidade e propósito.
               </motion.p>
            </div>
         </div>
         
         <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
            <div className="w-px h-12 bg-white" />
         </div>
      </section>

      {/* Mission Grid */}
      <section className="py-48 overflow-hidden">
         <div className="section-container">
            <div className="layout-grid-media gap-20 lg:gap-24 mb-48">
               <div className="lg:col-span-5 flex flex-col gap-12 self-center">
                  <h2 className="text-5xl font-serif uppercase italic leading-none tracking-tighter font-black text-ruah-950">O SOPRO <br /> DA VIDA.</h2>
                  <div className="flex flex-col gap-8 text-ruah-500 font-medium uppercase text-[10px] tracking-widest leading-loose">
                     <p>
                        Ruah, em hebraico, significa sopro, vento, espírito. É a força vital que nos conecta ao Divino. Nosso projeto busca capturar esse fôlego e materializá-lo em peças que inspiram.
                     </p>
                     <p>
                        Cada criação é um convite à reflexão e uma oportunidade de levar a mensagem do Evangelho para as ruas, festas e encontros, de forma leve e profunda.
                     </p>
                  </div>
               </div>
               <div className="lg:col-span-7 relative aspect-square rounded-[4rem] overflow-hidden shadow-fancy">
                  <AppImage context="content-banner" src="https://picsum.photos/seed/ruah-art-1/1000/1000" alt="Arte UseRuah" fill className="object-cover" referrerPolicy="no-referrer" />
               </div>
            </div>

            <div className="layout-grid-media gap-20 lg:gap-24 items-center">
               <div className="lg:col-span-7 relative aspect-square rounded-[4rem] overflow-hidden shadow-fancy order-2 lg:order-1">
                  <AppImage context="content-banner" src="https://picsum.photos/seed/ruah-com-1/1000/1000" alt="Comunidade UseRuah" fill className="object-cover" referrerPolicy="no-referrer" />
               </div>
               <div className="lg:col-span-5 flex flex-col gap-12 order-1 lg:order-2 self-center">
                  <h2 className="text-5xl font-serif uppercase italic leading-none tracking-tighter font-black text-ruah-950">VISTA-SE DE <br /> PROPÓSITO.</h2>
                  <div className="flex flex-col gap-8 text-ruah-500 font-medium uppercase text-[10px] tracking-widest leading-loose">
                     <p>
                        Acreditamos que vestir-se é um ato de comunicação. No Projeto Ruah, oferecemos aos artistas e às igrejas um canal para expressarem sua fé através de produtos com design contemporâneo.
                     </p>
                     <p>
                        Não somos apenas uma marca, somos um movimento de cristãos que usam a criatividade como ferramenta de adoração e serviço.
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Sustainable Commitment */}
      <section className="bg-ruah-50 py-32 border-y border-ruah-100">
         <div className="section-container text-center">
            <span className="tech-label text-accent-gold mb-8 block">Nosso Impacto</span>
            <h3 className="text-4xl font-serif italic mb-12 max-w-3xl mx-auto italic font-black text-ruah-950">Cada peça UseRuah é produzida sob demanda, respeitando o tempo da criação e evitando o desperdício.</h3>
            <div className="flex justify-center flex-wrap gap-16">
               <div className="flex flex-col gap-2">
                  <span className="text-3xl font-serif font-black italic">100%</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-ruah-400">On-Demand</span>
               </div>
               <div className="flex flex-col gap-2">
                  <span className="text-3xl font-serif font-black italic">50+</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-ruah-400">Artistas Parceiros</span>
               </div>
               <div className="flex flex-col gap-2">
                  <span className="text-3xl font-serif font-black italic">0%</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-ruah-400">Estoque Ocioso</span>
               </div>
            </div>
         </div>
      </section>

      {/* FAQ Section */}
      <section className="py-48 bg-white" id="faq">
         <div className="section-container">
            <div className="layout-grid-product gap-12 lg:gap-16">
               <div className="lg:col-span-4 self-start">
                  <span className="tech-label text-accent-gold mb-8 block">Dúvidas Frequentes</span>
                  <h2 className="text-5xl font-serif uppercase italic leading-none tracking-tighter font-black text-ruah-950 mb-8">TRANSPARÊNCIA <br /> E CONEXÃO.</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest leading-loose text-ruah-400 max-w-xs">
                     Entenda mais sobre nossos processos, materiais e a filosofia que guia o Projeto Ruah.
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

