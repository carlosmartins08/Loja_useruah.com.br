'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, ArrowRight, Percent } from 'lucide-react';
import Link from 'next/link';

export function ExitIntent() {
  const [show, setShow] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        setShow(true);
        setHasShown(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShown]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[200] bg-lumina-950/40 backdrop-blur-md flex items-center justify-center p-6"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white rounded-[3rem] overflow-hidden max-w-xl w-full relative"
        >
           <button onClick={() => setShow(false)} className="absolute top-8 right-8 text-lumina-300 hover:text-lumina-950 transition-colors">
              <X size={24} />
           </button>

           <div className="p-16 flex flex-col items-center text-center gap-8">
              <div className="w-20 h-20 bg-accent-blue/5 rounded-full flex items-center justify-center text-accent-blue">
                 <Percent size={32} />
              </div>
              
              <div className="flex flex-col gap-4">
                 <span className="tech-label text-accent-blue">Oferta por Comportamento</span>
                 <h2 className="text-4xl lg:text-5xl font-serif leading-none italic uppercase">NÃO SAIA SEM <br /> O PRÓXIMO NÍVEL.</h2>
                 <p className="text-sm font-medium uppercase tracking-widest text-lumina-400 leading-relaxed max-w-xs mx-auto">
                    Notei que você valoriza a excelência. Use o cupom <span className="text-lumina-950 font-bold">LUMINA10</span> para 10% OFF na sua primeira reserva técnica.
                 </p>
              </div>

              <button 
                onClick={() => setShow(false)}
                className="w-full bg-lumina-950 text-white py-6 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-accent-blue transition-all"
              >
                 Garantir meu Desconto
              </button>

              <button 
                 onClick={() => setShow(false)}
                 className="text-[10px] font-bold text-lumina-300 uppercase tracking-widest border-b border-lumina-100 pb-1"
              >
                 Continuar navegando sem desconto
              </button>
           </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
