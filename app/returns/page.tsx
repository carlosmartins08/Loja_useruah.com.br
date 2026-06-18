'use client';

import React from 'react';
import { ArrowRight, FileText, Package, RefreshCcw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/navigation/Footer';
import { Header } from '@/components/navigation/Header';

const NEXT_STEPS = [
  {
    title: 'Pedidos da conta',
    description: 'Se a compra está no seu histórico, o caminho mais seguro é começar por lá. Isso evita pedido solto e reduz retrabalho no atendimento.',
    href: '/account/orders',
    cta: 'Abrir meus pedidos',
    icon: Package,
  },
  {
    title: 'Suporte autenticado',
    description: 'Quando houver dúvida, troca parcial ou contexto fora do padrão, abra um ticket. A operação consegue rastrear melhor o caso com sessão real.',
    href: '/account/support',
    cta: 'Abrir suporte',
    icon: ShieldCheck,
  },
  {
    title: 'Regras da loja',
    description: 'Antes de iniciar qualquer solicitação, confira prazos, critérios de aceite e limitações do fluxo sob demanda.',
    href: '/policies',
    cta: 'Ler políticas',
    icon: FileText,
  },
];

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-white page-header-offset">
      <Header />

      <section className="bg-ruah-950 text-white pt-28 lg:pt-36 pb-20 lg:pb-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(197,160,89,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.05),transparent_24%)]" />
        <div className="section-container relative z-10">
          <div className="layout-grid-media gap-12 lg:gap-16 items-end">
            <div className="lg:col-span-7 max-w-3xl">
              <span className="tech-label text-accent-gold mb-6 block">Trocas e devoluções</span>
              <h1 className="ur-type-display-lg italic uppercase mb-10">
                Retorno com <br /> contexto real.
              </h1>
              <p className="text-sm font-medium uppercase tracking-[0.18em] leading-relaxed text-white/65 max-w-2xl">
                Esta página não simula mais um portal autônomo com busca pública. O fluxo real depende do pedido autenticado ou de atendimento registrado.
              </p>
            </div>

            <div className="lg:col-span-5 rounded-[3rem] border border-white/10 bg-white/5 p-8 lg:p-10 backdrop-blur-sm shadow-fancy">
              <span className="tech-label text-accent-gold">Como funciona hoje</span>
              <h2 className="mt-5 text-3xl font-serif italic uppercase leading-none text-white">Menos teatro, mais rastreabilidade.</h2>
              <p className="mt-5 text-sm font-medium leading-relaxed text-white/70">
                A UseRuah já sustenta pedido, conta do cliente e suporte autenticado. Então o caminho certo para trocas e devoluções é usar essas superfícies, não um lookup fictício.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                <div className="flex flex-col gap-2">
                  <span className="text-2xl font-serif italic font-black text-white">1</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Pedido rastreável</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-2xl font-serif italic font-black text-white">1</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Conta autenticada</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-2xl font-serif italic font-black text-white">0</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Fluxo cenográfico</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 border-b border-ruah-100 bg-[linear-gradient(180deg,rgba(250,250,250,0.85),rgba(255,255,255,1))]">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {NEXT_STEPS.map((item) => (
              <Link key={item.title} href={item.href} className="group flex flex-col gap-4 rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-subtle hover:border-accent-gold/40 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-ruah-50 flex items-center justify-center text-accent-gold">
                  <item.icon size={20} />
                </div>
                <h2 className="text-sm font-semibold text-ruah-950">{item.title}</h2>
                <p className="text-sm text-ruah-600 leading-relaxed flex-1">{item.description}</p>
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold flex items-center gap-2">
                  {item.cta} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12">
            <div className="rounded-[3rem] border border-ruah-100 bg-ruah-50 p-8 lg:p-12 shadow-subtle">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-accent-gold shadow-sm">
                  <RefreshCcw size={24} />
                </div>
                <div>
                  <span className="tech-label text-accent-gold">Critério operacional</span>
                  <h2 className="mt-2 text-3xl font-serif italic uppercase text-ruah-950">O que já está claro</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-[2rem] border border-ruah-100 bg-white p-6">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent-gold">Arrependimento</span>
                  <p className="mt-3 text-sm text-ruah-600 leading-relaxed">Até 7 dias após o recebimento, conforme CDC e política vigente.</p>
                </div>
                <div className="rounded-[2rem] border border-ruah-100 bg-white p-6">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent-gold">Produto sob demanda</span>
                  <p className="mt-3 text-sm text-ruah-600 leading-relaxed">Troca de tamanho ou cor pode exigir novo ciclo de produção, então a triagem precisa olhar o caso real.</p>
                </div>
                <div className="rounded-[2rem] border border-ruah-100 bg-white p-6">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent-gold">Falha de manufatura</span>
                  <p className="mt-3 text-sm text-ruah-600 leading-relaxed">Defeitos e avarias seguem análise operacional antes de troca, crédito ou estorno.</p>
                </div>
                <div className="rounded-[2rem] border border-ruah-100 bg-white p-6">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent-gold">Sem portal anônimo</span>
                  <p className="mt-3 text-sm text-ruah-600 leading-relaxed">Hoje não existe emissão pública de etiqueta nem consulta aberta por CPF em uma tela desacoplada do pedido.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[3rem] border border-ruah-100 bg-white p-8 lg:p-12 shadow-fancy">
              <span className="tech-label text-accent-gold">Próximo passo recomendado</span>
              <h2 className="mt-5 text-4xl font-serif italic uppercase leading-none text-ruah-950">Comece pelo pedido, não pelo formulário.</h2>
              <p className="mt-6 text-sm font-medium leading-relaxed text-ruah-600">
                Se a compra já está na sua conta, vá para o histórico de pedidos. Se o caso sair do padrão, abra um ticket. Isso mantém a operação rastreável e evita uma promessa de autoatendimento que o sistema ainda não fecha.
              </p>
              <div className="mt-8 flex flex-col gap-4">
                <Link href="/account/orders" className="bg-ruah-950 text-white px-8 py-5 rounded-2xl text-sm font-semibold uppercase tracking-[0.12em] hover:bg-accent-gold transition-all shadow-fancy flex items-center justify-center gap-3">
                  Ver meus pedidos <ArrowRight size={18} />
                </Link>
                <Link href="/help-center" className="border border-ruah-100 px-8 py-5 rounded-2xl text-sm font-semibold uppercase tracking-[0.12em] text-ruah-950 hover:border-accent-gold hover:text-accent-gold transition-all flex items-center justify-center gap-3">
                  Ir para a central de ajuda <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
