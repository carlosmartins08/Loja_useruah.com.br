'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Check, Box, Truck, ShieldCheck, Factory } from 'lucide-react';
import { MOTION_DURATION, MOTION_EASING } from '@/lib/ui/motion';

export type OrderStatus = 'received' | 'production' | 'quality' | 'ready' | 'shipped';

interface TimelineStep {
  id: OrderStatus;
  label: string;
  description: string;
  icon: any;
}

const STEPS: TimelineStep[] = [
  { id: 'received', label: 'Pedido recebido', description: 'Pedido e detalhes da peça confirmados.', icon: Check },
  { id: 'production', label: 'Em confecção', description: 'A peça está sendo produzida sob demanda.', icon: Factory },
  { id: 'quality', label: 'Revisão e acabamento', description: 'Estampa, costura e acabamento passam por conferência.', icon: ShieldCheck },
  { id: 'ready', label: 'Pronto para envio', description: 'A peça foi embalada e está aguardando despacho.', icon: Box },
  { id: 'shipped', label: 'Enviado', description: 'O pedido está em trânsito para o endereço informado.', icon: Truck },
];

export function ProductionTimeline({ currentStatus }: { currentStatus: OrderStatus }) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStatus);
  const currentStep = currentIndex >= 0 ? STEPS[currentIndex] : null;

  return (
    <div className="flex flex-col gap-12 py-10">
       <div className="relative">
          {/* Progress Bar Background */}
          <div className="absolute top-6 left-0 w-full h-0.5 bg-ruah-100" />
          
          {/* Active Progress Bar */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
            className="absolute top-6 left-0 h-0.5 bg-accent-gold"
            transition={{ duration: MOTION_DURATION.glacial, ease: MOTION_EASING.circOut }}
          />

          <div className="flex justify-between relative z-10">
             {STEPS.map((step, i) => {
               const isCompleted = i < currentIndex;
               const isActive = i === currentIndex;
               const isPending = i > currentIndex;

               return (
                 <div key={step.id} className="flex flex-col items-center gap-4 max-w-[120px] text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all motion-slow ${
                      isActive ? 'bg-accent-gold text-white shadow-fancy ring-4 ring-accent-gold/20' : 
                      isCompleted ? 'bg-ruah-950 text-white' : 
                      'bg-white border border-ruah-100 text-ruah-200'
                    }`}>
                       <step.icon size={20} />
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className={`text-xs font-bold uppercase tracking-tight ${isActive ? 'text-accent-gold' : isCompleted ? 'text-ruah-950' : 'text-ruah-300'}`}>
                          {step.label}
                       </span>
                    </div>
                 </div>
               );
             })}
          </div>
       </div>

       {currentStep && (
         <div className="bg-white rounded-3xl p-8 border border-ruah-100 shadow-subtle">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-2 h-2 rounded-full bg-accent-gold pulse-soft" />
               <span className="text-xs font-bold uppercase tracking-[0.1em] text-accent-gold">Acompanhamento do pedido</span>
            </div>
            <h4 className="text-xl font-serif uppercase italic mb-2">{currentStep.label}</h4>
            <p className="text-xs text-ruah-400 font-medium uppercase tracking-[0.05em] leading-relaxed">
               {currentStep.description}
            </p>
            
            {currentStatus === 'production' && (
              <div className="mt-8 p-4 bg-ruah-50 rounded-xl border border-ruah-100 flex items-center gap-4">
                 <Factory size={18} className="text-accent-gold" />
                 <p className="text-xs font-bold text-ruah-950 uppercase tracking-[0.1em] leading-relaxed">
                    PRODUÇÃO SOB DEMANDA: Sua peça está em fase de confecção manual.
                 </p>
              </div>
            )}
         </div>
       )}
    </div>
  );
}


