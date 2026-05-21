'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Package, RefreshCcw, ArrowRight, ShieldCheck, AlertCircle, FileText, CheckCircle2, ChevronRight, Loader2, QrCode } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type ReturnStep = 'lookup' | 'selection' | 'reason' | 'confirmation';

export default function ReturnsPortalPage() {
  const [step, setStep] = useState<ReturnStep>('lookup');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [cpf, setCpf] = useState('');

  const [orderData, setOrderData] = useState<{ id: string; items: any[] } | null>(null);

  const handleLookup = async () => {
    setLoading(true);
    // Simulate lookup delay
    setTimeout(() => {
      setOrderData({
        id: orderId || 'LM-99023',
        items: [
          { id: '1', name: 'Ocular Focus Pro', spec: '3000K | Preto Fosco | 1200mm', image: 'https://picsum.photos/seed/p1/200/200' },
          { id: '2', name: 'Z-Beam Linear', spec: '4000K | Branco Micro | 1800mm', image: 'https://picsum.photos/seed/p2/200/200' }
        ]
      });
      setLoading(false);
      setStep('selection');
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-lumina-50 flex items-center justify-center py-40 px-6">
       <div className="w-full max-w-2xl">
          
          {/* Header */}
          <div className="text-center mb-16 flex flex-col items-center gap-6">
             <div className="w-16 h-16 bg-white rounded-3xl shadow-fancy flex items-center justify-center text-accent-blue mb-4">
                <RefreshCcw size={32} />
             </div>
             <span className="tech-label text-accent-blue">Logistics Intelligence</span>
             <h1 className="text-5xl font-serif italic uppercase leading-none">PORTAL DE <br /> LOGÍSTICA REVERSA.</h1>
             <p className="text-xs font-bold text-lumina-400 uppercase tracking-widest leading-loose max-w-sm">
                Autonomia total para trocas e devoluções. Sistema integrado à nossa malha de transporte.
             </p>
          </div>

          <div className="bg-white border border-lumina-100 rounded-[3rem] shadow-2xl overflow-hidden relative">
             
             {/* Progress bar */}
             <div className="h-1.5 w-full bg-lumina-50 flex gap-0.5">
                <div className={`flex-1 transition-all duration-700 ${step === 'lookup' ? 'bg-accent-blue' : 'bg-lumina-950'}`} />
                <div className={`flex-1 transition-all duration-700 ${['selection', 'reason', 'confirmation'].includes(step) ? (step === 'selection' ? 'bg-accent-blue' : 'bg-lumina-950') : 'bg-lumina-100'}`} />
                <div className={`flex-1 transition-all duration-700 ${['reason', 'confirmation'].includes(step) ? (step === 'reason' ? 'bg-accent-blue' : 'bg-lumina-950') : 'bg-lumina-100'}`} />
                <div className={`flex-1 transition-all duration-700 ${step === 'confirmation' ? 'bg-accent-blue' : 'bg-lumina-100'}`} />
             </div>

             <div className="p-12 md:p-20">
                <AnimatePresence mode="wait">
                   {step === 'lookup' && (
                     <motion.div 
                       key="lookup"
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -20 }}
                       className="flex flex-col gap-10"
                     >
                        <div className="flex flex-col gap-8">
                           <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-bold text-lumina-300 uppercase tracking-[0.3em]">Número do Pedido</label>
                              <input 
                                type="text" 
                                placeholder="LM-00000"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                className="bg-lumina-50 border border-lumina-100 rounded-2xl py-6 px-8 text-xl font-serif italic outline-none focus:border-accent-blue transition-all"
                              />
                           </div>
                           <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-bold text-lumina-300 uppercase tracking-[0.3em]">CPF do Titular</label>
                              <input 
                                type="text" 
                                placeholder="000.000.000-00"
                                value={cpf}
                                onChange={(e) => setCpf(e.target.value)}
                                className="bg-lumina-50 border border-lumina-100 rounded-2xl py-6 px-8 text-xl font-serif italic outline-none focus:border-accent-blue transition-all"
                              />
                           </div>
                        </div>

                        <button 
                          onClick={handleLookup}
                          disabled={loading || !orderId || !cpf}
                          className="w-full bg-lumina-950 text-white py-8 rounded-3xl font-bold uppercase text-[11px] tracking-[0.4em] hover:bg-accent-blue transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                           {loading ? <Loader2 className="animate-spin" size={20} /> : <>BUSCAR PEDIDO <ArrowRight size={16} /></>}
                        </button>

                        <div className="flex items-center gap-4 p-6 bg-lumina-25 rounded-2xl border border-dashed border-lumina-100">
                           <AlertCircle size={20} className="text-lumina-300" />
                           <p className="text-[9px] font-bold text-lumina-400 uppercase tracking-widest leading-relaxed">
                              Segurança de Dados: Somente o titular da compra pode iniciar o processo de logística reversa autônoma.
                           </p>
                        </div>
                     </motion.div>
                   )}

                   {step === 'selection' && orderData && (
                     <motion.div 
                       key="selection"
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -20 }}
                       className="flex flex-col gap-10"
                     >
                        <div className="flex flex-col gap-2">
                           <h3 className="text-2xl font-serif italic uppercase leading-none">Selecione os Itens</h3>
                           <p className="text-[9px] font-bold text-lumina-400 uppercase tracking-widest">PEDIDO #{orderData.id}</p>
                        </div>

                        <div className="flex flex-col gap-4">
                           {orderData.items.map((item) => (
                             <div key={item.id} className="flex items-center gap-6 p-6 bg-lumina-50 rounded-3xl border border-lumina-100 group cursor-pointer hover:border-accent-blue transition-all">
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-sm shrink-0">
                                   <Image src={item.image} alt={item.name} fill className="object-cover" />
                                </div>
                                <div className="flex-1">
                                   <h4 className="text-sm font-bold uppercase tracking-tight text-lumina-950 mb-1">{item.name}</h4>
                                   <p className="text-[9px] font-medium text-lumina-400 uppercase tracking-widest">{item.spec}</p>
                                </div>
                                <div className="w-6 h-6 rounded-full border-2 border-lumina-200 group-hover:border-accent-blue flex items-center justify-center transition-all">
                                   <div className="w-2.5 h-2.5 rounded-full bg-accent-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                             </div>
                           ))}
                        </div>

                        <div className="flex gap-4">
                           <button onClick={() => setStep('lookup')} className="flex-1 bg-white border border-lumina-100 py-6 rounded-2xl font-bold uppercase text-[9px] tracking-[0.3em] hover:bg-lumina-50 transition-all uppercase">Voltar</button>
                           <button onClick={() => setStep('reason')} className="flex-[2] bg-lumina-950 text-white py-6 rounded-2xl font-bold uppercase text-[9px] tracking-[0.3em] hover:bg-accent-blue transition-all shadow-xl uppercase">Continuar</button>
                        </div>
                     </motion.div>
                   )}

                   {step === 'reason' && (
                     <motion.div 
                       key="reason"
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -20 }}
                       className="flex flex-col gap-10"
                     >
                        <div className="flex flex-col gap-2">
                           <h3 className="text-2xl font-serif italic uppercase leading-none">Motivo da Solicitação</h3>
                           <p className="text-[9px] font-bold text-lumina-400 uppercase tracking-widest leading-loose">Seu feedback ajuda nosso Simultaneous Engineering a evoluir.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                           {['Arrependimento de Compra', 'Medida Incompatível', 'Acabamento diferente do esperado', 'Defeito de Fabricação (Garantia)'].map((r) => (
                             <button key={r} className="p-6 text-left rounded-2xl border border-lumina-100 text-[10px] font-bold uppercase tracking-widest hover:border-accent-blue hover:bg-accent-blue/5 transition-all text-lumina-400 hover:text-accent-blue">
                                {r}
                             </button>
                           ))}
                        </div>

                        <button onClick={() => setStep('confirmation')} className="w-full bg-lumina-950 text-white py-8 rounded-3xl font-bold uppercase text-[11px] tracking-[0.4em] hover:bg-accent-blue transition-all shadow-xl uppercase">Confirmar Solicitação</button>
                     </motion.div>
                   )}

                   {step === 'confirmation' && (
                     <motion.div 
                       key="confirmation"
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className="flex flex-col items-center text-center gap-10"
                     >
                        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center shadow-lg mb-4">
                           <CheckCircle2 size={40} />
                        </div>
                        <div className="flex flex-col gap-4">
                           <h3 className="text-4xl font-serif italic uppercase leading-tight">LOGÍSTICA <br /> AGENDADA.</h3>
                           <p className="text-xs font-bold text-lumina-400 uppercase tracking-widest leading-loose max-w-sm">
                              Seu ticket de devolução foi gerado com sucesso. O novo item foi reservado em estoque técnico.
                           </p>
                        </div>

                        <div className="w-full p-8 bg-lumina-50 rounded-[2.5rem] border border-lumina-100 flex flex-col gap-8">
                           <div className="flex justify-between items-center text-left">
                              <div>
                                 <span className="text-[8px] font-bold text-lumina-300 uppercase block mb-1">Código de Postagem</span>
                                 <span className="text-2xl font-mono text-lumina-950 tracking-tighter">LV 990 023 11 BR</span>
                              </div>
                              <QrCode size={48} className="text-lumina-950 opacity-20" />
                           </div>
                           <div className="h-px bg-lumina-100" />
                           <div className="grid grid-cols-2 gap-6 text-left">
                              <div>
                                 <span className="text-[8px] font-bold text-lumina-300 uppercase block mb-1">Expira em</span>
                                 <span className="text-[10px] font-bold uppercase">7 Dias Úteis</span>
                              </div>
                              <div>
                                 <span className="text-[8px] font-bold text-lumina-300 uppercase block mb-1">Método</span>
                                 <span className="text-[10px] font-bold uppercase">Coleta Agendada</span>
                              </div>
                           </div>
                        </div>

                        <button className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-accent-blue border-b border-accent-blue/30 pb-2 hover:border-accent-blue transition-all">
                           <FileText size={16} /> DOWNLOAD ETIQUETA PDF
                        </button>

                        <Link href="/help-center" className="text-[9px] font-bold text-lumina-300 uppercase tracking-widest hover:text-lumina-950 transition-colors">Voltar para Central de Ajuda</Link>
                     </motion.div>
                   )}
                </AnimatePresence>
             </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="p-8 bg-white border border-lumina-100 rounded-3xl flex items-start gap-4">
                <Package size={24} className="text-accent-blue shrink-0" />
                <div>
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-lumina-950 mb-2">Embalagem Original</h4>
                   <p className="text-[9px] font-medium text-lumina-400 uppercase tracking-widest leading-relaxed">
                      Utilize a embalagem técnica original para garantir a proteção estrutural dos drivers e módulos LED.
                   </p>
                </div>
             </div>
             <div className="p-8 bg-white border border-lumina-100 rounded-3xl flex items-start gap-4">
                <ShieldCheck size={24} className="text-accent-blue shrink-0" />
                <div>
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-lumina-950 mb-2">Inspeção de Qualidade</h4>
                   <p className="text-[9px] font-medium text-lumina-400 uppercase tracking-widest leading-relaxed">
                      Após o recebimento, nossa equipe realiza um check técnico em 48h para liberar seu estorno ou novo crédito.
                   </p>
                </div>
             </div>
          </div>
       </div>
    </main>
  );
}
