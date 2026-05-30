'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, ArrowRight, Zap, Star, Heart, Ruler, ShoppingBag, Wallet, QrCode } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { AppImage } from '@/components/shared/AppImage';
import { SmartShipping } from './SmartShipping';
import { useRouter } from 'next/navigation';

interface ProductInteractiveProps {
  id: string;
  name: string;
  price: number;
  image: string;
  productionDays?: number;
  installmentCount?: number;
  onColorChange?: (color: string) => void;
}

export function ProductInteractive({
  id,
  name,
  price,
  image,
  productionDays = 7,
  installmentCount = 3,
  onColorChange,
}: ProductInteractiveProps) {
  const router = useRouter();
  const [quantity, setQuantity] = React.useState(1);
  const [printType, setPrintType] = React.useState('Serigrafia');
  const [color, setColor] = React.useState('Off White');
  const [size, setSize] = React.useState('M');
  const [supplierId, setSupplierId] = React.useState('supplier-default');
  const [packaging, setPackaging] = React.useState('Pack Respiro');
  const [showSizeGuide, setShowSizeGuide] = React.useState(false);
  const [isReviewing, setIsReviewing] = React.useState(false);
  const { addToCart } = useCart();
  const installmentValue = price / installmentCount;

  const handleAddToCart = () => {
    addToCart({
      id,
      name,
      price,
      image,
      quantity,
      spec: `${size} | ${color} | ${printType} | ${packaging}`,
      productionDays,
      customSpecs: {
        supplierId,
        size,
        color,
        printType,
        packaging
      }
    });
    setIsReviewing(false);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  const handleInstantCheckout = (method: 'pix' | 'wallet') => {
    handleAddToCart();
    router.push(`/checkout?instant=${method}`);
  };

  return (
    <div className="lg:col-span-3 flex flex-col gap-10">
       <AnimatePresence>
          {isReviewing && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-ruah-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6"
            >
               <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-white rounded-[3rem] w-full max-w-lg p-12 flex flex-col gap-8 shadow-2xl border border-ruah-100"
               >
                  <div className="flex flex-col gap-2">
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent-gold" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-accent-gold font-bold">Revisão do Sopro Criativo</h3>
                     </div>
                     <h2 className="text-4xl font-serif italic text-ruah-950">Validar Customização.</h2>
                  </div>

                  <div className="flex flex-col gap-6 bg-ruah-50 rounded-3xl p-8 border border-ruah-100 font-bold">
                     {[
                        { label: 'Peça', value: name },
                        { label: 'Tamanho', value: size },
                        { label: 'Cor da Fé', value: color },
                        { label: 'Estamparia', value: printType },
                        { label: 'Experiência', value: packaging },
                        { label: 'Quantidade', value: quantity }
                     ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center pb-4 border-b border-ruah-100 last:border-0 last:pb-0">
                           <span className="text-xs font-bold text-ruah-300 uppercase tracking-[0.1em]">{item.label}</span>
                           <span className="text-xs font-bold text-ruah-950 uppercase tracking-tight">{item.value}</span>
                        </div>
                     ))}
                  </div>

                  <div className="p-6 bg-accent-gold/5 rounded-2xl border border-accent-gold/20 flex flex-col gap-2">
                     <p className="text-xs text-accent-gold font-bold uppercase tracking-[0.1em] leading-relaxed">
                        Ao confirmar, sua peça entra no <span className="underline">KPI de Produção de {productionDays} dias</span>. Não será possível alterar arte ou tamanho após o início do tear.
                     </p>
                  </div>

                  <div className="flex flex-col gap-4">
                     <button type="button" onClick={handleAddToCart}
                       className="w-full bg-ruah-950 text-white py-6 rounded-2xl font-bold uppercase text-xs tracking-[0.1em] hover:bg-accent-gold transition-all"
                     >
                        Confirmar e Soprar para o Carrinho
                     </button>
                     <button type="button" onClick={() => setIsReviewing(false)}
                       className="w-full text-ruah-300 py-2 font-bold uppercase text-xs tracking-[0.2em] hover:text-ruah-950 transition-all font-bold"
                     >
                        Ajustar Detalhes
                     </button>
                  </div>
               </motion.div>
            </motion.div>
          )}
       </AnimatePresence>

       <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-gold pulse-soft" />
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold">Produção Artesanal Sob Demanda</span>
            </div>
          </div>
          <span className="text-5xl font-serif text-ruah-950 tracking-tighter">R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          <div className="flex items-center gap-3">
             <span className="text-xs text-ruah-300 line-through font-bold tracking-[0.1em] uppercase">DE R$ {(price * 1.4).toFixed(2)}</span>
             <span className="bg-ruah-50 text-ruah-950 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-[0.1em]">Valor do Artista</span>
          </div>
          <p className="text-sm font-medium text-ruah-500 mt-2">
            ou {installmentCount}x de R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
       </div>

       {/* Production Timeline Display (BPMN Visualization) */}
       <div className="bg-ruah-950 text-white p-6 rounded-3xl flex flex-col gap-4 shadow-xl">
          <div className="flex justify-between items-center">
             <span className="text-xs font-bold uppercase tracking-[0.1em] text-white/40 italic">Prazo de Criação & Sopro</span>
             <div className="flex items-center gap-2">
                <span className="text-lg font-serif italic">{productionDays}</span>
                <span className="text-xs font-bold uppercase text-white/40">Dias Úteis</span>
             </div>
          </div>
          <div className="flex gap-1 h-1.5">
             <div className="flex-[3] bg-accent-gold rounded-full" />
             <div className="flex-[1] bg-white/20 rounded-full" />
             <div className="flex-[1] bg-white/10 rounded-full" />
          </div>
          <div className="flex justify-between text-xs font-bold uppercase tracking-[0.1em]">
             <span className="text-accent-gold">Produção ({productionDays}d)</span>
             <span className="text-white/40">Logística (2d)</span>
          </div>
       </div>

       <div className="flex flex-col gap-8">
          {/* Color Selection */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-400 mb-4">Paleta de Fé (Cores)</h3>
            <div className="flex gap-3">
               {[
                 { name: 'Off White', bg: 'bg-[#F5F5F0]' },
                 { name: 'Preto Ruah', bg: 'bg-[#1A1A1A]' },
                 { name: 'Terra Cota', bg: 'bg-[#A45C40]' }
               ].map(c => (
                 <button type="button" key={c.name}
                  onClick={() => {
                    setColor(c.name);
                    onColorChange?.(c.name);
                  }}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                    color === c.name 
                    ? 'bg-ruah-950 text-white border-ruah-950 shadow-lg' 
                    : 'bg-white text-ruah-950 border-ruah-100 hover:border-accent-gold'
                  }`}
                 >
                   <div className={`w-3 h-3 rounded-full ${c.bg} border border-black/10`} />
                   <span className="text-xs font-semibold tracking-[0.08em] uppercase">{c.name}</span>
                 </button>
               ))}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-400">Tamanhos Disponíveis</h3>
              <button type="button" onClick={() => setShowSizeGuide(true)}
                className="flex items-center gap-2 text-xs font-bold text-accent-gold uppercase tracking-[0.1em] group"
              >
                <Ruler size={14} />
                <span className="border-b border-accent-gold/30 group-hover:border-accent-gold transition-all">Guia de Medidas</span>
              </button>
            </div>
            <div className="flex gap-3">
               {['P', 'M', 'G', 'GG', 'XG'].map(s => (
                 <button type="button" key={s}
                  onClick={() => setSize(s)}
                  className={`w-12 h-12 rounded-xl text-xs font-bold tracking-[0.1em] transition-all border flex items-center justify-center ${
                    size === s 
                    ? 'bg-ruah-950 text-white border-ruah-950' 
                    : 'bg-white text-ruah-400 border-ruah-100 hover:border-accent-gold hover:text-accent-gold'
                  }`}
                 >
                   {s}
                 </button>
               ))}
            </div>
          </div>

          {/* Print Technique */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-400 mb-4">Fornecedor</h3>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'supplier-default', label: 'Parceiro Base' },
                { id: 'supplier-premium', label: 'Atelie Premium' },
              ].map((supplier) => (
                <button
                  type="button"
                  key={supplier.id}
                  onClick={() => setSupplierId(supplier.id)}
                  className={`px-6 py-3 rounded-xl text-xs font-bold tracking-[0.1em] transition-all border ${
                    supplierId === supplier.id
                      ? 'bg-ruah-950 text-white border-ruah-950 shadow-md'
                      : 'bg-white text-ruah-400 border-ruah-100 hover:border-accent-gold hover:text-accent-gold'
                  }`}
                >
                  {supplier.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-400 mb-4">Técnica de Estamparia</h3>
             <div className="flex flex-wrap gap-3">
                {['Serigrafia', 'Bordado', 'Digital DTG'].map(p => (
                  <button type="button" key={p}
                   onClick={() => setPrintType(p)}
                   className={`px-6 py-3 rounded-xl text-xs font-bold tracking-[0.1em] transition-all border ${
                     printType === p 
                     ? 'bg-ruah-950 text-white border-ruah-950 shadow-md' 
                     : 'bg-white text-ruah-400 border-ruah-100 hover:border-accent-gold hover:text-accent-gold'
                   }`}
                  >
                    {p}
                  </button>
                ))}
             </div>
          </div>

          {/* Packaging Selection (T.1.2.a critical) */}
          <div>
             <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-400 mb-4">Experiência de Recebimento (Embalagem)</h3>
             <div className="flex gap-4">
                {['Pack Respiro', 'Gift Experience'].map(pkg => (
                  <button type="button" key={pkg}
                   onClick={() => setPackaging(pkg)}
                   className={`flex-1 p-5 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${
                     packaging === pkg 
                     ? 'border-accent-gold bg-accent-gold/5' 
                     : 'border-ruah-50 bg-ruah-50/30 hover:border-ruah-100'
                   }`}
                  >
                    <span className={`text-xs font-bold uppercase tracking-[0.1em] ${packaging === pkg ? 'text-accent-gold' : 'text-ruah-950'}`}>{pkg}</span>
                    <span className="text-xs font-medium text-ruah-500">
                      {pkg === 'Pack Respiro' ? 'Minimalismo e proteção essencial' : 'Unboxing premium com cartão autoral'}
                    </span>
                  </button>
                ))}
             </div>
          </div>
       </div>

       <div className="flex flex-col gap-4">
          <div className="p-6 border border-dashed border-ruah-200 rounded-3xl bg-ruah-50/30">
             <p className="text-sm font-medium text-ruah-500 leading-relaxed">
                <span className="text-ruah-950">MANIFESTO DE PRODUÇÃO</span>: Seu pedido será soprado por mãos humanas. O prazo de {productionDays} dias garante a cura da estampa e a perfeição do acabamento.
             </p>
          </div>
          <div className="flex items-center gap-4 bg-ruah-50 rounded-2xl p-2 px-4 self-start">
             <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-ruah-950"><Minus size={14} /></button>
             <span className="font-mono font-bold w-4 text-center text-ruah-950">{quantity}</span>
             <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-ruah-950"><Plus size={14} /></button>
          </div>
          <button type="button" onClick={() => setIsReviewing(true)}
            className="w-full bg-ruah-950 text-white py-6 rounded-2xl font-bold uppercase text-[11px] tracking-[0.1em] hover:bg-accent-gold transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3 group"
          >
             CONFIRMAR E SOPRAR 
             <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button type="button" id="buy-now"
            onClick={handleBuyNow}
            className="w-full bg-white border border-ruah-100 py-6 rounded-2xl font-bold uppercase text-[11px] tracking-[0.1em] hover:border-accent-gold transition-all active:scale-[0.98] text-ruah-950 flex items-center justify-center gap-3"
          >
             <ShoppingBag size={18} className="text-accent-gold" />
             Comprar Agora
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button type="button" onClick={() => handleInstantCheckout('pix')}
              className="w-full bg-accent-gold text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-[0.2em] hover:brightness-105 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <QrCode size={16} />
              1 Clique Pix
            </button>
            <button type="button" onClick={() => handleInstantCheckout('wallet')}
              className="w-full bg-ruah-950 text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-[0.2em] hover:bg-ruah-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Wallet size={16} />
              1 Clique Carteira
            </button>
          </div>

          <SmartShipping />

          <div className="flex items-center justify-center gap-6 mt-4 opacity-50">
             <AppImage context="content-banner" src="https://picsum.photos/seed/visa/100/40" alt="Visa" width={30} height={15} className="grayscale" />
             <AppImage context="content-banner" src="https://picsum.photos/seed/master/100/40" alt="Master" width={30} height={15} className="grayscale" />
             <AppImage context="content-banner" src="https://picsum.photos/seed/pix/100/40" alt="Pix" width={30} height={15} className="grayscale" />
          </div>
       </div>
    </div>
  );
}

export function WhatsAppSticky() {
  return (
    <div className="fixed bottom-24 md:bottom-10 right-6 md:right-10 z-[40]">
       <a 
        href="https://wa.me/5511999999999" 
        target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95 group"
       >
         <Zap size={24} className="fill-current" />
         <div className="absolute right-full mr-4 bg-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.1em] text-ruah-950 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-ruah-100">
           Atendimento Consultivo
         </div>
       </a>
    </div>
  );
}






