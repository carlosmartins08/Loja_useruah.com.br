'use client';

import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { AppImage } from '@/components/shared/AppImage';
import { BRAND_EDITORIAL_ASSETS } from '@/lib/brand-assets';
import Link from 'next/link';
import React from 'react';

export function Hero() {
  return (
    <section id="hero-section" className="relative min-h-screen flex items-center bg-white py-16 lg:py-24 overflow-hidden">
      <div className="section-container relative z-10 w-full">
        <div className="layout-grid-media">
          <div className="lg:col-span-8 self-start">
            <div className="flex flex-col gap-10 lg:gap-14">
              <div className="flex gap-4 lg:gap-6">
                <div className="relative w-1/3 aspect-[3/4] rounded-[2rem] lg:rounded-3xl overflow-hidden mt-8 lg:mt-16">
                  <AppImage
                    context="content-banner"
                    src={BRAND_EDITORIAL_ASSETS.heroLeft}
                    alt="Fé 1"
                    fill
                    priority
                    sizes="(max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <div className="relative w-2/3 aspect-[16/10] lg:aspect-[16/9] rounded-[2rem] lg:rounded-3xl overflow-hidden">
                  <AppImage
                    context="content-banner"
                    src={BRAND_EDITORIAL_ASSETS.heroCenter}
                    alt="Fé 2"
                    fill
                    priority
                    sizes="(max-width: 1024px) 66vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h1 className="ur-type-display-xl leading-[0.86] tracking-tight text-ruah-950 uppercase italic font-black max-w-[10ch]">
                  VISTA-SE DE <br />
                  <span className="not-italic">ORAÇÃO.</span>
                </h1>
                <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10 mt-10 lg:mt-12">
                  <Link href="/shop" className="bg-ruah-950 text-white rounded-full px-12 py-5 lg:py-6 font-bold uppercase text-[10px] lg:text-[11px] tracking-[0.3em] hover:bg-accent-gold transition-all flex items-center justify-center lg:justify-start gap-4 active:scale-95 shadow-2xl shadow-ruah-950/20">
                    Ver Catálogo Publicado <ArrowRight size={18} />
                  </Link>
                  <div className="h-px flex-1 bg-ruah-100 hidden lg:block" />
                </div>
              </motion.div>
            </div>
          </div>

          <div className="lg:col-span-4 self-start flex flex-col gap-10 lg:gap-8 pb-4 relative">
            <div className="hidden lg:flex absolute -left-16 top-0 h-full items-center">
              <div className="flex flex-col items-center gap-6">
                <span className="[writing-mode:vertical-lr] text-[9px] font-bold uppercase tracking-[0.5em] text-ruah-200">Inspiração</span>
                <motion.div
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-px h-16 bg-gradient-to-b from-ruah-200 to-transparent"
                />
              </div>
            </div>

            <div className="relative w-full aspect-square rounded-[2.5rem] lg:rounded-3xl overflow-hidden mb-2 shadow-2xl">
              <AppImage
                context="content-banner"
                src={BRAND_EDITORIAL_ASSETS.heroRight}
                alt="Fé 3"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover"
              />
              <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-md px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest text-accent-gold shadow-xl">
                Manifesto Ruah
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:gap-4 px-2 lg:px-0">
              <p className="text-base text-ruah-600 leading-relaxed max-w-sm lg:max-w-xs font-medium">
                A UseRuah reúne peças autorais já publicadas, produzidas sob demanda e organizadas por uma leitura editorial clara. Menos promessa abstrata, mais catálogo que você realmente consegue comprar hoje.
              </p>
              <Link href="/quem-somos" className="text-[11px] font-bold uppercase tracking-[0.2em] text-ruah-950 border-b-2 border-accent-gold inline-block self-start pb-2 hover:text-accent-gold transition-colors">
                Entender a Marca
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-1/2 -right-[10vw] -translate-y-1/2 rotate-90 pointer-events-none opacity-[0.03]">
        <span className="text-[30vw] font-serif uppercase whitespace-nowrap">UseRuah</span>
      </div>
    </section>
  );
}
