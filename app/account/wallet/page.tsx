'use client';

import React from 'react';
import { Wallet, Landmark, RefreshCw, ArrowUpRight, History } from 'lucide-react';

const TRANSACTIONS = [
  { id: 1, label: 'Crédito de Troca (LMN-8712)', amount: 1250, date: '16 Set 2026', type: 'in' },
  { id: 2, label: 'Compra Ocular Focus Pro', amount: -3490, date: '12 Out 2026', type: 'out' },
];

export default function WalletPage() {
  return (
    <div className="flex flex-col gap-12">
      
      <div>
         <h2 className="text-4xl font-serif italic uppercase leading-none">Minha Carteira</h2>
         <p className="text-[10px] font-bold text-lumina-400 uppercase tracking-widest mt-4">Gerencie seus créditos, reembolsos e métodos de pagamento salvos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         
         {/* Balance Card */}
         <div className="lg:col-span-12 bg-lumina-950 rounded-[3rem] p-12 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 pointer-events-none opacity-[0.03] translate-x-1/4">
               <Wallet size={400} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
               <div>
                  <span className="text-accent-blue text-[10px] font-bold uppercase tracking-widest mb-4 block">SALDO DISPONÍVEL</span>
                  <h3 className="text-7xl font-serif italic mb-6">R$ 1.250,00</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] max-w-sm">Este valor pode ser utilizado integralmente em sua próxima compra Lumina.</p>
               </div>
               <div className="flex flex-col gap-4 w-full md:w-auto">
                  <button className="bg-white text-lumina-950 px-10 py-5 rounded-2xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-accent-blue hover:text-white transition-all">
                     Usar Agora <ArrowUpRight size={16} />
                  </button>
                  <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-10 py-5 rounded-2xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all">
                     <RefreshCw size={16} /> Solicitar Estorno
                  </button>
               </div>
            </div>
         </div>

         {/* Transactions History */}
         <div className="lg:col-span-8">
            <div className="flex items-center gap-4 mb-10">
               <History size={20} className="text-accent-blue" />
               <h4 className="text-[10px] font-bold uppercase tracking-[0.3em]">Extrato Recente</h4>
            </div>
            <div className="flex flex-col gap-4">
               {TRANSACTIONS.map((t) => (
                  <div key={t.id} className="bg-white border border-lumina-100 rounded-3xl p-8 flex justify-between items-center hover:bg-lumina-50 transition-all">
                     <div className="flex flex-col gap-1">
                        <span className="text-[7px] font-bold text-lumina-300 uppercase tracking-widest">{t.date}</span>
                        <span className="text-xs font-bold uppercase tracking-tight">{t.label}</span>
                     </div>
                     <span className={`text-base font-mono font-bold ${t.type === 'in' ? 'text-green-600' : 'text-lumina-950'}`}>
                        {t.type === 'in' ? '+' : '-'} R$ {Math.abs(t.amount).toLocaleString('pt-BR')}
                     </span>
                  </div>
               ))}
            </div>
         </div>

         {/* Payment Methods */}
         <div className="lg:col-span-4 bg-lumina-50 rounded-[2.5rem] p-10 border border-lumina-100 flex flex-col gap-8">
            <div>
               <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8">Cartões Salvos</h4>
               <div className="flex flex-col gap-4">
                  <div className="p-6 bg-white rounded-2xl border border-lumina-200 flex flex-col gap-4 relative group">
                     <span className="text-[8px] font-bold text-accent-blue uppercase block">Principal</span>
                     <div className="flex justify-between items-end">
                        <span className="text-sm font-mono font-bold">**** 9012</span>
                        <span className="text-[7px] font-bold opacity-30">VISA / 10-2030</span>
                     </div>
                  </div>
                  <button className="w-full py-4 border-2 border-dashed border-lumina-200 rounded-2xl text-[9px] font-bold uppercase tracking-widest text-lumina-300 hover:border-accent-blue hover:text-accent-blue transition-all">
                     + Novo Cartão
                  </button>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
}
