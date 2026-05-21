'use client';

import React from 'react';
import { MapPin, Plus, MoreVertical, Trash2, Edit2 } from 'lucide-react';

const ADDRESSES = [
  { id: 1, label: 'Casa (Principal)', street: 'Al. Gabriel Monteiro da Silva, 1000', city: 'São Paulo', state: 'SP', zip: '01442-000', default: true },
  { id: 2, label: 'Escritório', street: 'Av. Brigadeiro Faria Lima, 2000', city: 'São Paulo', state: 'SP', zip: '01451-001', default: false },
];

export default function Addresses() {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
         <div>
            <h2 className="text-4xl font-serif italic uppercase leading-none text-ruah-950">Endereços</h2>
            <p className="text-[10px] font-bold text-ruah-400 uppercase tracking-widest mt-4">Gerencie seus locais de entrega para agilizar o sopro.</p>
         </div>
         <button className="flex items-center gap-3 bg-ruah-950 text-white px-8 py-5 rounded-2xl hover:bg-accent-gold transition-all w-full sm:w-auto justify-center">
            <Plus size={16} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Novo Endereço</span>
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {ADDRESSES.map((addr) => (
            <div key={addr.id} className={`group p-10 rounded-[2.5rem] border transition-all ${addr.default ? 'bg-white border-accent-gold/30 shadow-subtle' : 'bg-white border-ruah-100 hover:shadow-xl'}`}>
               <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-12 bg-ruah-50 rounded-2xl flex items-center justify-center shadow-sm">
                     <MapPin size={20} className={addr.default ? 'text-accent-gold' : 'text-ruah-300'} />
                  </div>
                  <div className="flex gap-2">
                     <button className="p-2 text-ruah-300 hover:text-accent-gold transition-colors"><Edit2 size={16} /></button>
                     <button className="p-2 text-ruah-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
               </div>

               <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl font-serif italic text-ruah-950">{addr.label}</span>
                    {addr.default && <span className="px-2 py-0.5 bg-accent-gold/10 text-accent-gold text-[7px] font-bold uppercase tracking-widest rounded-full">Padrão</span>}
                  </div>
                  <p className="text-[11px] font-medium text-ruah-500 uppercase tracking-wider leading-relaxed">
                     {addr.street}<br />
                     {addr.city}, {addr.state} - {addr.zip}
                  </p>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}
