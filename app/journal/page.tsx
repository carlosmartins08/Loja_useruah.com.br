'use client';

import React from 'react';
import { Header } from '@/components/navigation/Header';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Calendar, User, Clock } from 'lucide-react';
import { AppImage } from '@/components/shared/AppImage';
import { BRAND_JOURNAL_ARTICLES } from '@/lib/brand-assets';

export default function JournalPage() {
  const [featuredArticle, ...articles] = BRAND_JOURNAL_ARTICLES;

  return (
    <main className="bg-white pb-32 page-header-offset">
      <Header />

      <section className="pt-12 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(197,160,89,0.12),transparent_28%),radial-gradient(circle_at_85%_16%,rgba(23,44,54,0.08),transparent_24%)]" />
        <div className="section-container relative z-10">
          <Breadcrumbs items={[{ label: 'Editorial', href: '/journal' }, { label: 'Journal' }]} className="mb-12" />
          <div className="layout-grid-media gap-12 lg:gap-16 items-end">
            <div className="lg:col-span-7 max-w-4xl">
              <span className="tech-label text-accent-gold mb-8 block">UseRuah Journal</span>
              <h1 className="ur-type-display-xl uppercase mb-10 italic">
                A FORMA
                <br />
                DO <span className="not-italic">SOPRO.</span>
              </h1>
              <p className="text-sm font-medium uppercase tracking-[0.2em] leading-relaxed text-ruah-500 max-w-2xl">
                Leituras sobre direção criativa, produto, fé e atmosfera. Sem enfeite teórico. Só o que ajuda a marca a parecer ela mesma.
              </p>
            </div>

            <div className="lg:col-span-5 rounded-[3rem] border border-ruah-100 bg-white/90 p-8 lg:p-10 shadow-fancy backdrop-blur-sm">
              <span className="tech-label text-accent-gold">Recorte editorial</span>
              <h2 className="mt-5 text-3xl font-serif italic uppercase leading-none text-ruah-950">Conteúdo para reforçar a visão da marca.</h2>
              <p className="mt-5 text-sm font-medium leading-relaxed text-ruah-500">
                O journal precisa funcionar como extensão da loja. Ele não pode parecer um blog genérico nem desviar o tema central da marca.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-ruah-100 pt-6">
                <div className="flex flex-col gap-2">
                  <span className="text-2xl font-serif italic font-black text-ruah-950">{BRAND_JOURNAL_ARTICLES.length}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ruah-400">Leituras</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-2xl font-serif italic font-black text-ruah-950">1</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ruah-400">Idioma</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-2xl font-serif italic font-black text-ruah-950">Ruah</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ruah-400">Centro narrativo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container pb-32">
        <article className="group relative aspect-[21/9] rounded-[4rem] overflow-hidden block shadow-fancy">
          <AppImage
            context="content-banner"
            src={featuredArticle.image}
            alt={featuredArticle.title}
            fill
            className="object-cover transition-transform motion-slow group-hover:scale-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ruah-950/85 via-ruah-950/20 to-transparent flex flex-col justify-end p-10 lg:p-20">
            <div className="flex flex-col gap-6 max-w-3xl">
              <div className="flex flex-wrap items-center gap-6">
                <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-widest text-white border border-white/20">
                  {featuredArticle.category}
                </span>
                <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-widest">
                  <Calendar size={14} />
                  {featuredArticle.date}
                </div>
                <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-widest">
                  <Clock size={14} />
                  {featuredArticle.readTime}
                </div>
              </div>
              <h2 className="ur-type-display-md text-white uppercase">{featuredArticle.title}</h2>
              <p className="max-w-2xl text-sm font-medium leading-relaxed text-white/70">{featuredArticle.excerpt}</p>
              <div className="text-white/70 font-bold uppercase text-[10px] tracking-widest">
                Recorte editorial em destaque
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {articles.map((article) => (
            <article key={article.id} className="group flex flex-col gap-8">
              <div className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden shadow-xl">
                <AppImage context="content-banner" src={article.image} alt={article.title} fill className="object-cover group-hover:scale-[1.05] transition-transform motion-slow" />
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-accent-gold text-[10px] font-bold uppercase tracking-widest">{article.category}</span>
                  <span className="text-ruah-300 text-[10px] font-bold uppercase tracking-widest">{article.date}</span>
                  <span className="text-ruah-300 text-[10px] font-bold uppercase tracking-widest">{article.readTime}</span>
                </div>
                <h3 className="text-3xl font-serif leading-tight uppercase">{article.title}</h3>
                <p className="text-sm text-ruah-400 font-medium leading-relaxed">{article.excerpt}</p>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-8 h-8 rounded-full bg-ruah-50 flex items-center justify-center">
                    <User size={14} className="text-ruah-300" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ruah-300">Por {article.author}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
