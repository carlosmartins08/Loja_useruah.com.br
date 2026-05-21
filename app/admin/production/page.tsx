'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Factory, Printer, QrCode, Layers, Search, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

const PRODUCTION_LENS = [
  {
    sku: 'OC-PRO-3K-BLK',
    name: 'Ocular Focus Pro',
    spec: '3000K | Preto Fosco',
    orders: 12,
    ready: 8,
    status: 'active'
  },
  {
    sku: 'ZB-LIN-4K-WHT',
    name: 'Z-Beam Linear',
    spec: '4000K | Branco Micro',
    orders: 5,
    ready: 0,
    status: 'pending'
  }
];

export default function MerchantProductionPage() {
  return (
    <main className="min-h-screen bg-ruah-25 pb-40 font-sans">
       <div className="max-w-7xl mx-auto px-6 pt-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
             <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-blue-500 text-white px-2 py-1 rounded">Módulo 4</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-ruah-400">Gestão Operacional & CVu</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-serif uppercase italic leading-none font-black text-ruah-950">
                  FILA DE <span className="text-accent-gold">PRODUÇÃO.</span>
                </h1>
                <p className="text-xs font-bold text-ruah-400 uppercase tracking-[0.2em] leading-loose max-w-xl">
                   Otimização automática de lotes (Smart Batching): Pedidos com especificações similares agrupados pelo sistema ELIV para máxima eficiência.
                </p>
             </div>
             <div className="flex gap-4">
                <div className="relative">
                   <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ruah-300" />
                   <input 
                     type="text" 
                     placeholder="Buscar SKU ou Pedido..."
                     className="pl-12 pr-6 py-4 bg-white border border-ruah-100 rounded-2xl text-xs font-medium outline-none focus:border-accent-gold transition-all w-64 shadow-sm"
                   />
                </div>
                <button className="p-4 bg-white border border-ruah-100 rounded-2xl text-ruah-950 hover:bg-ruah-950 hover:text-white transition-all shadow-sm">
                   <Filter size={18} />
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             
             {/* Productivity Stats */}
             <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="bg-ruah-950 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/20 blur-[80px]" />
                   <div className="relative z-10 flex flex-col gap-8">
                      <div className="flex flex-col gap-2">
                         <span className="text-[10px] font-bold text-accent-gold uppercase tracking-[0.2em]">Pilar M4: Capacidade</span>
                         <h2 className="text-6xl font-serif italic font-black">84%</h2>
                      </div>
                      <div className="flex flex-col gap-4">
                         <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-white/40">Lote Corrente</span>
                            <span>12/15 Unidades</span>
                         </div>
                         <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-accent-gold w-[80%]" />
                         </div>
                      </div>
                      <button className="flex items-center justify-center gap-3 w-full bg-accent-gold text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-lg shadow-accent-gold/20">
                         <Layers size={14} /> Relatório de Carga
                      </button>
                   </div>
                </div>

                <div className="bg-white border border-ruah-50 p-8 rounded-[2.5rem] flex flex-col gap-6 shadow-sm">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-ruah-300">Alertas de Sincronia</h3>
                   <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-4 p-5 bg-red-50 rounded-2xl border border-red-100">
                         <AlertCircle size={18} className="text-red-500" />
                         <span className="text-[9px] font-black text-red-700 uppercase tracking-widest">2 Divergências SKU / M1</span>
                      </div>
                      <div className="flex items-center gap-4 p-5 bg-green-50 rounded-2xl border border-green-100">
                         <CheckCircle2 size={18} className="text-green-600" />
                         <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">14 Pedidos Validados</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Production Batches List */}
             <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="flex justify-between items-center px-4">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-ruah-300 uppercase">Fulfillment Ativo (Smart Batching)</h3>
                   <span className="text-[8px] font-black text-accent-gold uppercase tracking-widest bg-accent-gold/10 px-2 py-1 rounded">Sistema ELIV M-Track</span>
                </div>

                <div className="flex flex-col gap-6">
                   {PRODUCTION_LENS.map((batch) => (
                      <div key={batch.sku} className="bg-white border border-ruah-50 p-8 rounded-[2.5rem] hover:shadow-2xl hover:-translate-y-1 transition-all group">
                         <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
                            <div className="flex gap-6">
                               <div className="w-20 h-20 bg-ruah-25 rounded-2xl flex items-center justify-center text-ruah-200 group-hover:text-accent-gold transition-colors">
                                  <Factory size={32} />
                               </div>
                               <div className="flex flex-col justify-center gap-1">
                                  <span className="text-[9px] font-black text-accent-gold uppercase tracking-[0.2em]">{batch.sku}</span>
                                  <h4 className="text-2xl font-serif uppercase italic font-black leading-tight text-ruah-950">{batch.name}</h4>
                                  <p className="text-[10px] font-bold text-ruah-400 uppercase tracking-widest">{batch.spec}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-12 px-8 border-l border-ruah-100">
                               <div className="text-center">
                                  <span className="text-[8px] font-bold text-ruah-300 uppercase block mb-1">Pedidos</span>
                                  <span className="text-2xl font-serif italic text-ruah-950 font-black leading-none">{batch.orders}</span>
                                </div>
                                <div className="text-center">
                                  <span className="text-[8px] font-bold text-ruah-300 uppercase block mb-1">Prontos</span>
                                  <span className="text-2xl font-serif italic text-accent-gold font-black leading-none">{batch.ready}</span>
                                </div>
                             </div>
                          </div>
 
                          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-ruah-50">
                             <div className="flex gap-3">
                                <button className="flex items-center gap-2 px-5 py-3 bg-ruah-25 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-ruah-50 transition-all text-ruah-600">
                                   <Printer size={14} /> Imprimir Fichas
                                </button>
                                <button className="flex items-center gap-2 px-5 py-3 bg-ruah-25 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-ruah-50 transition-all text-ruah-600">
                                   <QrCode size={14} /> Gerar QR Lote
                                </button>
                             </div>
                             <button className="bg-ruah-950 text-white px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-accent-gold transition-all shadow-lg shadow-ruah-950/10">
                                Iniciar Montagem do Lote
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
                 
                 <div className="mt-8 flex justify-center">
                    <button className="text-[10px] font-black text-ruah-300 uppercase tracking-[0.5em] border-b border-ruah-100 pb-2 hover:text-ruah-950 hover:border-accent-gold transition-all">
                       Carregar Linha Completa
                    </button>
                 </div>
              </div>
           </div>
        </div>
     </main>
  );
}
