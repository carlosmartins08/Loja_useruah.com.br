'use client';

import React from 'react';
import { Header } from '@/components/navigation/Header';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { ArrowRight, Calendar, User, Clock } from 'lucide-react';
import { AppImage } from '@/components/shared/AppImage';
import Link from 'next/link';

const ARTICLES = [
  {
    id: 1,
    title: 'Como a Luz Circadiana Aumenta a Produtividade em 30%',
    excerpt: 'Estudos recentes mostram que a temperatura de cor correta pode redefinir o foco cognitivo no ambiente de trabalho corporativo.',
    category: 'Bio-Hacking',
    author: 'Dr. Lukas Meyer',
    date: '12 Out 2026',
    image: 'https://picsum.photos/seed/blog-1/1200/800'
  },
  {
    id: 2,
    title: 'Minimalismo Real: Quando a LuminÃ¡ria se Torna InvisÃ­vel',
    excerpt: 'A tendÃªncia do design "Ghost Architecture" onde a infraestrutura lumÃ­nica Ã© integrada estruturalmente ao forro.',
    category: 'Arquitetura',
    author: 'Hans Weber',
    date: '05 Set 2026',
    image: 'https://picsum.photos/seed/blog-2/1200/800'
  }
];

export default function JournalPage() {
  return (
    <main className="bg-white pb-32 page-header-offset">
       <Header />

       <section className="pt-12 pb-32">
          <div className="section-container">
             <Breadcrumbs 
               items={[{ label: 'Editorial', href: '/journal' }, { label: 'Journal' }]} 
               className="mb-12"
             />
             <div className="max-w-4xl">
                <span className="tech-label text-accent-blue mb-8 block">UseRuah Journal</span>
                <h1 className="text-7xl lg:text-9xl font-serif leading-[0.85] tracking-tighter uppercase mb-16 italic">
                   A CIÃŠNCIA <br /> DA <span className="not-italic">LUZ.</span>
                </h1>
                <p className="text-lg font-medium uppercase tracking-[0.2em] leading-relaxed text-lumina-500 max-w-xl">
                   Explorando a intersecÃ§Ã£o entre biologia, engenharia e design. Uma curadoria de insights para arquitetos e visionÃ¡rios.
                </p>
             </div>
          </div>
       </section>

       {/* Featured Article */}
       <section className="section-container pb-32">
          <Link href={`/journal/${ARTICLES[0].id}`} className="group relative aspect-[21/9] rounded-[4rem] overflow-hidden block">
             <AppImage context="content-banner" 
               src={ARTICLES[0].image} 
               alt={ARTICLES[0].title} 
               fill 
               className="object-cover transition-transform duration-1000 group-hover:scale-105" 
               referrerPolicy="no-referrer"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-lumina-950/80 via-lumina-950/20 to-transparent flex flex-col justify-end p-20">
                <div className="flex flex-col gap-6 max-w-3xl">
                   <div className="flex items-center gap-6">
                      <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-widest text-white border border-white/20">
                         {ARTICLES[0].category}
                      </span>
                      <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-widest">
                         <Calendar size={14} />
                         {ARTICLES[0].date}
                      </div>
                   </div>
                   <h2 className="text-4xl lg:text-6xl text-white font-serif leading-tight uppercase font-bold tracking-tight">
                      {ARTICLES[0].title}
                   </h2>
                   <div className="flex items-center gap-4 text-white font-bold uppercase text-[10px] tracking-widest border-b border-white/30 self-start pb-1 group-hover:border-white transition-all">
                      Ler Artigo Completo <ArrowRight size={16} />
                   </div>
                </div>
             </div>
          </Link>
       </section>

       {/* Article Grid */}
       <section className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             {ARTICLES.slice(1).map(article => (
                <Link key={article.id} href={`/journal/${article.id}`} className="group flex flex-col gap-8">
                   <div className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden shadow-xl">
                      <AppImage context="content-banner" src={article.image} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                   </div>
                   <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                         <span className="text-accent-blue text-[10px] font-bold uppercase tracking-widest">{article.category}</span>
                         <span className="text-lumina-300 text-[10px] font-bold uppercase tracking-widest">{article.date}</span>
                      </div>
                      <h3 className="text-3xl font-serif leading-tight uppercase">{article.title}</h3>
                      <p className="text-sm text-lumina-400 font-medium uppercase tracking-widest leading-relaxed">
                         {article.excerpt}
                      </p>
                      <div className="flex items-center gap-3 mt-4">
                         <div className="w-8 h-8 rounded-full bg-lumina-50 flex items-center justify-center">
                            <User size={14} className="text-lumina-300" />
                         </div>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-lumina-300">By {article.author}</span>
                      </div>
                   </div>
                </Link>
             ))}
          </div>
       </section>
    </main>
  );
}

