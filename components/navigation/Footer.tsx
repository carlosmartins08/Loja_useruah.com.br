'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Shield, Globe, ArrowRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-ruah-950 section-space relative overflow-hidden">
      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
        <span className="text-[30vw] font-serif uppercase absolute -top-20 -right-20">RUAH 2026</span>
      </div>
      
      <div className="section-container relative z-10 text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-24 pb-24 border-b border-white/5">
          {/* Brand Column */}
          <div className="flex flex-col gap-8 col-span-1 lg:col-span-1">
            <Image
              src="/brand/SVG/logo-wordmark-light.svg"
              alt="UseRuah"
              width={180}
              height={48}
              className="h-auto w-[180px]"
              priority
            />
            <p className="text-[10px] font-bold text-white/30 leading-relaxed uppercase tracking-[0.3em]">
              Expressão de fé através da moda. Conectando consumidores, artistas e comunidades em um respiro de arte e propósito.
            </p>
            <div className="flex gap-4">
               <div className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-ruah-950 transition-all cursor-pointer">
                  <Instagram size={16} />
               </div>
               <div className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-ruah-950 transition-all cursor-pointer">
                  <Globe size={16} />
               </div>
            </div>
          </div>

          {/* Navegação Column */}
          <div className="flex flex-col gap-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent-gold font-sans">Shop</span>
            <ul className="flex flex-col gap-4">
              {['Lançamentos', 'Best Sellers', 'Manifesto', 'Comunidade'].map(item => (
                <li key={item}>
                  <Link href="/shop" className="text-[10px] text-white/40 uppercase font-bold tracking-widest hover:text-white transition-colors flex items-center gap-2 group">
                    <span className="w-0 h-px bg-accent-gold group-hover:w-3 transition-all" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institucional Column */}
          <div className="flex flex-col gap-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/60 font-sans">Nossa História</span>
            <ul className="flex flex-col gap-4">
              {[
                { label: 'Manifesto Ruah', href: '/quem-somos' },
                { label: 'Ruah Journal', href: '/journal' },
                { label: 'Impacto Social', href: '/help-center' },
                { label: 'Seja um Artista', href: '/register' }
              ].map(item => (
                <li key={item.label}>
                  <Link href={item.href} className="text-[10px] text-white/40 uppercase font-bold tracking-widest hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Suporte & Segurança Column */}
          <div className="flex flex-col gap-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/60 font-sans">Privacidade</span>
            <ul className="flex flex-col gap-4">
              {[
                { label: 'Politicas de Amor', href: '/policies' },
                { label: 'Termos de Fé', href: '/policies' },
                { label: 'Sua Segurança', href: '/help-center' },
                { label: 'Guia de Medidas', href: '/policies' }
              ].map(item => (
                <li key={item.label}>
                  <Link href={item.href} className="text-[10px] text-white/40 uppercase font-bold tracking-widest hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Atendimento Column */}
          <div className="flex flex-col gap-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/60 font-sans">Atendimento</span>
            <div className="flex flex-col gap-6">
              <Link href="https://wa.me/5511999999999" target="_blank" className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Concierge Ruah</span>
                 </div>
                 <p className="text-[9px] text-white/40 uppercase font-medium tracking-widest mb-4">Estamos aqui para ouvir você.</p>
                 <span className="text-[10px] font-bold text-accent-gold uppercase tracking-widest group-hover:gap-4 flex items-center gap-2 transition-all">WhatsApp Oficial <ArrowRight size={12} /></span>
              </Link>
              <div className="flex items-center gap-4 px-6 py-4 bg-white/5 rounded-2xl border border-white/10">
                 <Shield size={18} className="text-accent-gold" />
                 <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest block text-white">Ambiente Seguro</span>
                    <span className="text-[8px] font-medium uppercase tracking-widest text-white/30">Criptografia de Fé</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 text-white/20">
          <div className="flex flex-col gap-3">
             <span className="text-[8px] font-bold uppercase tracking-[0.4em]">&copy; 2026 UseRuah Moda Cristã e Conexão LTDA.</span>
             <span className="text-[8px] font-medium uppercase tracking-[0.3em] max-w-2xl leading-relaxed">
               UseRuah - O sopro que nos conecta. 
               O USO DESTE SITE IMPLICA NA ACEITAÇÃO DOS TERMOS E CONDIÇÕES.
             </span>
          </div>
          <div className="flex items-center gap-10">
             <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Parceiros de Pagamento:</span>
             <div className="flex items-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all cursor-crosshair">
                <span className="text-[10px] font-bold italic tracking-tighter">VISA</span>
                <span className="text-[10px] font-bold italic tracking-tighter">AMEX</span>
                <span className="text-[10px] font-bold italic tracking-tighter">STRIPE</span>
                <span className="text-[10px] font-bold italic tracking-tighter">PIX</span>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

