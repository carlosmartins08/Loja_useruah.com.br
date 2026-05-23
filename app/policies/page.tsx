'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, RefreshCcw, Banknote, Calendar, Check, X, Info, FileText, ArrowRight, Factory, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-white font-sans page-header-offset">
      <Header />
      <main>
       {/* Hero - Conscious Manifesto */}
       <section className="bg-ruah-950 text-white pt-40 pb-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-accent-gold/5 blur-[120px]" />
          <div className="section-container relative z-10">
             <div className="max-w-3xl">
                <span className="tech-label text-accent-gold mb-6 block italic">Manifesto de Fé</span>
                <h1 className="text-6xl lg:text-8xl font-serif italic uppercase leading-none mb-12 text-balance">POLÍTICA DE COMPRA <br /> <span className="text-accent-gold">CONSCIENTE.</span></h1>
                <p className="text-sm font-bold text-white/40 uppercase tracking-[0.4em] leading-loose">
                   Na Ruah, operamos sob o modelo de sopro sob demanda. Cada peça é iniciada após o Handover do seu pedido, evitando o desperdício e garantindo a alma de cada arte autoral.
                </p>
             </div>
          </div>
       </section>

       {/* Fast Summary Grid */}
       <section className="py-24 border-b border-ruah-100">
          <div className="section-container">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="flex flex-col gap-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                         <Check size={16} />
                      </div>
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-ruah-950">Arrependimento</h2>
                   </div>
                   <p className="text-[11px] font-bold text-ruah-400 uppercase tracking-widest leading-relaxed">
                      Até 7 dias após o recebimento. Garantimos estorno integral conforme CDC para sua paz de espírito.
                   </p>
                </div>
                <div className="flex flex-col gap-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                         <RefreshCcw size={16} />
                      </div>
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-ruah-950">Troca de Arte</h2>
                   </div>
                   <p className="text-[11px] font-bold text-ruah-400 uppercase tracking-widest leading-relaxed">
                      Até 30 dias para re-especificação (cor ou tamanho). Novo ciclo de sopro iniciado.
                   </p>
                </div>
                <div className="flex flex-col gap-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-600">
                         <AlertTriangle size={16} />
                      </div>
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-ruah-950">Falha Técnica</h2>
                   </div>
                   <p className="text-[11px] font-bold text-ruah-400 uppercase tracking-widest leading-relaxed">
                      Até 90 dias com prioridade absoluta de nova manufatura artesanal e envio expresso.
                   </p>
                </div>
             </div>
          </div>
       </section>

       {/* Detailed Policies */}
       <section className="py-32">
          <div className="section-container">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                <div className="lg:col-span-4 flex flex-col gap-12 sticky top-40 h-fit">
                   <div className="flex flex-col gap-6">
                      <span className="tech-label text-accent-gold">The Framework</span>
                      <h2 className="text-4xl font-serif italic uppercase leading-tight">DIRETRIZES DE <br /> MANUFATURA.</h2>
                   </div>
                   <div className="flex flex-col gap-4">
                      {['Arrependimento', 'Ciclo de Sopro', 'Logística Reversa', 'Custos de Envio'].map((tab) => (
                        <button key={tab} className="w-full p-6 text-left bg-white border border-ruah-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-accent-gold hover:text-accent-gold transition-all">
                           {tab}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="lg:col-span-8 flex flex-col gap-16">
                   {/* Production Cycle */}
                   <div className="flex flex-col gap-8 p-12 bg-ruah-50 rounded-[3rem] border border-ruah-100 relative overflow-hidden">
                      <Factory size={160} className="absolute -bottom-10 -right-10 opacity-5" />
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-accent-gold shadow-sm">
                            <Factory size={20} />
                         </div>
                         <h3 className="text-2xl font-serif italic uppercase text-ruah-950">O Ciclo On-Demand</h3>
                      </div>
                      <div className="flex flex-col gap-6 relative z-10">
                         <p className="text-xs text-ruah-500 font-bold uppercase tracking-widest leading-loose">
                            Como não trabalhamos com estoques, a troca implica em um <span className="text-ruah-950 font-black">novo ciclo de produção artesanal</span>. Respeitamos o tempo das mãos que criam.
                         </p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col gap-3">
                               <span className="text-[8px] font-black text-accent-gold uppercase tracking-widest">Etapa 1</span>
                               <p className="text-[10px] font-black uppercase text-ruah-950">Recebimento e Análise de Arte (48h)</p>
                            </div>
                            <div className="flex flex-col gap-3">
                               <span className="text-[8px] font-black text-accent-gold uppercase tracking-widest">Etapa 2</span>
                               <p className="text-[10px] font-black uppercase text-ruah-950">Novo Sopro Manual (X dias originais)</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Checklist */}
                   <div className="flex flex-col gap-12">
                      <div className="flex flex-col gap-4">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-ruah-300">Condições de Aceite</h3>
                         <div className="h-px bg-ruah-100" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                         {[
                           { label: 'Tag original sem violação', status: true },
                           { label: 'Ausência de odores externos', status: true },
                           { label: 'Trama do tecido intacta', status: true },
                           { label: 'Embalagem original preservada', status: true },
                           { label: 'Marcas de uso ou lavagem', status: false },
                           { label: 'Alterações de alfaiataria', status: false }
                         ].map((item, i) => (
                           <div key={i} className="flex items-center justify-between py-4 border-b border-ruah-50">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${item.status ? 'text-ruah-950' : 'text-ruah-300'}`}>
                                {item.label}
                              </span>
                              {item.status ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-red-300" />}
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Refund Info */}
                   <div className="bg-ruah-950 text-white p-16 rounded-[3rem] flex flex-col gap-10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-full bg-accent-gold/10 blur-3xl" />
                      <div className="flex flex-col gap-4 relative z-10">
                         <h3 className="text-3xl font-serif italic uppercase leading-none">Estornos e <br /> Reembolsos.</h3>
                         <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Protocolo de integridade financeira</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                         <div className="flex flex-col gap-4">
                            <span className="tech-label text-accent-gold">Cartão de Crédito</span>
                            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest leading-loose">
                               Visualização em até <span className="text-white">duas faturas</span> após confirmação da logística reversa.
                            </p>
                         </div>
                         <div className="flex flex-col gap-4">
                            <span className="tech-label text-accent-gold">PIX Direto</span>
                            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest leading-loose">
                               Reembolso efetuado na mesma conta de origem em até <span className="text-white">5 dias úteis</span>.
                            </p>
                         </div>
                      </div>
                   </div>

                   <div className="p-8 border border-dashed border-ruah-200 rounded-3xl bg-ruah-50">
                      <p className="text-[9px] font-black text-ruah-400 uppercase tracking-widest leading-loose">
                         <span className="text-ruah-950 font-black">IMPORTANTE:</span> Peças produzidas com artes customizadas ou sob medida exclusiva só serão aceitas em caso comprovado de falha de manufatura em relação ao Handover original.
                      </p>
                   </div>
                </div>
             </div>
          </div>
       </section>

       {/* CTA to Portal */}
       <section className="bg-white py-32 border-t border-ruah-100">
          <div className="section-container text-center flex flex-col items-center gap-12">
             <div className="flex flex-col gap-4">
                <h2 className="text-5xl font-serif italic uppercase leading-tight">RESOLVA <br /> <span className="text-accent-gold">AUTONOMAMENTE.</span></h2>
                <p className="text-xs font-black text-ruah-400 uppercase tracking-widest max-w-sm mx-auto">
                   Acesse nosso portal com seu CPF e número do pedido para manifestar seu arrependimento ou troca.
                </p>
             </div>
             <Link href="/returns" className="bg-ruah-950 text-white px-12 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] hover:bg-accent-gold transition-all shadow-fancy flex items-center gap-4 group">
                ACESSAR PORTAL DE TROCAS <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </Link>
          </div>
       </section>
      </main>
      <Footer />
    </div>
  );
}
