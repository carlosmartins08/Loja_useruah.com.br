'use client';

import { Truck } from 'lucide-react';

export function SmartShipping() {
  return (
    <div className="flex items-center gap-4 py-4 px-6 bg-ruah-50 rounded-2xl border border-ruah-100">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-accent-gold shadow-sm">
        <Truck size={18} />
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-xs font-bold uppercase tracking-[0.1em] text-ruah-950">Entrega sob demanda</span>
        <p className="text-xs text-ruah-500 font-medium uppercase tracking-[0.1em]">
          Prazo e frete serão informados quando o cálculo de entrega estiver disponível.
        </p>
      </div>
    </div>
  );
}


