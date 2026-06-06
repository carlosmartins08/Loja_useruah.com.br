'use client';

import React from 'react';
import { Wallet, RefreshCw, ArrowUpRight, History } from 'lucide-react';

const TRANSACTIONS = [
  { id: 1, label: 'Crédito de Troca (UR-8712)', amount: 1250, date: '16 Set 2026', type: 'in' },
  { id: 2, label: 'Compra Camiseta Essência', amount: -349, date: '12 Out 2026', type: 'out' },
];

export default function WalletPage() {
  return (
    <div className="flex flex-col gap-12">
      <div>
        <h2 className="text-4xl font-serif italic uppercase leading-none">Minha Carteira</h2>
        <p className="text-sm font-medium text-ruah-500 mt-4">Gerencie seus créditos, reembolsos e métodos de pagamento salvos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 bg-azul-profundidade rounded-[3rem] p-12 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 pointer-events-none opacity-[0.03] translate-x-1/4">
            <Wallet size={400} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
            <div>
              <span className="text-accent-gold text-xs font-semibold uppercase tracking-[0.14em] mb-4 block">SALDO DISPONÍVEL</span>
              <h3 className="text-7xl font-serif italic mb-6">R$ 1.250,00</h3>
              <p className="text-sm font-medium text-white/70 max-w-sm">Este valor pode ser utilizado integralmente em sua próxima compra UseRuah.</p>
            </div>
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <button className="bg-white text-ruah-950 px-10 py-5 rounded-2xl font-bold uppercase text-xs tracking-[0.12em] flex items-center justify-center gap-3 hover:bg-accent-gold hover:text-white transition-all">
                Usar agora <ArrowUpRight size={16} />
              </button>
              <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-10 py-5 rounded-2xl font-bold uppercase text-xs tracking-[0.12em] flex items-center justify-center gap-3 transition-all">
                <RefreshCw size={16} /> Solicitar estorno
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="flex items-center gap-4 mb-10">
            <History size={20} className="text-accent-gold" />
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em]">Extrato Recente</h4>
          </div>
          <div className="flex flex-col gap-4">
            {TRANSACTIONS.map((t) => (
              <div key={t.id} className="bg-white border border-ruah-100 rounded-3xl p-8 flex justify-between items-center hover:bg-ruah-50 transition-all">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-ruah-400">{t.date}</span>
                  <span className="text-sm font-semibold">{t.label}</span>
                </div>
                <span className={`text-base font-mono font-bold ${t.type === 'in' ? 'text-green-600' : 'text-ruah-950'}`}>
                  {t.type === 'in' ? '+' : '-'} R$ {Math.abs(t.amount).toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-ruah-50 rounded-[2.5rem] p-10 border border-ruah-100 flex flex-col gap-8">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8">Cartões salvos</h4>
            <div className="flex flex-col gap-4">
              <div className="p-6 bg-white rounded-2xl border border-ruah-200 flex flex-col gap-4 relative group">
                <span className="text-xs font-semibold text-accent-gold uppercase block">Principal</span>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-mono font-bold">**** 9012</span>
                  <span className="text-xs font-medium opacity-40">VISA / 10-2030</span>
                </div>
              </div>
              <button className="w-full py-4 border-2 border-dashed border-ruah-200 rounded-2xl text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400 hover:border-accent-gold hover:text-accent-gold transition-all">
                + Novo cartão
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
