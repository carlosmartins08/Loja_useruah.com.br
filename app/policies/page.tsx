'use client';

import React from 'react';
import { AlertTriangle, ArrowRight, Check, Factory, RefreshCcw, X } from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/navigation/Footer';
import { Header } from '@/components/navigation/Header';

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-white font-sans page-header-offset">
      <Header />
      <main>
        <section className="bg-ruah-950 text-white pt-28 lg:pt-36 pb-20 lg:pb-28 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-accent-gold/5 blur-[120px]" />
          <div className="section-container relative z-10">
            <div className="max-w-3xl">
              <span className="tech-label text-accent-gold mb-6 block">Políticas da loja</span>
              <h1 className="ur-type-display-lg italic uppercase mb-10 text-balance">
                Compra sob demanda <br />
                <span className="text-accent-gold">com regra clara</span>
              </h1>
              <p className="text-sm text-white/75 leading-relaxed max-w-2xl">
                A operação da UseRuah é simples no que importa: peça publicada, produção após compra, critérios de troca objetivos e atendimento rastreável quando o caso sai do padrão.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 border-b border-ruah-100 bg-[linear-gradient(180deg,rgba(250,250,250,0.85),rgba(255,255,255,1))]">
          <div className="section-container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col gap-4 rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600"><Check size={16} /></div>
                  <h2 className="text-sm font-semibold text-ruah-950">Arrependimento</h2>
                </div>
                <p className="text-sm text-ruah-600 leading-relaxed">Até 7 dias após o recebimento, conforme CDC.</p>
              </div>

              <div className="flex flex-col gap-4 rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-gold/10 flex items-center justify-center text-accent-gold"><RefreshCcw size={16} /></div>
                  <h2 className="text-sm font-semibold text-ruah-950">Troca de tamanho ou cor</h2>
                </div>
                <p className="text-sm text-ruah-600 leading-relaxed">Pode exigir novo ciclo de produção, porque a peça nasce sob demanda.</p>
              </div>

              <div className="flex flex-col gap-4 rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-600"><AlertTriangle size={16} /></div>
                  <h2 className="text-sm font-semibold text-ruah-950">Falha técnica</h2>
                </div>
                <p className="text-sm text-ruah-600 leading-relaxed">Defeitos e avarias passam por análise operacional antes de reposição, crédito ou estorno.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_26%,rgba(197,160,89,0.08),transparent_24%)]" />
          <div className="section-container">
            <div className="layout-grid-product gap-10 lg:gap-16">
              <div className="lg:col-span-4 flex flex-col gap-8 lg:sticky lg:top-24">
                <div className="flex flex-col gap-4">
                  <span className="tech-label text-accent-gold">Base operacional</span>
                  <h2 className="ur-type-display-md italic uppercase">Como tratamos seu pedido</h2>
                </div>
                <div className="flex flex-col gap-3 rounded-[2.5rem] border border-ruah-100 bg-white p-5 shadow-subtle">
                  {['Arrependimento legal', 'Produção sob demanda', 'Logística reversa', 'Reembolso'].map((item) => (
                    <div key={item} className="w-full p-4 bg-white border border-ruah-100 rounded-2xl text-sm font-semibold text-ruah-950">
                      {item}
                    </div>
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
                    Como não trabalhamos com estoque, parte das trocas pode exigir nova produção. Isso não é defeito do fluxo; é a consequência direta da operação escolhida.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold">Etapa 1</span>
                      <p className="text-sm font-semibold text-ruah-950">Recebimento e análise inicial</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold">Etapa 2</span>
                      <p className="text-sm font-semibold text-ruah-950">Definição entre troca, crédito ou estorno</p>
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
                      { label: 'Alterações de costura ou ajuste', status: false },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-ruah-100">
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
                      <p className="text-sm text-white/80 leading-relaxed">Visualização em até duas faturas após a conclusão do processo operacional.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold">PIX</span>
                      <p className="text-sm text-white/80 leading-relaxed">Reembolso na conta de origem em até 5 dias úteis depois da aprovação.</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border border-dashed border-ruah-200 rounded-3xl bg-ruah-50 shadow-subtle">
                  <p className="text-sm text-ruah-600 leading-relaxed">
                    <span className="text-ruah-950 font-semibold">Importante:</span> pedidos tratados fora do fluxo padrão dependem de contexto registrado no atendimento. A política válida é a que o runtime realmente consegue rastrear.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20 lg:py-28 border-t border-ruah-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(197,160,89,0.06),transparent_28%)]" />
          <div className="section-container text-center flex flex-col items-center gap-8">
            <div className="flex flex-col gap-4">
              <span className="tech-label text-accent-gold">Próximo passo</span>
              <h2 className="ur-type-display-md italic uppercase">
                Inicie pelo <span className="text-accent-gold">pedido real</span>
              </h2>
              <p className="text-sm text-ruah-500 max-w-md mx-auto">Use a jornada de trocas e devoluções que já existe hoje no produto, sem depender de um portal cenográfico.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/returns" className="bg-ruah-950 text-white px-10 py-5 rounded-2xl text-sm font-semibold uppercase tracking-[0.12em] hover:bg-accent-gold motion-base shadow-fancy flex items-center gap-3 group relative z-10">
                Ver instruções de troca <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/account/orders" className="border border-ruah-100 text-ruah-950 px-10 py-5 rounded-2xl text-sm font-semibold uppercase tracking-[0.12em] hover:border-accent-gold hover:text-accent-gold motion-base flex items-center gap-3">
                Abrir meus pedidos <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
