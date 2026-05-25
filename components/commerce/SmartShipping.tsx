'use client';

import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Loader2 } from 'lucide-react';

export function SmartShipping() {
  const [shippingInfo, setShippingInfo] = useState<{ city: string; days: number; price: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShippingInfo({
        city: 'Sao Paulo, SP',
        days: 2,
        price: 'Gratis'
      });
      setLoading(false);
    }, 600);

    return () => clearTimeout(timeout);
  }, []);

  const estimatedDate = React.useMemo(() => {
    if (!shippingInfo) return '';
    const date = new Date();
    date.setDate(date.getDate() + shippingInfo.days);
    return date.toLocaleDateString('pt-BR');
  }, [shippingInfo]);

  return (
    <div className="flex items-center gap-4 py-4 px-6 bg-ruah-50 rounded-2xl border border-ruah-100">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-accent-gold shadow-sm">
        <Truck size={18} />
      </div>
      <div className="flex flex-col flex-1">
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 size={12} className="animate-spin text-ruah-300" />
            <span className="text-xs font-bold text-ruah-300 uppercase tracking-[0.1em]">Calculando frete...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-ruah-950">Entrega para {shippingInfo?.city}</span>
              <MapPin size={10} className="text-accent-gold" />
            </div>
            <p className="text-xs text-ruah-500 font-medium uppercase tracking-[0.1em]">
              Chega em ate <span className="text-ruah-950 font-bold">{shippingInfo?.days} dias uteis</span> •
              previsao <span className="text-ruah-950 font-bold">{estimatedDate}</span> • frete{' '}
              <span className="text-green-600 font-bold">{shippingInfo?.price}</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}


