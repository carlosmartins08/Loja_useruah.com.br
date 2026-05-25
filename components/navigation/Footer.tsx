'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Shield, Globe, ArrowRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-ruah-950 section-space relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
        <span className="text-[30vw] font-serif uppercase absolute -top-20 -right-20">RUAH 2026</span>
      </div>

      <div className="section-container relative z-10 text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20 pb-20 border-b border-white/10">
          <div className="flex flex-col gap-6 col-span-1 lg:col-span-1">
            <Image src="/brand/SVG/logo-wordmark-light.svg" alt="UseRuah" width={180} height={48} className="h-auto w-[180px]" priority />
            <p className="text-sm text-white/70 leading-relaxed max-w-xs">
              Expressão de fé através da moda. Conectando consumidores, artistas e comunidades em um respiro de arte e propósito.
            </p>
            <div className="flex gap-3">
              <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white hover:text-ruah-950 transition-all cursor-pointer">
                <Instagram size={16} />
              </div>
              <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white hover:text-ruah-950 transition-all cursor-pointer">
                <Globe size={16} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-gold">Shop</span>
            <ul className="flex flex-col gap-3">
              {['Lançamentos', 'Best Sellers', 'Manifesto', 'Comunidade'].map((item) => (
                <li key={item}>
                  <Link href="/shop" className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2 group">
                    <span className="w-0 h-px bg-accent-gold group-hover:w-3 transition-all" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-6">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">Nossa História</span>
            <ul className="flex flex-col gap-3">
              {[
                { label: 'Manifesto Ruah', href: '/quem-somos' },
                { label: 'Ruah Journal', href: '/journal' },
                { label: 'Impacto Social', href: '/help-center' },
                { label: 'Seja um Artista', href: '/register' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-white/70 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-6">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">Privacidade</span>
            <ul className="flex flex-col gap-3">
              {[
                { label: 'Políticas de Amor', href: '/policies' },
                { label: 'Termos de Fé', href: '/policies' },
                { label: 'Sua Segurança', href: '/help-center' },
                { label: 'Guia de Medidas', href: '/policies' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-white/70 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-6">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">Atendimento</span>
            <div className="flex flex-col gap-4">
              <Link href="https://wa.me/5511999999999" target="_blank" className="bg-white/5 border border-white/15 rounded-2xl p-5 hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white">Concierge Ruah</span>
                </div>
                <p className="text-sm text-white/70 mb-3">Estamos aqui para ouvir você.</p>
                <span className="text-xs font-semibold text-accent-gold uppercase tracking-[0.08em] group-hover:gap-3 flex items-center gap-2 transition-all">
                  WhatsApp Oficial <ArrowRight size={12} />
                </span>
              </Link>
              <div className="flex items-center gap-3 px-5 py-4 bg-white/5 rounded-2xl border border-white/15">
                <Shield size={18} className="text-accent-gold" />
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] block text-white">Ambiente Seguro</span>
                  <span className="text-xs text-white/60">Criptografia de fé</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 text-white/50">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.1em]">© 2026 UseRuah Moda Cristã e Conexão LTDA.</span>
            <span className="text-xs leading-relaxed max-w-2xl">UseRuah - O sopro que nos conecta. O uso deste site implica na aceitação dos termos e condições.</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] opacity-70">Parceiros de Pagamento:</span>
            <div className="flex items-center gap-4 opacity-70 grayscale hover:grayscale-0 transition-all">
              <span className="text-xs font-semibold italic">VISA</span>
              <span className="text-xs font-semibold italic">AMEX</span>
              <span className="text-xs font-semibold italic">STRIPE</span>
              <span className="text-xs font-semibold italic">PIX</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

