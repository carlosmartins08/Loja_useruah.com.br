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
      { q: 'Como funciona o prazo de produção sob demanda?', a: 'Como nossas peças são manufaturadas exclusivamente para cada pedido, o prazo é composto por: Produção (7-12 dias) + Logística. Você pode acompanhar cada etapa em seu painel de comunidade.' },
      { q: 'Vocês entregam em todo o Brasil?', a: 'Sim, enviamos nossas orações em forma de arte para todos os estados brasileiros através de parceiros logísticos seguros.' }
    ]
  },
  {
    id: 'returns',
    label: 'Trocas & Devoluções',
    icon: RefreshCcw,
    questions: [
      { q: 'Qual o prazo para solicitar uma troca?', a: 'Você tem até 7 dias após o recebimento para solicitar a troca. Como trabalhamos sob demanda, pedimos atenção extra à tabela de medidas.' },
      { q: 'Peças personalizadas de grupos podem ser trocadas?', a: 'Itens produzidos com logos específicos de pastorais ou eventos seguem uma política de reserva técnica. Entre em contato com nosso Concierge.' }
    ]
  },
  {
    id: 'technical',
    label: 'Qualidade & Tecidos',
    icon: ShieldCheck,
    questions: [
      { q: 'Qual o tipo de malha utilizado?', a: 'Utilizamos malha 100% algodão 30.1 penteado premium, garantindo um toque macio e durabilidade para acompanhar sua jornada de fé.' },
      { q: 'As estampas desbotam com o tempo?', a: 'Nossa técnica de estamparia (silk digital ou serigrafia premium) garante alta definição e resistência, desde que seguidas as instruções de lavagem.' }
    ]
  }
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(FAQ_CATEGORIES[0].id);
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (q: string) => {
    setOpenItems(prev => prev.includes(q) ? prev.filter(i => i !== q) : [...prev, q]);
  };

  const filteredCategories = FAQ_CATEGORIES.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="min-h-screen bg-white page-header-offset">
      <Header />
      <main>
       {/* Hero Section */}
       <section className="bg-ruah-950 text-white pt-40 pb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-accent-gold/10 blur-[120px] -skew-x-12" />
          <div className="section-container relative z-10">
             <div className="max-w-3xl">
                <span className="tech-label text-accent-gold mb-6 block">Central de Ajuda</span>
                <h1 className="text-6xl lg:text-8xl font-serif leading-none italic uppercase mb-12">COMO PODEMOS <br /> AJUDAR?</h1>
                
                <div className="relative group">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-accent-gold transition-colors" size={24} />
                   <input 
                     type="text" 
                     placeholder="Busque por prazos, trocas, tecidos..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-3xl py-8 pl-16 pr-8 text-xl font-medium outline-none focus:border-accent-gold focus:bg-white/10 transition-all placeholder:text-white/20"
                   />
                </div>
             </div>
          </div>
       </section>

       {/* Direct Links */}
       <section className="py-20 border-b border-ruah-100">
          <div className="section-container">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Link href="/account" className="group p-10 bg-ruah-50 rounded-[2.5rem] border border-ruah-100 hover:border-accent-gold/30 transition-all">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-accent-gold mb-6 shadow-sm">
                      <RefreshCcw size={24} />
                   </div>
                   <h3 className="text-xl font-serif uppercase italic mb-2">Pedidos & Trocas</h3>
                   <p className="text-[10px] font-bold text-ruah-300 uppercase tracking-widest leading-relaxed mb-6">Acompanhe seu sopro ou inicie uma solicitação de troca.</p>
                   <span className="text-[9px] font-bold uppercase tracking-widest text-accent-gold flex items-center gap-2">VER MEUS PEDIDOS <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
                </Link>

                <div className="group p-10 bg-ruah-50 rounded-[2.5rem] border border-ruah-100 hover:border-accent-gold/30 transition-all cursor-pointer">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-accent-gold mb-6 shadow-sm">
                      <ShieldCheck size={24} />
                   </div>
                   <h3 className="text-xl font-serif uppercase italic mb-2">Pacto de Qualidade</h3>
                   <p className="text-[10px] font-bold text-ruah-300 uppercase tracking-widest leading-relaxed mb-6">Conheça nossos padrões de produção e tecidos premium.</p>
                   <span className="text-[9px] font-bold uppercase tracking-widest text-accent-gold flex items-center gap-2">VER PADRÕES <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
                </div>

                <div className="group p-10 bg-ruah-50 rounded-[2.5rem] border border-ruah-100 hover:border-accent-gold/30 transition-all cursor-pointer">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-accent-gold mb-6 shadow-sm">
                      <Truck size={24} />
                   </div>
                   <h3 className="text-xl font-serif uppercase italic mb-2">Rastreio Ruah</h3>
                   <p className="text-[10px] font-bold text-ruah-300 uppercase tracking-widest leading-relaxed mb-6">Saiba exatamente onde sua arte está agora.</p>
                   <span className="text-[9px] font-bold uppercase tracking-widest text-accent-gold flex items-center gap-2">RASTREAR AGORA <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
                </div>
             </div>
          </div>
       </section>

       {/* FAQ Sections */}
       <section className="py-32">
          <div className="section-container">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                
                {/* Sidebar Navigation */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                   <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-ruah-200 mb-4">Tópicos</h4>
                   {FAQ_CATEGORIES.map((cat) => (
                      <button 
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center justify-between p-6 rounded-2xl border transition-all text-left ${
                          activeCategory === cat.id 
                          ? 'bg-ruah-950 text-white border-ruah-950 shadow-fancy' 
                          : 'bg-white text-ruah-300 border-ruah-100 hover:border-ruah-200'
                        }`}
                      >
                         <div className="flex items-center gap-4">
                            <cat.icon size={18} className={activeCategory === cat.id ? 'text-accent-gold' : 'text-ruah-100'} />
                            <span className="text-[11px] font-bold uppercase tracking-widest">{cat.label}</span>
                         </div>
                         <ArrowRight size={14} className={activeCategory === cat.id ? 'opacity-100' : 'opacity-0'} />
                      </button>
                   ))}
                </div>

                {/* FAQ Items */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                   {filteredCategories.find(c => c.id === activeCategory)?.questions.map((item, i) => (
                      <div 
                        key={i} 
                        className="bg-white border border-ruah-100 rounded-3xl overflow-hidden group hover:border-accent-gold/30 transition-all"
                      >
                         <button 
                           onClick={() => toggleItem(item.q)}
                           className="w-full p-8 flex items-center justify-between text-left"
                         >
                            <span className="text-lg font-serif uppercase italic leading-tight">{item.q}</span>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${openItems.includes(item.q) ? 'bg-ruah-950 text-white' : 'bg-ruah-50 text-ruah-200'}`}>
                               <ChevronDown size={18} className={`transition-transform duration-500 ${openItems.includes(item.q) ? 'rotate-180' : ''}`} />
                            </div>
                         </button>
                         <AnimatePresence>
                            {openItems.includes(item.q) && (
                               <motion.div 
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: 'auto', opacity: 1 }}
                                 exit={{ height: 0, opacity: 0 }}
                                 transition={{ duration: 0.4, ease: "circOut" }}
                               >
                                  <div className="px-8 pb-8">
                                     <div className="h-px bg-ruah-50 mb-8" />
                                     <p className="text-xs text-ruah-400 font-medium uppercase tracking-widest leading-loose">
                                        {item.a}
                                     </p>
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

       {/* Contact Support */}
       <section className="bg-ruah-50 py-32 border-t border-ruah-100">
          <div className="section-container">
             <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-12">
                <div className="flex flex-col gap-6">
                   <span className="tech-label text-accent-gold">Ainda tem dúvidas?</span>
                   <h2 className="text-5xl font-serif italic uppercase">CONCIERGE RUAH.</h2>
                   <p className="text-xs font-bold text-ruah-300 uppercase tracking-widest leading-loose">
                      Nossa equipe de atendimento está pronta para ouvir seu sopro e ajudar com qualquer detalhe do seu pedido.
                   </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                   <div className="p-8 bg-white rounded-3xl border border-ruah-100 flex flex-col items-center gap-4 group hover:border-accent-gold transition-all">
                      <Mail size={24} className="text-ruah-200 group-hover:text-accent-gold transition-colors" />
                      <div className="flex flex-col">
                         <span className="text-[8px] font-bold text-ruah-200 uppercase block mb-1">E-mail</span>
                         <span className="text-[10px] font-bold uppercase">falecom@useruah.com</span>
                      </div>
                   </div>
                   <div className="p-8 bg-white rounded-3xl border border-ruah-100 flex flex-col items-center gap-4 group hover:border-accent-gold transition-all">
                      <Phone size={24} className="text-ruah-200 group-hover:text-accent-gold transition-colors" />
                      <div className="flex flex-col">
                         <span className="text-[8px] font-bold text-ruah-200 uppercase block mb-1">Telefone</span>
                         <span className="text-[10px] font-bold uppercase">+55 11 9999-9999</span>
                      </div>
                   </div>
                   <div className="p-8 bg-white rounded-3xl border border-ruah-100 flex flex-col items-center gap-4 group hover:border-accent-gold transition-all">
                      <MessageSquare size={24} className="text-ruah-200 group-hover:text-accent-gold transition-colors" />
                      <div className="flex flex-col">
                         <span className="text-[8px] font-bold text-ruah-200 uppercase block mb-1">WhatsApp</span>
                         <span className="text-[10px] font-bold uppercase">Atendimento Viva</span>
                      </div>
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
