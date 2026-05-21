'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, X, Check, Loader2, Home, Briefcase, Camera, Coffee } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import Image from 'next/image';
import Link from 'next/link';

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
      { id: 'residential', label: 'Cotidiano', icon: Home, detail: 'Para o dia a dia com propósito' },
      { id: 'office', label: 'Manifesto', icon: Briefcase, detail: 'Expressando sua fé no trabalho' },
      { id: 'gallery', label: 'Criação', icon: Camera, detail: 'Momentos de pura inspiração' },
      { id: 'hospitality', label: 'Comunhão', icon: Coffee, detail: 'Encontros que alimentam a alma' },
    ]
  },
  {
    id: 'mood',
    question: 'Qual a mensagem que quer transmitir?',
    options: [
      { id: 'cozy', label: 'Respiro', detail: 'Paz e tranquilidade em cada fio' },
      { id: 'neutral', label: 'Firmeza', detail: 'Consistência e base sólida' },
      { id: 'technical', label: 'Geração', detail: 'Atitude e impacto visual' },
      { id: 'dynamic', label: 'Sopro', detail: 'Fluidez e movimento constante' },
    ]
  }
];

export function VirtualAssistant({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [recommendation, setRecommendation] = useState<AssistantRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = (stepId: string, optionId: string) => {
    const newSelections = { ...selections, [stepId]: optionId };
    setSelections(newSelections);

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      generateRecommendation(newSelections);
    }
  };

  const generateRecommendation = async (data: Record<string, string>) => {
    setIsLoading(true);
    try {
      if (!ai) {
        setRecommendation({
          productId: data.mood === 'technical' ? '4' : data.space === 'hospitality' ? '2' : '1',
          productName: data.mood === 'technical' ? 'Camiseta Geração' : data.space === 'hospitality' ? 'Moletom Fé Viva' : 'Camiseta Respiro',
          technicalReason: 'Curadoria local aplicada por ausência de chave Gemini no ambiente.',
          layoutTip: 'Use tons neutros e destaque uma peça central com mensagem de fé.',
        });
        return;
      }

      const prompt = `Como curador de estilo da UseRuah, recomende produtos para um momento ${data.space} com mensagem de ${data.mood}.
      
      Produtos:
      1. Camiseta Respiro (Puro Algodão, Essencial)
      2. Moletom Fé Viva (Conforto, Campanha)
      3. Bolsa Sopro (Acessório, Prático)
      4. Camiseta Geração (Arte, Manifesto)

      Retorne um JSON com {productId, productName, technicalReason, layoutTip}.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productId: { type: Type.STRING },
              productName: { type: Type.STRING },
              technicalReason: { type: Type.STRING },
              layoutTip: { type: Type.STRING }
            }
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (
        typeof parsed?.productId === 'string' &&
        typeof parsed?.productName === 'string' &&
        typeof parsed?.technicalReason === 'string' &&
        typeof parsed?.layoutTip === 'string'
      ) {
        setRecommendation(parsed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-ruah-950 flex items-center justify-center p-6"
        >
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent-gold/40 to-transparent blur-[120px]" />
          </div>

          <button onClick={onClose} className="absolute top-12 right-12 text-white/50 hover:text-white transition-colors z-20">
             <X size={32} />
          </button>

          <div className="max-w-4xl w-full relative z-10">
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
                           {opt.icon && <opt.icon size={24} className="text-accent-gold mb-6 group-hover:text-ruah-950" />}
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
             ) : recommendation ? (
               <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[4rem] p-16 flex flex-col lg:flex-row gap-16 items-center shadow-2xl"
               >
                  <div className="relative w-full lg:w-1/2 aspect-square rounded-[3rem] overflow-hidden shadow-fancy">
                     <Image src={`https://picsum.photos/seed/ruah-rec-${recommendation.productId}/800/800`} alt={recommendation.productName} fill className="object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col gap-8">
                     <div className="flex flex-col gap-2">
                        <span className="tech-label text-accent-gold">A Escolha com Propósito</span>
                        <h3 className="text-5xl font-serif leading-none italic uppercase">{recommendation.productName}</h3>
                     </div>
                     
                     <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                           <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-ruah-300">Por que sugerimos:</span>
                           <p className="text-xs font-bold uppercase tracking-widest text-ruah-950 leading-loose">
                              {recommendation.technicalReason}
                           </p>
                        </div>
                        <div className="flex flex-col gap-2">
                           <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-ruah-300">Dica de Estilo:</span>
                           <p className="text-xs text-ruah-500 font-medium uppercase tracking-widest leading-loose italic">
                              {recommendation.layoutTip}
                           </p>
                        </div>
                     </div>

                     <div className="flex flex-col lg:flex-row gap-4 mt-4">
                        <Link 
                          href={`/product/${recommendation.productId}`}
                          onClick={onClose}
                          className="flex-1 bg-ruah-950 text-white text-center py-5 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-accent-gold transition-all"
                        >
                           Ver Detalhes do Produto
                        </Link>
                        <button 
                          onClick={() => {
                            setRecommendation(null);
                            setCurrentStep(0);
                            setSelections({});
                          }}
                          className="flex-1 border border-ruah-100 text-ruah-950 py-5 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-ruah-50 transition-all"
                        >
                           Nova Curadoria
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
