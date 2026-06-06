'use client';

import React from 'react';
import { RefreshCcw, Check, X, ArrowRight, Factory, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-white font-sans page-header-offset">
      <Header />
      <main>
        <section className="bg-ruah-950 text-white pt-28 lg:pt-36 pb-20 lg:pb-28 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-accent-gold/5 blur-[120px]" />
          <div className="section-container relative z-10">
            <div className="max-w-3xl">
              <span className="tech-label text-accent-gold mb-6 block italic">Manifesto de Fé</span>
              <h1 className="ur-type-display-lg italic uppercase mb-10 text-balance">
                Política de Compra <br />
                <span className="text-accent-gold">Consciente</span>
              </h1>
              <p className="text-sm text-white/75 leading-relaxed max-w-2xl">
                Trabalhamos sob demanda. Cada peça é iniciada após a confirmação do pedido, reduzindo desperdício e preservando a qualidade artesanal.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 border-b border-ruah-100">
          <div className="section-container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600"><Check size={16} /></div>
                  <h2 className="text-sm font-semibold text-ruah-950">Arrependimento</h2>
                </div>
                <p className="text-sm text-ruah-600 leading-relaxed">Até 7 dias após o recebimento, conforme CDC.</p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-gold/10 flex items-center justify-center text-accent-gold"><RefreshCcw size={16} /></div>
                  <h2 className="text-sm font-semibold text-ruah-950">Troca de Arte</h2>
                </div>
                <p className="text-sm text-ruah-600 leading-relaxed">Até 30 dias para troca de cor ou tamanho, com novo ciclo de produção.</p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-600"><AlertTriangle size={16} /></div>
                  <h2 className="text-sm font-semibold text-ruah-950">Falha Técnica</h2>
                </div>
                <p className="text-sm text-ruah-600 leading-relaxed">Até 90 dias para análise e priorização de nova manufatura.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="section-container">
            <div className="layout-grid-product gap-10 lg:gap-16">
              <div className="lg:col-span-4 flex flex-col gap-8 lg:sticky lg:top-24">
                <div className="flex flex-col gap-4">
                  <span className="tech-label text-accent-gold">Framework</span>
                  <h2 className="ur-type-display-md italic uppercase">Diretrizes de Manufatura</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {['Arrependimento', 'Ciclo de Sopro', 'Logística Reversa', 'Custos de Envio'].map((tab) => (
                    <button key={tab} className="w-full p-4 text-left bg-white border border-ruah-100 rounded-2xl text-sm font-semibold hover:border-accent-gold hover:text-accent-gold motion-base">
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-8 flex flex-col gap-10">
                <div className="flex flex-col gap-6 p-8 lg:p-10 bg-ruah-50 rounded-[2.5rem] border border-ruah-100 relative overflow-hidden">
                  <Factory size={140} className="absolute -bottom-10 -right-10 opacity-5" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-accent-gold shadow-sm"><Factory size={20} /></div>
                    <h3 className="text-2xl font-serif italic text-ruah-950">Ciclo sob demanda</h3>
                  </div>
                  <p className="text-sm text-ruah-600 leading-relaxed">
                    Como não trabalhamos com estoque, toda troca pode exigir novo ciclo de produção artesanal.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold">Etapa 1</span>
                      <p className="text-sm font-semibold text-ruah-950">Recebimento e análise (48h)</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold">Etapa 2</span>
                      <p className="text-sm font-semibold text-ruah-950">Nova produção conforme prazo original</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ruah-400">Condições de aceite</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: 'Tag original sem violação', status: true },
                      { label: 'Ausência de odores externos', status: true },
                      { label: 'Trama do tecido intacta', status: true },
                      { label: 'Embalagem original preservada', status: true },
                      { label: 'Marcas de uso ou lavagem', status: false },
                      { label: 'Alterações de alfaiataria', status: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-ruah-100">
                        <span className={`text-sm font-medium ${item.status ? 'text-ruah-900' : 'text-ruah-400'}`}>{item.label}</span>
                        {item.status ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-red-400" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-ruah-950 text-white p-8 lg:p-10 rounded-[2.5rem] flex flex-col gap-6">
                  <h3 className="text-3xl font-serif italic leading-none">Estornos e reembolsos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold">Cartão de crédito</span>
                      <p className="text-sm text-white/80 leading-relaxed">Visualização em até duas faturas após validação da logística reversa.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold">PIX direto</span>
                      <p className="text-sm text-white/80 leading-relaxed">Reembolso na conta de origem em até 5 dias úteis.</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border border-dashed border-ruah-200 rounded-3xl bg-ruah-50">
                  <p className="text-sm text-ruah-600 leading-relaxed">
                    <span className="text-ruah-950 font-semibold">Importante:</span> peças com artes customizadas ou sob medida só serão aceitas em caso comprovado de falha de manufatura.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20 lg:py-28 border-t border-ruah-100">
          <div className="section-container text-center flex flex-col items-center gap-8">
            <div className="flex flex-col gap-4">
              <h2 className="ur-type-display-md italic uppercase">
                Resolva <span className="text-accent-gold">Autonomamente</span>
              </h2>
              <p className="text-sm text-ruah-500 max-w-md mx-auto">Acesse o portal com CPF e número do pedido para solicitar troca ou devolução.</p>
            </div>
            <Link href="/returns" className="bg-ruah-950 text-white px-10 py-5 rounded-2xl text-sm font-semibold uppercase tracking-[0.12em] hover:bg-accent-gold motion-base shadow-fancy flex items-center gap-3 group">
              Acessar portal de trocas <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
