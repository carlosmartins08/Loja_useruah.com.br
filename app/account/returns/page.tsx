'use client';

import React from 'react';
import { RefreshCcw, FileText, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const RETURN_HISTORY = [
  { id: 'RTN-102', order: 'UR-8712', date: '20 Set 2026', type: 'Troca de tamanho', status: 'concluído' },
];

export default function ReturnsPage() {
  const [step] = React.useState(1);

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h2 className="text-4xl font-serif italic uppercase leading-none">Trocas e Devoluções</h2>
        <p className="text-sm font-medium text-ruah-500 mt-4">Processo simplificado e logística reversa sem fricção.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <div className="bg-white border border-ruah-100 rounded-[2.5rem] p-10 md:p-16">
            <div className="flex items-center gap-6 mb-12">
              <div className="w-16 h-16 bg-ruah-50 rounded-[2rem] flex items-center justify-center">
                <RefreshCcw size={28} className="text-accent-gold" />
              </div>
              <div>
                <span className="text-xs font-semibold text-accent-gold uppercase tracking-[0.14em] block mb-1">Passo {step} de 3</span>
                <h3 className="text-2xl font-serif italic">Iniciar solicitação</h3>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <span className="text-xs font-semibold text-ruah-400 uppercase tracking-[0.12em]">Selecione o pedido</span>
                <div className="p-6 border border-accent-gold rounded-2xl flex justify-between items-center bg-accent-gold/5">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase">Pedido UR-9482</span>
                    <span className="text-xs font-semibold text-accent-gold italic">Disponível para troca até 10 nov</span>
                  </div>
                  <CheckCircle2 size={18} className="text-accent-gold" />
                </div>
              </div>

              <div className="p-8 bg-red-50/50 border border-red-100 rounded-3xl flex gap-6">
                <AlertCircle size={20} className="text-red-500 shrink-0" />
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-red-600">Atenção às condições</span>
                  <p className="text-sm text-red-500 leading-relaxed font-medium">
                    A peça deve conter a etiqueta original, não apresentar sinais de uso ou lavagem e estar em sua embalagem UseRuah.
                  </p>
                </div>
              </div>

              <button className="w-full bg-ruah-950 text-white py-6 rounded-2xl font-bold uppercase text-xs tracking-[0.12em] hover:bg-accent-gold transition-all flex items-center justify-center gap-3">
                Continuar solicitação <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="bg-ruah-50 rounded-[2.5rem] p-10 border border-ruah-100">
            <div className="flex items-center gap-4 mb-8">
              <FileText size={18} className="text-accent-gold" />
              <h4 className="text-sm font-semibold tracking-[0.3em]">Histórico</h4>
            </div>
            <div className="flex flex-col gap-4">
              {RETURN_HISTORY.map((rtn) => (
                <div key={rtn.id} className="bg-white p-6 rounded-2xl border border-ruah-100 flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-ruah-400 uppercase tracking-[0.1em]">{rtn.date}</span>
                    <span className="text-sm font-semibold">{rtn.type}</span>
                  </div>
                  <span className="text-xs font-semibold uppercase text-green-600 bg-green-50 px-2 py-1 rounded-full">{rtn.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-10 border border-ruah-100 rounded-[2.5rem] flex flex-col gap-6">
            <h4 className="text-sm font-semibold tracking-[0.3em]">Nossa política</h4>
            <ul className="flex flex-col gap-4">
              {[
                'Primeira troca grátis em todo Brasil.',
                '7 dias para devolução imediata.',
                '30 dias para troca de especificação.',
                'Garantia de fabricação nos casos cobertos pela política.'
              ].map((rule, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-gold mt-1 shrink-0" />
                  <span className="text-sm font-medium text-ruah-500">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
