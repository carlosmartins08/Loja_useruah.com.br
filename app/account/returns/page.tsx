'use client';

import React from 'react';
import { RefreshCcw, FileText, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const RETURN_HISTORY = [
  { id: 'RTN-102', order: 'LMN-8712', date: '20 Set 2026', type: 'Troca de Tamanho', status: 'concluido' },
];

export default function ReturnsPage() {
  const [step, setStep] = React.useState(1);

  return (
    <div className="flex flex-col gap-12">
      <div>
         <h2 className="text-4xl font-serif italic uppercase leading-none">Trocas e Devoluções</h2>
         <p className="text-[10px] font-bold text-lumina-400 uppercase tracking-widest mt-4">Processo simplificado e logística reversa sem fricção.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         
         {/* Active Return Process */}
         <div className="lg:col-span-7">
            <div className="bg-white border border-lumina-100 rounded-[2.5rem] p-10 md:p-16">
               <div className="flex items-center gap-6 mb-12">
                  <div className="w-16 h-16 bg-lumina-50 rounded-[2rem] flex items-center justify-center">
                     <RefreshCcw size={28} className="text-accent-blue" />
                  </div>
                  <div>
                     <span className="text-[10px] font-bold text-accent-blue uppercase tracking-widest block mb-1">Passo {step} de 3</span>
                     <h3 className="text-2xl font-serif italic">Iniciar Solicitação</h3>
                  </div>
               </div>

               <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-4">
                     <span className="text-[9px] font-bold text-lumina-300 uppercase tracking-[0.2em]">Selecione o Pedido</span>
                     <div className="p-6 border border-accent-blue rounded-2xl flex justify-between items-center bg-accent-blue/5">
                        <div className="flex flex-col gap-1">
                           <span className="text-xs font-bold uppercase">Pedido LMN-9482</span>
                           <span className="text-[9px] font-bold text-accent-blue uppercase tracking-widest italic">Disponível para troca até 10 Nov</span>
                        </div>
                        <CheckCircle2 size={18} className="text-accent-blue" />
                     </div>
                  </div>

                  <div className="p-8 bg-red-50/50 border border-red-100 rounded-3xl flex gap-6">
                     <AlertCircle size={20} className="text-red-500 shrink-0" />
                     <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Atenção às Condições</span>
                        <p className="text-[10px] text-red-400 leading-relaxed uppercase font-medium tracking-wide">
                          A peça deve conter a etiqueta original, não apresentar sinais de uso ou lavagem e estar em sua embalagem Lumina.
                        </p>
                     </div>
                  </div>

                  <button className="w-full bg-lumina-950 text-white py-6 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-accent-blue transition-all flex items-center justify-center gap-3">
                     Continuar Solicitação <ChevronRight size={16} />
                  </button>
               </div>
            </div>
         </div>

         {/* History & Policy */}
         <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="bg-lumina-50 rounded-[2.5rem] p-10 border border-lumina-100">
               <div className="flex items-center gap-4 mb-8">
                  <FileText size={18} className="text-accent-blue" />
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.3em]">Histórico</h4>
               </div>
               <div className="flex flex-col gap-4">
                  {RETURN_HISTORY.map((rtn) => (
                     <div key={rtn.id} className="bg-white p-6 rounded-2xl border border-lumina-100 flex justify-between items-center">
                        <div className="flex flex-col gap-1">
                           <span className="text-[9px] font-bold text-lumina-300 uppercase tracking-widest">{rtn.date}</span>
                           <span className="text-[10px] font-bold uppercase">{rtn.type}</span>
                        </div>
                        <span className="text-[8px] font-bold uppercase text-green-600 bg-green-50 px-2 py-1 rounded-full">{rtn.status}</span>
                     </div>
                  ))}
               </div>
            </div>

            <div className="p-10 border border-lumina-100 rounded-[2.5rem] flex flex-col gap-6">
               <h4 className="text-[10px] font-bold uppercase tracking-[0.3em]">Nossa Política</h4>
               <ul className="flex flex-col gap-4">
                  {[
                    "Primeira troca grátis em todo Brasil.",
                    "7 dias para devolução imediata.",
                    "30 dias para troca de especificação.",
                    "Garantia vitalícia na estrutura LED."
                  ].map((rule, i) => (
                    <li key={i} className="flex gap-4 items-start">
                       <div className="w-1.5 h-1.5 rounded-full bg-accent-blue mt-1 shrink-0" />
                       <span className="text-[10px] font-medium text-lumina-400 uppercase tracking-widest">{rule}</span>
                    </li>
                  ))}
               </ul>
            </div>
         </div>

      </div>
    </div>
  );
}
