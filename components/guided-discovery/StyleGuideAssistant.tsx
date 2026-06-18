'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Home, Briefcase, Camera, Coffee } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppImage } from '@/components/shared/AppImage';
import { OverlayPortal } from '@/components/shared/OverlayPortal';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { getBrandProductSeed } from '@/lib/brand-assets';
import { recommendBrandProductFromSelections } from '@/lib/brand-discovery';

interface Option {
  id: string;
  label: string;
  detail: string;
  icon?: React.ElementType;
}

interface Step {
  id: string;
  question: string;
  options: Option[];
}

interface StyleGuideRecommendation {
  productId: string;
  productName: string;
  technicalReason: string;
  layoutTip: string;
}

const STEPS: Step[] = [
  {
    id: 'space',
    question: 'Qual o seu chamado artistico hoje?',
    options: [
      { id: 'residential', label: 'Cotidiano', icon: Home, detail: 'Para o dia a dia com proposito.' },
      { id: 'office', label: 'Manifesto', icon: Briefcase, detail: 'Expressando sua fe no trabalho.' },
      { id: 'gallery', label: 'Criacao', icon: Camera, detail: 'Momentos de inspiracao e presenca visual.' },
      { id: 'hospitality', label: 'Comunhao', icon: Coffee, detail: 'Encontros que pedem calor e acolhimento.' },
    ],
  },
  {
    id: 'mood',
    question: 'Qual a leitura que essa peca precisa carregar?',
    options: [
      { id: 'cozy', label: 'Respiro', detail: 'Paz, suavidade e pouca interferencia visual.' },
      { id: 'neutral', label: 'Firmeza', detail: 'Base solida, uso recorrente e clareza.' },
      { id: 'technical', label: 'Presenca', detail: 'Impacto mais direto, com mais peso.' },
      { id: 'dynamic', label: 'Movimento', detail: 'Energia, contraste e circulacao.' },
    ],
  },
];

export function StyleGuideAssistant({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [recommendation, setRecommendation] = useState<StyleGuideRecommendation | null>(null);
  const router = useRouter();
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);

  const handleSelect = (stepId: string, optionId: string) => {
    const nextSelections = { ...selections, [stepId]: optionId };
    setSelections(nextSelections);

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setRecommendation(recommendBrandProductFromSelections(nextSelections));
  };

  const handleProductNavigation = () => {
    if (!recommendation) return;
    router.push(`/product/${recommendation.productId}`);
    onClose();
  };

  useFocusTrap({
    active: isOpen,
    containerRef: modalRef,
    onEscape: onClose,
  });

  React.useEffect(() => {
    if (!isOpen) return;
    overlayRef.current?.scrollTo({ top: 0 });
  }, [currentStep, isOpen, recommendation]);

  const recommendedProduct = recommendation ? getBrandProductSeed(recommendation.productId) : null;

  return (
    <OverlayPortal>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-modal overflow-y-auto bg-ruah-950/95 p-4 md:p-6"
            ref={overlayRef}
            onClick={onClose}
          >
            <div className="pointer-events-none absolute inset-0 z-0 opacity-20">
              <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-br from-accent-gold/40 to-transparent blur-[120px]" />
            </div>

            <div className="relative z-10 flex min-h-full items-start justify-center py-6 md:py-10">
              <div
                className="relative w-full max-w-4xl"
                role="dialog"
                aria-modal="true"
                aria-label="Guia de estilo UseRuah"
                ref={modalRef}
                tabIndex={-1}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 z-20 text-white/50 transition-colors hover:text-white md:right-6 md:top-6"
                >
                  <X size={28} />
                </button>

                {!recommendation ? (
                  <div className="flex max-h-[calc(100vh-3rem)] flex-col gap-10 overflow-y-auto rounded-[2rem] border border-white/10 bg-white/5 p-6 md:gap-12 md:rounded-[3rem] md:p-8 lg:p-10">
                    <div className="flex flex-col gap-4 pr-10 text-center lg:text-left">
                      <span className="tech-label text-accent-gold">Guia de estilo UseRuah</span>
                      <h2 className="text-3xl font-serif uppercase italic leading-none text-white md:text-5xl lg:text-7xl">
                        {STEPS[currentStep].question}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                      {STEPS[currentStep].options.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleSelect(STEPS[currentStep].id, option.id)}
                          className="group rounded-[2rem] border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-white hover:bg-white md:p-8"
                        >
                          {option.icon ? <option.icon size={24} className="mb-4 text-accent-gold group-hover:text-ruah-950 md:mb-6" /> : null}
                          <div className="flex flex-col gap-2">
                            <span className="font-serif text-lg uppercase text-white group-hover:text-ruah-950 md:text-xl">{option.label}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest leading-relaxed text-white/40 group-hover:text-ruah-400">
                              {option.detail}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : recommendedProduct ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex max-h-[calc(100vh-3rem)] flex-col gap-8 overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl md:rounded-[3rem] md:p-8 lg:flex-row lg:gap-12 lg:p-12"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] shadow-fancy lg:w-[44%] lg:shrink-0">
                      <AppImage context="content-banner" src={recommendedProduct.image} alt={recommendedProduct.name} fill className="object-cover" />
                    </div>

                    <div className="flex flex-1 flex-col gap-6">
                      <div className="flex flex-col gap-2 pr-10">
                        <span className="tech-label text-accent-gold">A escolha com proposito</span>
                        <h3 className="text-3xl font-serif uppercase italic leading-none md:text-4xl lg:text-5xl">{recommendedProduct.name}</h3>
                      </div>

                      <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-ruah-300">Por que sugerimos:</span>
                          <p className="text-xs font-bold uppercase tracking-widest leading-loose text-ruah-950">{recommendation.technicalReason}</p>
                        </div>

                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-ruah-300">Dica de composicao:</span>
                          <p className="text-xs font-medium uppercase italic tracking-widest leading-loose text-ruah-500">
                            {recommendation.layoutTip || recommendedProduct.stylingTip}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-col gap-3 lg:mt-auto lg:flex-row">
                        <button
                          type="button"
                          onClick={handleProductNavigation}
                          className="flex-1 rounded-2xl bg-ruah-950 px-4 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-accent-gold"
                        >
                          Ver detalhes do produto
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRecommendation(null);
                            setCurrentStep(0);
                            setSelections({});
                          }}
                          className="flex-1 rounded-2xl border border-ruah-100 px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-ruah-950 transition-all hover:bg-ruah-50"
                        >
                          Nova leitura
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  );
}
