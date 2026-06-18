'use client';

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { AppImage } from '@/components/shared/AppImage';
import Link from 'next/link';

export interface SmartRecommendationItem {
  id: string;
  name: string;
  price: number;
  image: string;
  bundleHint: string;
  href?: string;
}

export function SmartRecommender({ recommendations }: { recommendations: SmartRecommendationItem[] }) {
  const visible = React.useMemo(() => recommendations.slice(0, 2), [recommendations]);

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-gold/10 rounded-full flex items-center justify-center text-accent-gold">
            <Sparkles size={14} />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-950">Compre junto</h3>
        </div>
        <span className="text-xs font-medium text-ruah-500">Sugestões para complementar o pedido</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visible.map((product) => (
          <Link
            key={product.id}
            href={product.href ?? `/product/${product.id}`}
            className="group bg-white border border-ruah-100 rounded-3xl p-6 hover:shadow-fancy transition-all duration-500"
          >
            <div className="flex gap-6 items-center">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-ruah-50">
                <AppImage context="content-banner" src={product.image} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-serif italic text-ruah-950">{product.name}</h4>
                <p className="text-xs font-bold text-accent-gold">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs font-medium text-ruah-500 mt-1">{product.bundleHint}</p>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ruah-400 mt-2 group-hover:text-ruah-950 transition-colors">
                  Ver detalhes <ArrowRight size={10} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}



