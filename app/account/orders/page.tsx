'use client';

import React from 'react';
import { Package, RefreshCcw, ChevronRight, Truck, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import Image from 'next/image';

const ORDERS = [
  {
    id: 'RUAH-9482',
    date: '12 Out 2026',
    total: 349.90,
    status: 'producao',
    items: [
      { name: 'Camiseta Respiro', image: 'https://picsum.photos/seed/ruah-p1/200/200' }
    ]
  },
  {
    id: 'RUAH-8712',
    date: '15 Set 2026',
    total: 89.90,
    status: 'entregue',
    items: [
      { name: 'Moletom Fé Viva', image: 'https://picsum.photos/seed/ruah-p2/200/200' }
    ]
  }
];

const STATUS_MAP: Record<string, { label: string, color: string, icon: any }> = {
  recebido: { label: 'Pedido Recebido', color: 'text-ruah-400', icon: Package },
  producao: { label: 'Sopro da Arte (Produção)', color: 'text-accent-gold', icon: RefreshCcw },
  embalagem: { label: 'Finalizando Experiência', color: 'text-accent-gold', icon: Sparkles },
  enviado: { label: 'Em Trânsito', color: 'text-accent-gold', icon: Truck },
  entregue: { label: 'Entregue com Fé', color: 'text-green-600', icon: CheckCircle2 },
};

export default function MyOrders() {
  const [ratedOrders, setRatedOrders] = React.useState<string[]>([]);
  
  const handleRate = (orderId: string) => {
    setRatedOrders(prev => [...prev, orderId]);
    // In a real app, this would send a POST to /api/feedback
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="mb-4">
         <h2 className="text-4xl font-serif italic uppercase leading-none text-ruah-950">Meus Pedidos</h2>
         <p className="text-[10px] font-bold text-ruah-400 uppercase tracking-widest mt-4">Acompanhe seu histórico de fé e arte.</p>
      </div>

      <div className="flex flex-col gap-6">
         {ORDERS.map((order) => {
            const statusConfig = STATUS_MAP[order.status];
            return (
               <div key={order.id} className="bg-white border border-ruah-100 rounded-[2.5rem] overflow-hidden hover:shadow-xl transition-all group">
                  <div className="p-8 md:p-12">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b border-ruah-50">
                        <div className="flex flex-col gap-1">
                           <span className="text-[9px] font-bold text-ruah-300 uppercase tracking-widest">PEDIDO {order.id}</span>
                           <span className="text-xl font-serif italic text-ruah-950">{order.date}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <statusConfig.icon size={16} className={statusConfig.color} />
                           <span className={`text-[10px] font-bold uppercase tracking-widest ${statusConfig.color}`}>{statusConfig.label}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <span className="text-[9px] font-bold text-ruah-300 uppercase tracking-widest">TOTAL</span>
                           <span className="text-xl font-mono text-ruah-950">R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                     </div>

                     {/* BPMN Progress Flow */}
                     <div className="mb-12 px-4">
                        <div className="flex justify-between items-center mb-6">
                           <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent-gold">Fluxo BPMN de Produção</span>
                           <div className="flex items-center gap-2">
                              <Clock size={10} className="text-ruah-300" />
                              <span className="text-[8px] font-bold text-ruah-300 uppercase tracking-widest">Tempo de Cura: 12 dias</span>
                           </div>
                        </div>
                        <div className="relative">
                           <div className="absolute top-1/2 left-0 w-full h-[1px] bg-ruah-50 -translate-y-1/2" />
                           <div 
                             className="absolute top-1/2 left-0 h-[2px] bg-accent-gold -translate-y-1/2 transition-all duration-1000 ease-out" 
                             style={{ width: `${(['recebido', 'producao', 'enviado', 'entregue'].indexOf(order.status) / 3) * 100}%` }}
                           />
                           <div className="relative flex justify-between">
                              {['recebido', 'producao', 'enviado', 'entregue'].map((s, idx) => {
                                 const stepsArr = ['recebido', 'producao', 'enviado', 'entregue'];
                                 const currentIdx = stepsArr.indexOf(order.status);
                                 const isActive = idx <= currentIdx;
                                 const isCurrent = idx === currentIdx;

                                 return (
                                   <div key={s} className="flex flex-col items-center gap-3 relative z-10">
                                      <div className={`w-3 h-3 rounded-full border-2 border-white transition-all duration-700 ${isActive ? 'bg-accent-gold scale-125' : 'bg-ruah-200'}`} />
                                      {isCurrent && (
                                        <div className="absolute -top-1 w-3 h-3 rounded-full bg-accent-gold animate-ping" />
                                      )}
                                      <span className={`text-[7px] font-bold uppercase tracking-widest transition-colors duration-500 ${isActive ? 'text-ruah-950' : 'text-ruah-200'}`}>
                                         {STATUS_MAP[s]?.label.split(' ')[0]}
                                      </span>
                                   </div>
                                 );
                              })}
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-col lg:flex-row justify-between items-center gap-12">
                        <div className="flex items-center gap-8 w-full">
                           {order.items.map((item, i) => (
                             <div key={i} className="flex items-center gap-6">
                                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-ruah-50">
                                   <Image src={item.image} alt={item.name} fill className="object-cover" />
                                </div>
                                <div className="flex flex-col gap-1">
                                   <span className="text-xs font-bold uppercase tracking-tight text-ruah-950">{item.name}</span>
                                   <span className="text-[9px] font-bold text-ruah-300 uppercase tracking-widest">QTD: 1</span>
                                </div>
                             </div>
                           ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto shrink-0">
                           {order.status === 'entregue' && (
                             <div className="flex flex-col gap-4">
                               {ratedOrders.includes(order.id) ? (
                                 <div className="bg-green-50 px-6 py-4 rounded-2xl border border-green-100 flex items-center gap-3">
                                    <Sparkles size={14} className="text-green-600" />
                                    <span className="text-[8px] font-bold text-green-600 uppercase tracking-widest">Obrigado pelo seu Sopro de Fé!</span>
                                 </div>
                               ) : (
                                 <div className="flex flex-col gap-3">
                                   <span className="text-[8px] font-bold text-ruah-300 uppercase tracking-widest text-center">Como foi sua experiência?</span>
                                   <div className="flex gap-2 justify-center">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button 
                                          key={star} 
                                          onClick={() => handleRate(order.id)}
                                          className="text-ruah-200 hover:text-accent-gold transition-colors"
                                        >
                                           <Sparkles size={16} />
                                        </button>
                                      ))}
                                   </div>
                                 </div>
                               )}
                               <button className="flex items-center justify-center gap-3 bg-ruah-50 hover:bg-ruah-100 px-8 py-5 rounded-2xl transition-all">
                                  <RefreshCcw size={16} className="text-ruah-950" />
                                  <span className="text-[9px] font-bold text-ruah-950 uppercase tracking-widest whitespace-nowrap">Solicitar Troca</span>
                               </button>
                             </div>
                           )}
                           <button className="flex items-center justify-center gap-3 bg-ruah-950 text-white px-8 py-5 rounded-2xl hover:bg-accent-gold transition-all shadow-fancy">
                              <span className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">Detalhes Completos</span>
                              <ChevronRight size={14} />
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            );
         })}
      </div>
    </div>
  );
}
