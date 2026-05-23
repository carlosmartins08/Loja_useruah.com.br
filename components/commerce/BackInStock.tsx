'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, Loader2 } from 'lucide-react';

export function BackInStock({ productName }: { productName: string }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <div className="bg-lumina-50 rounded-[2rem] p-8 border border-lumina-100">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-accent-blue shadow-sm">
          <Bell size={18} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-lumina-950">Aviso de Reposição</span>
          <span className="text-[9px] text-lumina-400 font-medium uppercase tracking-widest">Seja o primeiro a saber</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu e-mail"
              className="bg-white border border-lumina-100 rounded-xl px-5 py-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-accent-blue transition-colors"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="bg-lumina-950 text-white font-bold uppercase text-[9px] tracking-[0.3em] py-4 rounded-xl hover:bg-accent-blue transition-all flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  Monitorar Estoque
                  <Bell size={12} className="group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center gap-2 py-4"
          >
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mb-2">
              <Check size={24} />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-lumina-950">Monitoramento Ativo</h4>
            <p className="text-[10px] text-lumina-400 font-medium uppercase tracking-widest leading-loose">
              Enviaremos um alerta técnico <br /> assim que o {productName} retornar.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
