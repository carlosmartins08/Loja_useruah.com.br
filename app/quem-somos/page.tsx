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
    answer: "Ruah Ã© uma palavra hebraica que significa 'sopro', 'vento' ou 'espÃ­rito'. No contexto bÃ­blico, representa o fÃ´lego de vida soprado pelo Criador. Nossa marca carrega esse nome para lembrar que cada peÃ§a Ã© fruto de um sopro criativo e espiritual."
  },
  {
    question: "Como os produtos sÃ£o fabricados?",
    answer: "Trabalhamos com o modelo de produÃ§Ã£o sob demanda (Print-on-Demand). Cada item Ã© fabricado somente apÃ³s a confirmaÃ§Ã£o do seu pedido. Isso nos permite oferecer uma variedade maior de designs exclusivos, garante a qualidade artesanal e, o mais importante, elimina o desperdÃ­cio de materiais e estoque ocioso, respeitando o meio ambiente."
  },
  {
    question: "Qual Ã© o propÃ³sito da UseRuah?",
    answer: "Nosso propÃ³sito Ã© conectar pessoas com sua espiritualidade atravÃ©s do design. Queremos que nossas peÃ§as sejam mais do que vestimentas; que sejam expressÃµes de fÃ©, oraÃ§Ãµes materializadas em arte e ferramentas de conexÃ£o com o Divino no dia a dia."
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
                 className="text-7xl lg:text-9xl font-serif italic leading-[0.85] tracking-tighter uppercase mb-16"
               >
                  TRANSFORMANDO <br /> ORAÃ‡Ã•ES EM <span className="not-italic">ARTE.</span>
               </motion.h1>
               <motion.p 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.4 }}
                 className="text-lg lg:text-xl font-medium uppercase tracking-[0.2em] leading-relaxed text-white/60 max-w-2xl"
               >
                  Ruah Ã© o sopro de vida. O Projeto Ruah nasceu para conectar pessoas com o Criador atravÃ©s de designs que respiram espiritualidade e propÃ³sito.
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center mb-48">
               <div className="flex flex-col gap-12">
                  <h2 className="text-5xl font-serif uppercase italic leading-none tracking-tighter font-black text-ruah-950">O SOPRO <br /> DA VIDA.</h2>
                  <div className="flex flex-col gap-8 text-ruah-500 font-medium uppercase text-[10px] tracking-widest leading-loose">
                     <p>
                        Ruah, em hebraico, significa sopro, vento, espÃ­rito. Ã‰ a forÃ§a vital que nos conecta ao Divino. Nosso projeto busca capturar esse fÃ´lego e materializÃ¡-lo em peÃ§as que inspiram.
                     </p>
                     <p>
                        Cada criaÃ§Ã£o Ã© um convite Ã  reflexÃ£o e uma oportunidade de levar a mensagem do Evangelho para as ruas, festas e encontros, de forma leve e profunda.
                     </p>
                  </div>
               </div>
               <div className="relative aspect-square rounded-[4rem] overflow-hidden shadow-fancy">
                  <AppImage context="content-banner" src="https://picsum.photos/seed/ruah-art-1/1000/1000" alt="Arte UseRuah" fill className="object-cover" referrerPolicy="no-referrer" />
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
               <div className="relative aspect-square rounded-[4rem] overflow-hidden shadow-fancy order-2 lg:order-1">
                  <AppImage context="content-banner" src="https://picsum.photos/seed/ruah-com-1/1000/1000" alt="Comunidade UseRuah" fill className="object-cover" referrerPolicy="no-referrer" />
               </div>
               <div className="flex flex-col gap-12 order-1 lg:order-2">
                  <h2 className="text-5xl font-serif uppercase italic leading-none tracking-tighter font-black text-ruah-950">VISTA-SE DE <br /> PROPÃ“SITO.</h2>
                  <div className="flex flex-col gap-8 text-ruah-500 font-medium uppercase text-[10px] tracking-widest leading-loose">
                     <p>
                        Acreditamos que vestir-se Ã© um ato de comunicaÃ§Ã£o. No Projeto Ruah, oferecemos aos artistas e Ã s igrejas um canal para expressarem sua fÃ© atravÃ©s de produtos com design contemporÃ¢neo.
                     </p>
                     <p>
                        NÃ£o somos apenas uma marca, somos um movimento de cristÃ£os que usam a criatividade como ferramenta de adoraÃ§Ã£o e serviÃ§o.
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
            <h3 className="text-4xl font-serif italic mb-12 max-w-3xl mx-auto italic font-black text-ruah-950">Cada peÃ§a UseRuah Ã© produzida sob demanda, respeitando o tempo da criaÃ§Ã£o e evitando o desperdÃ­cio.</h3>
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
            <div className="flex flex-col lg:flex-row gap-20">
               <div className="lg:w-1/3">
                  <span className="tech-label text-accent-gold mb-8 block">DÃºvidas Frequentes</span>
                  <h2 className="text-5xl font-serif uppercase italic leading-none tracking-tighter font-black text-ruah-950 mb-8">TRANSPARÃŠNCIA <br /> E CONEXÃƒO.</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest leading-loose text-ruah-400 max-w-xs">
                     Entenda mais sobre nossos processos, materiais e a filosofia que guia o Projeto Ruah.
                  </p>
               </div>
               <div className="lg:w-2/3 border-t border-ruah-100">
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

