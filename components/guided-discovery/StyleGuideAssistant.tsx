'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Home, Briefcase, Camera, Coffee } from 'lucide-react';
import { AppImage } from '@/components/shared/AppImage';
import Link from 'next/link';
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
    question: 'Qual o seu chamado artÃ­stico hoje?',
    options: [
      { id: 'residential', label: 'Cotidiano', icon: Home, detail: 'Para o dia a dia com propÃ³sito.' },
      { id: 'office', label: 'Manifesto', icon: Briefcase, detail: 'Expressando sua fÃ© no trabalho.' },
      { id: 'gallery', label: 'CriaÃ§Ã£o', icon: Camera, detail: 'Momentos de inspiraÃ§Ã£o e presenÃ§a visual.' },
      { id: 'hospitality', label: 'ComunhÃ£o', icon: Coffee, detail: 'Encontros que pedem calor e acolhimento.' },
    ],
  },
  {
    id: 'mood',
    question: 'Qual a leitura que essa peÃ§a precisa carregar?',
    options: [
      { id: 'cozy', label: 'Respiro', detail: 'Paz, suavidade e pouca interferÃªncia visual.' },
      { id: 'neutral', label: 'Firmeza', detail: 'Base sÃ³lida, uso recorrente e clareza.' },
      { id: 'technical', label: 'PresenÃ§a', detail: 'Impacto mais direto, com mais peso.' },
      { id: 'dynamic', label: 'Movimento', detail: 'Energia, contraste e circulaÃ§Ã£o.' },
    ],
  },
];

export function StyleGuideAssistant({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [recommendation, setRecommendation] = useState<StyleGuideRecommendation | null>(null);
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

  useFocusTrap({
    active: isOpen,
    containerRef: modalRef,
    onEscape: onClose,
  });

  const recommendedProduct = recommendation ? getBrandProductSeed(recommendation.productId) : null;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-modal bg-ruah-950 flex items-center justify-center p-6"
          onClick={onClose}
        >
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent-gold/40 to-transparent blur-[120px]" />
          </div>

          <button onClick={onClose} className="absolute top-12 right-12 text-white/50 hover:text-white transition-colors z-20">
            <X size={32} />
          </button>

          <div
            className="max-w-4xl w-full relative z-10"
            role="dialog"
            aria-modal="true"
            aria-label="Guia de estilo UseRuah"
            ref={modalRef}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            {!recommendation ? (
              <div className="flex flex-col gap-16">
                <div className="flex flex-col gap-6 text-center lg:text-left">
                  <span className="tech-label text-accent-gold">Guia de estilo UseRuah</span>
                  <h2 className="text-5xl lg:text-7xl font-serif text-white leading-none uppercase italic">
                    {STEPS[currentStep].question}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {STEPS[currentStep].options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleSelect(STEPS[currentStep].id, option.id)}
                      className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] text-left hover:bg-white hover:border-white group transition-all"
                    >
                      {option.icon ? <option.icon size={24} className="text-accent-gold mb-6 group-hover:text-ruah-950" /> : null}
                      <div className="flex flex-col gap-2">
                        <span className="text-xl font-serif text-white group-hover:text-ruah-950 uppercase">{option.label}</span>
                        <span className="text-[10px] font-bold text-white/40 group-hover:text-ruah-400 uppercase tracking-widest leading-relaxed">
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
                className="bg-white rounded-[4rem] p-16 flex flex-col lg:flex-row gap-16 items-center shadow-2xl"
              >
                <div className="relative w-full lg:w-1/2 aspect-square rounded-[3rem] overflow-hidden shadow-fancy">
                  <AppImage context="content-banner" src={recommendedProduct.image} alt={recommendedProduct.name} fill className="object-cover" />
                </div>
                <div className="flex-1 flex flex-col gap-8">
                  <div className="flex flex-col gap-2">
                    <span className="tech-label text-accent-gold">A escolha com propÃ³sito</span>
                    <h3 className="text-5xl font-serif leading-none italic uppercase">{recommendedProduct.name}</h3>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-ruah-300">Por que sugerimos:</span>
                      <p className="text-xs font-bold uppercase tracking-widest text-ruah-950 leading-loose">
                        {recommendation.technicalReason}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-ruah-300">Dica de composiÃ§Ã£o:</span>
                      <p className="text-xs text-ruah-500 font-medium uppercase tracking-widest leading-loose italic">
                        {recommendation.layoutTip || recommendedProduct.stylingTip}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-4 mt-4">
                    <Link
                      href={`/product/${recommendedProduct.id}`}
                      onClick={onClose}
                      className="flex-1 bg-ruah-950 text-white text-center py-5 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-accent-gold transition-all"
                    >
                      Ver detalhes do produto
                    </Link>
                    <button
                      onClick={() => {
                        setRecommendation(null);
                        setCurrentStep(0);
                        setSelections({});
                      }}
                      className="flex-1 border border-ruah-100 text-ruah-950 py-5 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-ruah-50 transition-all"
                    >
                      Nova leitura
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
