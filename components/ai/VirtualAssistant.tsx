'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Home, Briefcase, Camera, Coffee } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { AppImage } from '@/components/shared/AppImage';
import Link from 'next/link';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { getBrandProductSeed } from '@/lib/brand-assets';

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

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

interface AssistantRecommendation {
  productId: string;
  productName: string;
  technicalReason: string;
  layoutTip: string;
}

const STEPS: Step[] = [
  {
    id: 'space',
    question: 'Qual o seu chamado artístico hoje?',
    options: [
      { id: 'residential', label: 'Cotidiano', icon: Home, detail: 'Para o dia a dia com propósito.' },
      { id: 'office', label: 'Manifesto', icon: Briefcase, detail: 'Expressando sua fé no trabalho.' },
      { id: 'gallery', label: 'Criação', icon: Camera, detail: 'Momentos de pura inspiração.' },
      { id: 'hospitality', label: 'Comunhão', icon: Coffee, detail: 'Encontros que alimentam a alma.' },
    ],
  },
  {
    id: 'mood',
    question: 'Qual a mensagem que quer transmitir?',
    options: [
      { id: 'cozy', label: 'Respiro', detail: 'Paz e tranquilidade em cada fio.' },
      { id: 'neutral', label: 'Firmeza', detail: 'Consistência e base sólida.' },
      { id: 'technical', label: 'Geração', detail: 'Atitude e impacto visual.' },
      { id: 'dynamic', label: 'Sopro', detail: 'Fluidez e movimento constante.' },
    ],
  },
];

function getFallbackRecommendation(data: Record<string, string>): AssistantRecommendation {
  const fallbackId =
    data.mood === 'technical'
      ? '4'
      : data.space === 'hospitality'
        ? '2'
        : data.mood === 'dynamic'
          ? '3'
          : '1';

  const product = getBrandProductSeed(fallbackId);

  return {
    productId: product.id,
    productName: product.name,
    technicalReason: product.shortReason,
    layoutTip: product.stylingTip,
  };
}

export function VirtualAssistant({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [recommendation, setRecommendation] = useState<AssistantRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);

  const handleSelect = (stepId: string, optionId: string) => {
    const newSelections = { ...selections, [stepId]: optionId };
    setSelections(newSelections);

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    void generateRecommendation(newSelections);
  };

  const generateRecommendation = async (data: Record<string, string>) => {
    setIsLoading(true);

    try {
      if (!ai) {
        setRecommendation(getFallbackRecommendation(data));
        return;
      }

      const prompt = `Como curador de estilo da UseRuah, recomende produtos para um momento ${data.space} com mensagem de ${data.mood}.

Produtos:
1. Camiseta Oração (algodão, leitura contemplativa, editorial)
2. Moletom Presença (conforto, densidade visual, encontro)
3. Ecobag Reino (praticidade, presente, rotina)
4. Boné Presença (afirmação sutil, identidade, impacto)
5. Camiseta Serena (base, suavidade, recorrência)
6. Ecobag Presença (entrada de marca, utilidade, contraste)

Retorne um JSON com {productId, productName, technicalReason, layoutTip}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productId: { type: Type.STRING },
              productName: { type: Type.STRING },
              technicalReason: { type: Type.STRING },
              layoutTip: { type: Type.STRING },
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (
        typeof parsed?.productId === 'string' &&
        typeof parsed?.productName === 'string' &&
        typeof parsed?.technicalReason === 'string' &&
        typeof parsed?.layoutTip === 'string'
      ) {
        setRecommendation(parsed);
        return;
      }

      setRecommendation(getFallbackRecommendation(data));
    } catch (error) {
      console.error(error);
      setRecommendation(getFallbackRecommendation(data));
    } finally {
      setIsLoading(false);
    }
  };

  useFocusTrap({
    active: isOpen,
    containerRef: modalRef,
    onEscape: onClose,
  });

  const recommendedProduct = recommendation ? getBrandProductSeed(recommendation.productId) : null;

  return (
    <AnimatePresence>
      {isOpen && (
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
            aria-label="Assistente virtual de estilo"
            ref={modalRef}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            {!recommendation && !isLoading ? (
              <div className="flex flex-col gap-16">
                <div className="flex flex-col gap-6 text-center lg:text-left">
                  <span className="tech-label text-accent-gold">UseRuah AI Curator</span>
                  <h2 className="text-5xl lg:text-7xl font-serif text-white leading-none uppercase italic">
                    {STEPS[currentStep].question}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {STEPS[currentStep].options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect(STEPS[currentStep].id, opt.id)}
                      className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] text-left hover:bg-white hover:border-white group transition-all"
                    >
                      {opt.icon ? <opt.icon size={24} className="text-accent-gold mb-6 group-hover:text-ruah-950" /> : null}
                      <div className="flex flex-col gap-2">
                        <span className="text-xl font-serif text-white group-hover:text-ruah-950 uppercase">{opt.label}</span>
                        <span className="text-[10px] font-bold text-white/40 group-hover:text-ruah-400 uppercase tracking-widest leading-relaxed">
                          {opt.detail}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : recommendation && recommendedProduct ? (
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
                    <span className="tech-label text-accent-gold">A Escolha com Propósito</span>
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
                      <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-ruah-300">Dica de estilo:</span>
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
                      Nova curadoria
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 gap-8">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-white/10 border-t-accent-gold rounded-full animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto text-accent-gold animate-pulse" size={32} />
                </div>
                <div className="flex flex-col items-center gap-4">
                  <h3 className="text-3xl font-serif text-white italic uppercase tracking-tighter">Buscando o seu chamado...</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em] animate-pulse">UseRuah Art & Faith Curator Analysis</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
