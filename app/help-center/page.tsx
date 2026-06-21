'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight, Truck, RefreshCcw, ShieldCheck, Mail, Phone, MessageSquare, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';
import { MOTION_DURATION, MOTION_EASING } from '@/lib/ui/motion';

const FAQ_CATEGORIES = [
  {
    id: 'shipping',
    label: 'Logística & Prazos',
    icon: Truck,
    questions: [
      {
        q: 'Como funciona o prazo de produção sob demanda?',
        a: 'Nossas peças são produzidas para cada pedido. O prazo é composto por produção (7 a 12 dias) + logística.'
      },
      {
        q: 'Vocês entregam em todo o Brasil?',
        a: 'Sim. Enviamos para todos os estados com parceiros logísticos homologados.'
      }
    ]
  },
  {
    id: 'returns',
    label: 'Trocas & Devoluções',
    icon: RefreshCcw,
    questions: [
      {
        q: 'Qual o prazo para solicitar uma troca?',
        a: 'Você tem até 7 dias após o recebimento. Para itens sob demanda, revise a tabela de medidas antes da compra.'
      },
      {
        q: 'Peças personalizadas podem ser trocadas?',
        a: 'Hoje a loja pública trabalha com catálogo publicado. Se existir um pedido tratado fora do fluxo padrão, a elegibilidade de troca depende do contexto registrado no atendimento.'
      }
    ]
  },
  {
    id: 'technical',
    label: 'Qualidade & Tecidos',
    icon: ShieldCheck,
    questions: [
      {
        q: 'Qual o tipo de malha utilizado?',
        a: 'Utilizamos malha 100% algodão 30.1 penteado premium para conforto e durabilidade.'
      },
      {
        q: 'As estampas desbotam com o tempo?',
        a: 'Com os cuidados corretos de lavagem, a estampa mantém alta definição e boa resistência.'
      }
    ]
  }
] as const;

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<(typeof FAQ_CATEGORIES)[number]['id']>('shipping');
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (q: string) => {
    setOpenItems((prev) => (prev.includes(q) ? prev.filter((i) => i !== q) : [...prev, q]));
  };

  const filteredCategories = FAQ_CATEGORIES.map((cat) => ({
    ...cat,
    questions: cat.questions.filter(
      (q) => q.q.toLowerCase().includes(searchQuery.toLowerCase()) || q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.questions.length > 0);

  return (
    <div className="min-h-screen bg-white page-header-offset">
      <Header />
      <main>
        <section className="bg-ruah-950 text-white pt-28 lg:pt-36 pb-16 lg:pb-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(197,160,89,0.18),transparent_28%),radial-gradient(circle_at_88%_16%,rgba(255,255,255,0.05),transparent_24%)]" />
          <div className="section-container relative z-10">
            <div className="layout-grid-media gap-12 lg:gap-16 items-end">
              <div className="lg:col-span-7 max-w-3xl">
                <span className="tech-label text-accent-gold mb-6 block">Central de Ajuda</span>
                <h1 className="ur-type-display-lg italic uppercase mb-10">Como Podemos Ajudar?</h1>

                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-accent-gold transition-colors" size={24} />
                  <input
                    type="text"
                    placeholder="Busque por prazos, trocas, tecidos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 pl-16 pr-8 text-lg font-medium outline-none focus:border-accent-gold focus:bg-white/10 motion-base placeholder:text-white/30"
                  />
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-[3rem] border border-white/10 bg-white/5 p-8 lg:p-10 backdrop-blur-sm shadow-fancy">
                  <span className="tech-label text-accent-gold">Concierge editorial</span>
                  <h2 className="mt-5 text-3xl font-serif italic uppercase leading-none text-white">Ajuda que resolve sem matar a atmosfera.</h2>
                  <p className="mt-5 text-sm font-medium leading-relaxed text-white/65">
                    Atendimento, rastreio e política precisam ser claros, mas não precisam parecer uma área fria ou burocrática.
                  </p>
                  <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-2xl font-serif italic text-white">3</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Tópicos</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-2xl font-serif italic text-white">FAQ</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Guiado</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-2xl font-serif italic text-white">1</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Próximo passo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 lg:py-20 border-b border-ruah-100 bg-[linear-gradient(180deg,rgba(250,250,250,0.8),rgba(255,255,255,1))]">
          <div className="section-container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/account" className="group p-8 bg-ruah-50 rounded-[2.5rem] border border-ruah-100 hover:border-accent-gold/30 motion-base">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-accent-gold mb-5 shadow-sm">
                  <RefreshCcw size={24} />
                </div>
                <h3 className="text-xl font-serif italic mb-2">Pedidos & Trocas</h3>
                <p className="text-sm text-ruah-500 leading-relaxed mb-5">Acompanhe seu pedido ou inicie uma solicitação de troca.</p>
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold flex items-center gap-2">Ver meus pedidos <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
              </Link>

              <Link href="/policies" className="group p-8 bg-ruah-50 rounded-[2.5rem] border border-ruah-100 hover:border-accent-gold/30 motion-base">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-accent-gold mb-5 shadow-sm">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-serif italic mb-2">Pacto de Qualidade</h3>
                <p className="text-sm text-ruah-500 leading-relaxed mb-5">Conheça nossos padrões de produção e tecidos.</p>
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold flex items-center gap-2">Ver politicas <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
              </Link>

              <Link href="/account/orders" className="group p-8 bg-ruah-50 rounded-[2.5rem] border border-ruah-100 hover:border-accent-gold/30 motion-base">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-accent-gold mb-5 shadow-sm">
                  <Truck size={24} />
                </div>
                <h3 className="text-xl font-serif italic mb-2">Rastreio Ruah</h3>
                <p className="text-sm text-ruah-500 leading-relaxed mb-5">Entre na sua conta para acompanhar entrega, rastreio e eventuais trocas.</p>
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold flex items-center gap-2">Abrir meus pedidos <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(197,160,89,0.08),transparent_24%)]" />
          <div className="section-container">
            <div className="layout-grid-product gap-10 lg:gap-16">
              <div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-24 self-start rounded-[2.5rem] border border-ruah-100 bg-white/90 p-6 shadow-subtle backdrop-blur-sm">
                <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-ruah-400 mb-2">Tópicos</h4>
                {FAQ_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center justify-between p-5 rounded-2xl border motion-base text-left ${
                      activeCategory === cat.id
                        ? 'bg-ruah-950 text-white border-ruah-950 shadow-fancy'
                        : 'bg-white text-ruah-500 border-ruah-100 hover:border-ruah-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <cat.icon size={18} className={activeCategory === cat.id ? 'text-accent-gold' : 'text-ruah-300'} />
                      <span className="text-sm font-semibold">{cat.label}</span>
                    </div>
                    <ArrowRight size={14} className={activeCategory === cat.id ? 'opacity-100' : 'opacity-0'} />
                  </button>
                ))}
              </div>

              <div className="lg:col-span-8 flex flex-col gap-5">
                {filteredCategories.find((c) => c.id === activeCategory)?.questions.map((item, i) => (
                  <div key={i} className="bg-white border border-ruah-100 rounded-3xl overflow-hidden hover:border-accent-gold/30 motion-base">
                    <button onClick={() => toggleItem(item.q)} className="w-full p-6 lg:p-8 flex items-center justify-between text-left gap-6">
                      <span className="text-xl font-serif italic leading-tight">{item.q}</span>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center motion-base shrink-0 ${openItems.includes(item.q) ? 'bg-ruah-950 text-white' : 'bg-ruah-50 text-ruah-300'}`}>
                        <ChevronDown size={18} className={`transition-transform motion-slow ${openItems.includes(item.q) ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {openItems.includes(item.q) && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASING.circOut }}>
                          <div className="px-6 lg:px-8 pb-8">
                            <div className="h-px bg-ruah-50 mb-6" />
                            <p className="text-sm text-ruah-600 leading-relaxed">{item.a}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-ruah-50 py-20 lg:py-28 border-t border-ruah-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(197,160,89,0.08),transparent_30%)]" />
          <div className="section-container">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-10">
              <div className="flex flex-col gap-4">
                <span className="tech-label text-accent-gold">Ainda tem dúvidas?</span>
                <h2 className="ur-type-display-md italic uppercase">Concierge Ruah</h2>
                <p className="text-sm text-ruah-500 leading-relaxed">Nossa equipe está pronta para ajudar com qualquer detalhe do seu pedido.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
                <Link href="/account/support" className="p-6 bg-white rounded-3xl border border-ruah-100 flex flex-col items-center gap-3 hover:border-accent-gold motion-base shadow-subtle">
                  <Mail size={24} className="text-ruah-300" />
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400">Minha Conta</span>
                  <span className="text-sm font-semibold text-center">Abra um ticket autenticado</span>
                </Link>
                <Link href="/account/orders" className="p-6 bg-white rounded-3xl border border-ruah-100 flex flex-col items-center gap-3 hover:border-accent-gold motion-base shadow-subtle">
                  <Phone size={24} className="text-ruah-300" />
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400">Pedidos</span>
                  <span className="text-sm font-semibold text-center">Acompanhe entrega e trocas</span>
                </Link>
                <Link href="/policies" className="p-6 bg-white rounded-3xl border border-ruah-100 flex flex-col items-center gap-3 hover:border-accent-gold motion-base shadow-subtle">
                  <MessageSquare size={24} className="text-ruah-300" />
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400">Políticas</span>
                  <span className="text-sm font-semibold text-center">Consulte regras da loja</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
