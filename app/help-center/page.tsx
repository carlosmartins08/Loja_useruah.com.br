'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight, Truck, RefreshCcw, ShieldCheck, Mail, Phone, MessageSquare, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';

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
        a: 'Itens customizados seguem política específica. Fale com nosso concierge para validação do caso.'
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
          <div className="absolute top-0 right-0 w-1/3 h-full bg-accent-gold/10 blur-[120px] -skew-x-12" />
          <div className="section-container relative z-10">
            <div className="max-w-3xl">
              <span className="tech-label text-accent-gold mb-6 block">Central de Ajuda</span>
              <h1 className="text-5xl lg:text-7xl font-serif leading-[0.92] italic uppercase mb-10">Como Podemos Ajudar?</h1>

              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-accent-gold transition-colors" size={24} />
                <input
                  type="text"
                  placeholder="Busque por prazos, trocas, tecidos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 pl-16 pr-8 text-lg font-medium outline-none focus:border-accent-gold focus:bg-white/10 transition-all placeholder:text-white/30"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 lg:py-20 border-b border-ruah-100">
          <div className="section-container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/account" className="group p-8 bg-ruah-50 rounded-[2.5rem] border border-ruah-100 hover:border-accent-gold/30 transition-all">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-accent-gold mb-5 shadow-sm">
                  <RefreshCcw size={24} />
                </div>
                <h3 className="text-xl font-serif italic mb-2">Pedidos & Trocas</h3>
                <p className="text-sm text-ruah-500 leading-relaxed mb-5">Acompanhe seu pedido ou inicie uma solicitação de troca.</p>
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold flex items-center gap-2">Ver meus pedidos <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
              </Link>

              <div className="group p-8 bg-ruah-50 rounded-[2.5rem] border border-ruah-100 hover:border-accent-gold/30 transition-all cursor-pointer">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-accent-gold mb-5 shadow-sm">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-serif italic mb-2">Pacto de Qualidade</h3>
                <p className="text-sm text-ruah-500 leading-relaxed mb-5">Conheça nossos padrões de produção e tecidos.</p>
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold flex items-center gap-2">Ver padrões <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
              </div>

              <div className="group p-8 bg-ruah-50 rounded-[2.5rem] border border-ruah-100 hover:border-accent-gold/30 transition-all cursor-pointer">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-accent-gold mb-5 shadow-sm">
                  <Truck size={24} />
                </div>
                <h3 className="text-xl font-serif italic mb-2">Rastreio Ruah</h3>
                <p className="text-sm text-ruah-500 leading-relaxed mb-5">Saiba onde sua entrega está agora.</p>
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold flex items-center gap-2">Rastrear agora <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="section-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
              <div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-24">
                <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-ruah-400 mb-2">Tópicos</h4>
                {FAQ_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all text-left ${
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
                  <div key={i} className="bg-white border border-ruah-100 rounded-3xl overflow-hidden hover:border-accent-gold/30 transition-all">
                    <button onClick={() => toggleItem(item.q)} className="w-full p-6 lg:p-8 flex items-center justify-between text-left gap-6">
                      <span className="text-xl font-serif italic leading-tight">{item.q}</span>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${openItems.includes(item.q) ? 'bg-ruah-950 text-white' : 'bg-ruah-50 text-ruah-300'}`}>
                        <ChevronDown size={18} className={`transition-transform duration-500 ${openItems.includes(item.q) ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {openItems.includes(item.q) && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
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

        <section className="bg-ruah-50 py-20 lg:py-28 border-t border-ruah-100">
          <div className="section-container">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-10">
              <div className="flex flex-col gap-4">
                <span className="tech-label text-accent-gold">Ainda tem dúvidas?</span>
                <h2 className="text-4xl lg:text-5xl font-serif italic uppercase">Concierge Ruah</h2>
                <p className="text-sm text-ruah-500 leading-relaxed">Nossa equipe está pronta para ajudar com qualquer detalhe do seu pedido.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
                <div className="p-6 bg-white rounded-3xl border border-ruah-100 flex flex-col items-center gap-3 hover:border-accent-gold transition-all">
                  <Mail size={24} className="text-ruah-300" />
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400">E-mail</span>
                  <span className="text-sm font-semibold">falecom@useruah.com</span>
                </div>
                <div className="p-6 bg-white rounded-3xl border border-ruah-100 flex flex-col items-center gap-3 hover:border-accent-gold transition-all">
                  <Phone size={24} className="text-ruah-300" />
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400">Telefone</span>
                  <span className="text-sm font-semibold">+55 11 9999-9999</span>
                </div>
                <div className="p-6 bg-white rounded-3xl border border-ruah-100 flex flex-col items-center gap-3 hover:border-accent-gold transition-all">
                  <MessageSquare size={24} className="text-ruah-300" />
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400">WhatsApp</span>
                  <span className="text-sm font-semibold">Atendimento Viva</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
