'use client';

import { describeProductArtwork, type ProductArtworkKind } from '@/lib/product-artwork';

interface ProductArtworkFallbackProps {
  title: string;
  subtitle: string;
  src?: string;
  compact?: boolean;
}

function ProductArtworkSilhouette({ kind }: { kind: ProductArtworkKind }) {
  const baseClassName = 'h-[68%] w-[68%] text-ruah-950/12';

  if (kind === 'shirt') {
    return (
      <svg viewBox="0 0 240 240" className={baseClassName} aria-hidden="true">
        <path
          d="M87 42h66l24 22-18 31-17-10v112H98V85L81 95 63 64l24-22Z"
          fill="currentColor"
          stroke="rgba(23,25,28,0.12)"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (kind === 'sweatshirt') {
    return (
      <svg viewBox="0 0 240 240" className={baseClassName} aria-hidden="true">
        <path
          d="M84 42h72l28 26-17 35-18-11v104H91V92l-18 11-17-35 28-26Z"
          fill="currentColor"
          stroke="rgba(23,25,28,0.12)"
          strokeWidth="2"
        />
        <rect x="101" y="181" width="38" height="18" rx="8" fill="rgba(23,25,28,0.08)" />
      </svg>
    );
  }

  if (kind === 'tote') {
    return (
      <svg viewBox="0 0 240 240" className={baseClassName} aria-hidden="true">
        <path
          d="M78 70h84l11 124H67L78 70Z"
          fill="currentColor"
          stroke="rgba(23,25,28,0.12)"
          strokeWidth="2"
        />
        <path
          d="M95 74c0-18 11-30 25-30s25 12 25 30"
          fill="none"
          stroke="rgba(23,25,28,0.22)"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (kind === 'cap') {
    return (
      <svg viewBox="0 0 240 240" className={baseClassName} aria-hidden="true">
        <path
          d="M70 120c0-31 23-54 53-54 28 0 49 18 56 44l-109 10Z"
          fill="currentColor"
          stroke="rgba(23,25,28,0.12)"
          strokeWidth="2"
        />
        <path
          d="M70 120c20 5 58 7 104-3 6-1 11 4 10 10-2 9-10 16-19 18-50 13-90 8-108-4-7-5-6-16 1-19 3-1 7-2 12-2Z"
          fill="rgba(23,25,28,0.18)"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 240 240" className={baseClassName} aria-hidden="true">
      <rect x="52" y="52" width="136" height="136" rx="30" fill="currentColor" />
    </svg>
  );
}

export function ProductArtworkFallback({ title, subtitle, src = '', compact = false }: ProductArtworkFallbackProps) {
  const descriptor = describeProductArtwork(src);

  return (
    <div className="absolute inset-0 flex items-center justify-center p-5 md:p-7">
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[inherit] border border-white/50 bg-white/55 px-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-[2px]">
        <div className="absolute inset-[8%] rounded-[inherit] border border-accent-gold/18" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(197,160,89,0.16),transparent_56%)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <ProductArtworkSilhouette kind={descriptor.kind} />
        </div>
        <div className="relative z-10 flex h-full w-full flex-col justify-between py-4 md:py-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-accent-gold/90">
              {descriptor.familyLabel}
            </span>
            <span className="rounded-full border border-ruah-950/10 bg-white/70 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-ruah-500">
              {descriptor.angleLabel}
            </span>
          </div>
          <div className="mx-auto flex max-w-[18rem] flex-col items-center gap-2">
            <span className={`${compact ? 'text-lg' : 'text-3xl md:text-4xl'} font-serif uppercase italic leading-[0.92] text-ruah-950`}>
              {title}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ruah-500">
              {subtitle}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-ruah-500">
            <span>{descriptor.toneLabel}</span>
            <span>UseRuah</span>
          </div>
        </div>
      </div>
    </div>
  );
}
