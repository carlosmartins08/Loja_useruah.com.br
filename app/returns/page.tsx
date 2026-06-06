'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, ArrowRight, ShieldCheck, AlertCircle, FileText, CheckCircle2, Loader2, Package } from 'lucide-react';
import { AppImage } from '@/components/shared/AppImage';
import Link from 'next/link';
import { BRAND_PRODUCT_SEEDS } from '@/lib/brand-assets';

type ReturnStep = 'lookup' | 'selection' | 'reason' | 'confirmation';

const MOCK_RETURN_ITEMS = [
  {
    id: BRAND_PRODUCT_SEEDS[0].id,
    name: BRAND_PRODUCT_SEEDS[0].name,
    spec: 'M | Off White | Serigrafia',
    image: BRAND_PRODUCT_SEEDS[0].image,
  },
  {
    id: BRAND_PRODUCT_SEEDS[1].id,
    name: BRAND_PRODUCT_SEEDS[1].name,
    spec: 'G | Preto Ruah | Bordado',
    image: BRAND_PRODUCT_SEEDS[1].image,
  },
];

const RETURN_REASONS = [
  'Arrependimento de compra',
  'Tamanho diferente do esperado',
  'Acabamento diferente da expectativa',
  'Peça com defeito ou avaria',
];

export default function ReturnsPortalPage() {
  const [step, setStep] = useState<ReturnStep>('lookup');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [cpf, setCpf] = useState('');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<{ id: string; items: typeof MOCK_RETURN_ITEMS } | null>(null);

  const handleLookup = async () => {
    setLoading(true);
    window.setTimeout(() => {
      setOrderData({
        id: orderId || 'RH-99023',
        items: MOCK_RETURN_ITEMS,
      });
      setLoading(false);
      setStep('selection');
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-ruah-50 flex items-center justify-center py-32 px-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-16 flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-3xl shadow-fancy flex items-center justify-center text-accent-gold mb-4">
            <RefreshCcw size={32} />
          </div>
          <span className="tech-label text-accent-gold">Trocas e devoluções</span>
          <h1 className="text-5xl font-serif italic uppercase leading-none">
            PORTAL DE
            <br />
            RETORNO RUAH.
          </h1>
          <p className="text-xs font-bold text-ruah-400 uppercase tracking-widest leading-loose max-w-sm">
            Um fluxo simples para troca ou devolução, sem burocracia desnecessária e sem matar a atmosfera da marca.
          </p>
        </div>

        <div className="bg-white border border-ruah-100 rounded-[3rem] shadow-2xl overflow-hidden relative">
          <div className="h-1.5 w-full bg-ruah-50 flex gap-0.5">
            <div className={`flex-1 transition-all duration-700 ${step === 'lookup' ? 'bg-accent-gold' : 'bg-ruah-950'}`} />
            <div className={`flex-1 transition-all duration-700 ${['selection', 'reason', 'confirmation'].includes(step) ? (step === 'selection' ? 'bg-accent-gold' : 'bg-ruah-950') : 'bg-ruah-100'}`} />
            <div className={`flex-1 transition-all duration-700 ${['reason', 'confirmation'].includes(step) ? (step === 'reason' ? 'bg-accent-gold' : 'bg-ruah-950') : 'bg-ruah-100'}`} />
            <div className={`flex-1 transition-all duration-700 ${step === 'confirmation' ? 'bg-accent-gold' : 'bg-ruah-100'}`} />
          </div>

          <div className="p-12 md:p-16">
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
                      <label className="text-[10px] font-bold text-ruah-300 uppercase tracking-[0.3em]">Número do pedido</label>
                      <input
                        type="text"
                        placeholder="RH-00000"
                        value={orderId}
                        onChange={(event) => setOrderId(event.target.value)}
                        className="bg-ruah-50 border border-ruah-100 rounded-2xl py-6 px-8 text-xl font-serif italic outline-none focus:border-accent-gold transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-ruah-300 uppercase tracking-[0.3em]">CPF do titular</label>
                      <input
                        type="text"
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={(event) => setCpf(event.target.value)}
                        className="bg-ruah-50 border border-ruah-100 rounded-2xl py-6 px-8 text-xl font-serif italic outline-none focus:border-accent-gold transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => void handleLookup()}
                    disabled={loading || !orderId || !cpf}
                    className="w-full bg-ruah-950 text-white py-8 rounded-3xl font-bold uppercase text-[11px] tracking-[0.3em] hover:bg-accent-gold transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>Buscar pedido <ArrowRight size={16} /></>}
                  </button>

                  <div className="flex items-center gap-4 p-6 bg-ruah-50 rounded-2xl border border-dashed border-ruah-100">
                    <AlertCircle size={20} className="text-ruah-300 shrink-0" />
                    <p className="text-[9px] font-bold text-ruah-400 uppercase tracking-widest leading-relaxed">
                      Segurança de dados: só o titular da compra pode iniciar o fluxo de troca ou devolução.
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
                    <h3 className="text-2xl font-serif italic uppercase leading-none">Selecione os itens</h3>
                    <p className="text-[9px] font-bold text-ruah-400 uppercase tracking-widest">Pedido #{orderData.id}</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {orderData.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-6 p-6 bg-ruah-50 rounded-3xl border border-ruah-100 group cursor-pointer hover:border-accent-gold transition-all">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-sm shrink-0 bg-white">
                          <AppImage context="content-banner" src={item.image} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold uppercase tracking-tight text-ruah-950 mb-1">{item.name}</h4>
                          <p className="text-[9px] font-medium text-ruah-400 uppercase tracking-widest">{item.spec}</p>
                        </div>
                        <div className="w-6 h-6 rounded-full border-2 border-ruah-200 group-hover:border-accent-gold flex items-center justify-center transition-all">
                          <div className="w-2.5 h-2.5 rounded-full bg-accent-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep('lookup')} className="flex-1 bg-white border border-ruah-100 py-6 rounded-2xl font-bold uppercase text-[9px] tracking-[0.3em] hover:bg-ruah-50 transition-all">
                      Voltar
                    </button>
                    <button onClick={() => setStep('reason')} className="flex-[2] bg-ruah-950 text-white py-6 rounded-2xl font-bold uppercase text-[9px] tracking-[0.3em] hover:bg-accent-gold transition-all shadow-xl">
                      Continuar
                    </button>
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
                    <h3 className="text-2xl font-serif italic uppercase leading-none">Motivo da solicitação</h3>
                    <p className="text-[9px] font-bold text-ruah-400 uppercase tracking-widest leading-loose">
                      Seu retorno ajuda a refinar produto, modelagem e acabamento.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {RETURN_REASONS.map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setSelectedReason(reason)}
                        className={`p-6 text-left rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                          selectedReason === reason
                            ? 'border-accent-gold bg-accent-gold/5 text-accent-gold'
                            : 'border-ruah-100 text-ruah-400 hover:border-accent-gold hover:bg-accent-gold/5 hover:text-accent-gold'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setStep('confirmation')}
                    disabled={!selectedReason}
                    className="w-full bg-ruah-950 text-white py-8 rounded-3xl font-bold uppercase text-[11px] tracking-[0.3em] hover:bg-accent-gold transition-all shadow-xl disabled:opacity-50"
                  >
                    Confirmar solicitação
                  </button>
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
                    <h3 className="text-4xl font-serif italic uppercase leading-tight">
                      RETORNO
                      <br />
                      AGENDADO.
                    </h3>
                    <p className="text-xs font-bold text-ruah-400 uppercase tracking-widest leading-loose max-w-sm">
                      Seu pedido entrou no fluxo de análise. Assim que a peça chegar, o time valida e libera troca, crédito ou estorno.
                    </p>
                  </div>

                  <div className="w-full p-8 bg-ruah-50 rounded-[2.5rem] border border-ruah-100 flex flex-col gap-8">
                    <div className="flex justify-between items-center text-left gap-6">
                      <div>
                        <span className="text-[8px] font-bold text-ruah-300 uppercase block mb-1">Código de postagem</span>
                        <span className="text-2xl font-mono text-ruah-950 tracking-tighter">RH 990 023 11 BR</span>
                      </div>
                      <Package size={40} className="text-ruah-950 opacity-20 shrink-0" />
                    </div>
                    <div className="h-px bg-ruah-100" />
                    <div className="grid grid-cols-2 gap-6 text-left">
                      <div>
                        <span className="text-[8px] font-bold text-ruah-300 uppercase block mb-1">Expira em</span>
                        <span className="text-[10px] font-bold uppercase">7 dias úteis</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-ruah-300 uppercase block mb-1">Método</span>
                        <span className="text-[10px] font-bold uppercase">Postagem assistida</span>
                      </div>
                    </div>
                  </div>

                  <button className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-accent-gold border-b border-accent-gold/30 pb-2 hover:border-accent-gold transition-all">
                    <FileText size={16} /> Download da etiqueta
                  </button>

                  <Link href="/help-center" className="text-[9px] font-bold text-ruah-300 uppercase tracking-widest hover:text-ruah-950 transition-colors">
                    Voltar para central de ajuda
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-white border border-ruah-100 rounded-3xl flex items-start gap-4">
            <Package size={24} className="text-accent-gold shrink-0" />
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-ruah-950 mb-2">Envio protegido</h4>
              <p className="text-[9px] font-medium text-ruah-400 uppercase tracking-widest leading-relaxed">
                Se puder, use a mesma embalagem da peça. Isso reduz dano no retorno e acelera a conferência.
              </p>
            </div>
          </div>
          <div className="p-8 bg-white border border-ruah-100 rounded-3xl flex items-start gap-4">
            <ShieldCheck size={24} className="text-accent-gold shrink-0" />
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-ruah-950 mb-2">Análise de qualidade</h4>
              <p className="text-[9px] font-medium text-ruah-400 uppercase tracking-widest leading-relaxed">
                Depois do recebimento, a equipe valida estado, acabamento e elegibilidade antes de concluir o retorno.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
