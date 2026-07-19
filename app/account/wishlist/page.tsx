'use client';

import React from 'react';
import { Heart } from 'lucide-react';

export default function Wishlist() {
  return (
    <div className="flex flex-col gap-12">
      <div>
        <h2 className="text-4xl font-serif italic uppercase leading-none">Favoritos</h2>
        <p className="text-sm font-medium text-ruah-500 mt-4">Sua curadoria pessoal será exibida quando houver favoritos reais vinculados à conta.</p>
      </div>

      <div className="rounded-[2.5rem] border border-dashed border-ruah-200 bg-white p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ruah-50 text-accent-gold">
          <Heart size={28} />
        </div>
        <h3 className="mt-6 text-2xl font-serif italic text-ruah-950">Nenhum favorito carregado</h3>
        <p className="mx-auto mt-4 max-w-xl text-sm text-ruah-500">
          Os favoritos aparecerão aqui quando houver uma fonte persistente de preferências da conta.
        </p>
      </div>
    </div>
  );
}

