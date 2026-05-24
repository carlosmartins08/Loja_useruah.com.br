'use client';

import React from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';

const WISHLIST = [
  { id: '3', name: 'Aura Panel', price: 5200, image: 'https://picsum.photos/seed/p3/600/800', stock: 'restam 2' },
  { id: '4', name: 'Zenit Spot', price: 2100, image: 'https://picsum.photos/seed/p4/600/800', stock: 'em estoque' },
];

export default function Wishlist() {
  return (
    <div className="flex flex-col gap-12">
      <div>
        <h2 className="text-4xl font-serif italic uppercase leading-none">Favoritos</h2>
        <p className="text-sm font-medium text-lumina-500 mt-4">Sua curadoria pessoal UseRuah. Itens prontos para seu próximo pedido.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {WISHLIST.map((item) => (
          <div key={item.id} className="group flex flex-col gap-6">
            <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-lumina-50 border border-lumina-100 group-hover:shadow-2xl transition-all duration-700">
              <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
              <div className="absolute top-6 right-6">
                <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="absolute bottom-6 left-6">
                <span className={`px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-[0.1em] ${item.stock.includes('restam') ? 'text-red-500' : 'text-green-600'}`}>
                  {item.stock}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold uppercase tracking-tight">{item.name}</h3>
                <span className="text-sm font-mono text-accent-blue font-bold">R$ {item.price.toLocaleString('pt-BR')}</span>
              </div>
              <button className="w-full bg-lumina-950 text-white py-5 rounded-2xl font-bold uppercase text-xs tracking-[0.1em] flex items-center justify-center gap-3 hover:bg-accent-blue transition-all active:scale-95">
                <ShoppingBag size={14} /> Mover para o carrinho
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
