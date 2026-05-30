'use client';

import React from 'react';
import { AppImage } from '@/components/shared/AppImage';
import { X, ZoomIn } from 'lucide-react';

interface MediaItem {
  label: string;
  src: string;
}

interface ProductMediaGalleryProps {
  heroImage: string;
  detailImages: MediaItem[];
  modelMockups: MediaItem[];
  productName: string;
}

export function ProductMediaGallery({ heroImage, detailImages, modelMockups, productName }: ProductMediaGalleryProps) {
  const media = React.useMemo(
    () => [
      { label: `${productName} - principal`, src: heroImage },
      ...detailImages,
      ...modelMockups
    ],
    [detailImages, heroImage, modelMockups, productName]
  );

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [zoomOpen, setZoomOpen] = React.useState(false);
  const active = media[activeIndex] ?? media[0];

  return (
    <section className="py-20 bg-white">
      <div className="section-container layout-grid-product">
        <div className="lg:col-span-7">
          <div className="relative aspect-square rounded-[2rem] overflow-hidden border border-ruah-100 bg-ruah-50 group">
            <AppImage context="content-banner" src={active.src} alt={active.label} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
            <button
              onClick={() => setZoomOpen(true)}
              className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.08em] text-ruah-950 border border-ruah-100 hover:border-accent-gold"
            >
              <ZoomIn size={14} />
              Zoom da estampa
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold">Visualização do produto</p>
            <h3 className="text-3xl font-serif italic uppercase text-ruah-950 mt-3">Detalhes e mockups</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {media.map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveIndex(media.findIndex((entry) => entry.label === item.label))}
                className={`relative aspect-square rounded-2xl overflow-hidden border transition-all motion-base ${
                  active.label === item.label ? 'border-ruah-950' : 'border-ruah-100 hover:border-accent-gold'
                }`}
              >
                <AppImage context="content-banner" src={item.src} alt={item.label} fill sizes="(max-width: 1024px) 50vw, 20vw" className="object-cover" />
                <span className="absolute left-2 bottom-2 text-xs font-semibold uppercase tracking-[0.08em] bg-white/90 px-2 py-1 rounded-full text-ruah-950">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {zoomOpen && (
        <div className="fixed inset-0 z-[120] bg-ruah-950/85 backdrop-blur-sm p-6 flex items-center justify-center" role="dialog" aria-modal="true">
          <button
            onClick={() => setZoomOpen(false)}
            className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white text-ruah-950 flex items-center justify-center"
          >
            <X size={18} />
          </button>
          <div className="relative w-full max-w-4xl aspect-square rounded-3xl overflow-hidden border border-white/20">
            <AppImage context="content-banner" src={active.src} alt={`${active.label} ampliado`} fill sizes="90vw" className="object-contain bg-ruah-950" />
          </div>
        </div>
      )}
    </section>
  );
}


