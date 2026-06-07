'use client';

import React from 'react';
import { AppImage } from '@/components/shared/AppImage';
import { ProductArtworkFallback } from '@/components/shared/ProductArtworkFallback';
import { isProductMockupPlaceholder } from '@/lib/product-artwork';
import { getProductStageTone } from '@/lib/product-stage';
import { X, ZoomIn } from 'lucide-react';
import { useFocusTrap } from '@/hooks/use-focus-trap';

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
  const [failedSources, setFailedSources] = React.useState<Record<string, true>>({});
  const zoomRef = React.useRef<HTMLDivElement>(null);
  const active = media[activeIndex] ?? media[0];
  const activeStage = getProductStageTone(active.src);
  const activeFailed = Boolean(failedSources[active.src]);
  const activeUsesEditorialArtwork = isProductMockupPlaceholder(active.src);

  useFocusTrap({
    active: zoomOpen,
    containerRef: zoomRef,
    onEscape: () => setZoomOpen(false),
  });

  return (
    <section className="py-20 bg-white">
      <div className="section-container layout-grid-product">
        <div className="lg:col-span-7">
          <div className={`relative aspect-square rounded-[2rem] overflow-hidden border group ${activeStage.frameClassName}`}>
            <div className={`absolute inset-0 ${activeStage.glowClassName}`} />
            <div className={`absolute inset-[6%] rounded-[1.75rem] ${activeStage.surfaceClassName}`} />
            {activeUsesEditorialArtwork || activeFailed ? <ProductArtworkFallback title={productName} subtitle={active.label} src={active.src} /> : null}
            {!activeUsesEditorialArtwork ? (
              <AppImage
                context="content-banner"
                src={active.src}
                alt={active.label}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className={`${activeFailed ? 'hidden ' : ''}${activeStage.imageClassName}`}
                onError={() => setFailedSources((current) => (current[active.src] ? current : { ...current, [active.src]: true }))}
              />
            ) : null}
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
            {media.map((item) => {
              const itemStage = getProductStageTone(item.src);
              const itemFailed = Boolean(failedSources[item.src]);
              const itemUsesEditorialArtwork = isProductMockupPlaceholder(item.src);

              return (
                <button
                  key={item.label}
                  onClick={() => setActiveIndex(media.findIndex((entry) => entry.label === item.label))}
                  className={`relative aspect-square rounded-2xl overflow-hidden border transition-all motion-base ${
                    active.label === item.label ? 'border-ruah-950' : 'border-ruah-100 hover:border-accent-gold'
                  } ${itemStage.frameClassName}`}
                >
                  <div className={`absolute inset-0 ${itemStage.glowClassName}`} />
                  <div className={`absolute inset-[8%] rounded-[1.2rem] ${itemStage.surfaceClassName}`} />
                  {itemUsesEditorialArtwork || itemFailed ? <ProductArtworkFallback title={productName} subtitle={item.label} src={item.src} compact /> : null}
                  {!itemUsesEditorialArtwork ? (
                    <AppImage
                      context="content-banner"
                      src={item.src}
                      alt={item.label}
                      fill
                      sizes="(max-width: 1024px) 50vw, 20vw"
                      className={`${itemFailed ? 'hidden ' : ''}${itemStage.imageClassName}`}
                      onError={() => setFailedSources((current) => (current[item.src] ? current : { ...current, [item.src]: true }))}
                    />
                  ) : null}
                  <span className="absolute left-2 bottom-2 text-xs font-semibold uppercase tracking-[0.08em] bg-white/90 px-2 py-1 rounded-full text-ruah-950">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {zoomOpen && (
        <div className="fixed inset-0 z-modal bg-ruah-950/85 backdrop-blur-sm p-6 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Zoom da imagem do produto" onClick={() => setZoomOpen(false)} ref={zoomRef} tabIndex={-1}>
          <button
            onClick={() => setZoomOpen(false)}
            className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white text-ruah-950 flex items-center justify-center"
          >
            <X size={18} />
          </button>
          <div className={`relative w-full max-w-4xl aspect-square rounded-3xl overflow-hidden border border-white/20 ${activeStage.frameClassName}`} onClick={(event) => event.stopPropagation()}>
            <div className={`absolute inset-0 ${activeStage.glowClassName}`} />
            <div className={`absolute inset-[6%] rounded-[2rem] ${activeStage.surfaceClassName}`} />
            {activeUsesEditorialArtwork || activeFailed ? <ProductArtworkFallback title={productName} subtitle={`${active.label} ampliado`} src={active.src} /> : null}
            {!activeUsesEditorialArtwork ? (
              <AppImage
                context="content-banner"
                src={active.src}
                alt={`${active.label} ampliado`}
                fill
                sizes="90vw"
                className={`${activeFailed ? 'hidden ' : ''}${activeStage.imageClassName}`}
                onError={() => setFailedSources((current) => (current[active.src] ? current : { ...current, [active.src]: true }))}
              />
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}


