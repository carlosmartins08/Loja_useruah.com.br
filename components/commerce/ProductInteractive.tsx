'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, ArrowRight, Zap, Heart, Ruler, ShoppingBag, Wallet, QrCode, CreditCard } from 'lucide-react';
import type { BrandPackagingOption } from '@/lib/brand-assets';
import { useCart } from '@/context/CartContext';
import { SmartShipping } from './SmartShipping';
import { useRouter } from 'next/navigation';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { composeCampaignPrice } from '@/lib/campaign-pricing';
import type { ShopCampaignContext } from '@/lib/shop-products';
import Link from 'next/link';

interface ProductInteractiveProps {
  id: string;
  name: string;
  price: number;
  basePrice: number;
  image: string;
  variantId: string;
  variantLabel: string;
  productionDays?: number;
  installmentCount?: number;
  sizeOptions?: string[];
  printOptions?: string[];
  packagingOptions?: BrandPackagingOption[];
  pricingPolicyMinPrice?: number;
  campaignContext?: ShopCampaignContext | null;
  selectedColor?: string;
  colorOptions?: string[];
  onColorChange?: (color: string) => void;
}

const COLOR_SWATCHES: Record<string, string> = {
  'Off White': 'bg-[#F5F5F0]',
  'Preto Ruah': 'bg-[#1A1A1A]',
  'Terra Cota': 'bg-[#A45C40]',
  Areia: 'bg-[#D8C2A8]',
  Branco: 'bg-[#FAFAFA]',
  Preto: 'bg-[#1A1A1A]',
};

export function ProductInteractive({
  id,
  name,
  price,
  basePrice,
  image,
  variantId,
  variantLabel,
  productionDays = 7,
  installmentCount = 3,
  sizeOptions = ['P', 'M', 'G', 'GG'],
  printOptions = ['Serigrafia'],
  packagingOptions = [{ name: 'Pack UseRuah', description: 'Proteção essencial com apresentação limpa.' }],
  pricingPolicyMinPrice,
  campaignContext,
  selectedColor,
  colorOptions,
  onColorChange,
}: ProductInteractiveProps) {
  const router = useRouter();
  const resolvedColorOptions = React.useMemo(() => (colorOptions?.length ? colorOptions : ['Padrão']), [colorOptions]);
  const [quantity, setQuantity] = React.useState(1);
  const [internalPrintType, setInternalPrintType] = React.useState<string | null>(null);
  const [internalColor, setInternalColor] = React.useState<string | null>(null);
  const [internalSize, setInternalSize] = React.useState<string | null>(null);
  const [internalPackaging, setInternalPackaging] = React.useState<string | null>(null);
  const [showSizeGuide, setShowSizeGuide] = React.useState(false);
  const [isReviewing, setIsReviewing] = React.useState(false);
  const reviewRef = React.useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const color = selectedColor ?? internalColor ?? resolvedColorOptions[0];
  const printType = internalPrintType && printOptions.includes(internalPrintType) ? internalPrintType : (printOptions[0] ?? 'Serigrafia');
  const size = internalSize && sizeOptions.includes(internalSize) ? internalSize : (sizeOptions[0] ?? 'Único');
  const packaging =
    internalPackaging && packagingOptions.some((option) => option.name === internalPackaging)
      ? internalPackaging
      : (packagingOptions[0]?.name ?? 'Pack UseRuah');
  const priceComposition = React.useMemo(
    () =>
      composeCampaignPrice({
        baseUnitPrice: basePrice,
        quantity,
        progressivePriceRule: campaignContext?.progressivePriceRule,
        minUnitPrice: pricingPolicyMinPrice,
      }),
    [basePrice, campaignContext?.progressivePriceRule, pricingPolicyMinPrice, quantity]
  );
  const unitPrice = priceComposition.effectiveUnitPrice;
  const installmentValue = unitPrice / installmentCount;
  const totalLinePrice = unitPrice * quantity;

  useFocusTrap({
    active: isReviewing,
    containerRef: reviewRef,
    onEscape: () => setIsReviewing(false),
  });

  const handleAddToCart = () => {
    addToCart({
      lineId: `${id}:${variantId}:${size} | ${color} | ${printType} | ${packaging}`,
      id,
      variantId,
      variantLabel,
      name,
      price: unitPrice,
      basePrice,
      image,
      quantity,
      spec: `${size} | ${color} | ${printType} | ${packaging}`,
      productionDays,
      pricingPolicyMinPrice,
      campaignId: campaignContext?.campaignId,
      campaignName: campaignContext?.campaignName,
      campaignProgressivePriceRule: campaignContext?.progressivePriceRule,
      organizationId: campaignContext?.organizationId,
      customSpecs: {
        supplierId: 'supplier-default',
        variantId,
        variantLabel,
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
               className="fixed inset-0 bg-ruah-950/80 backdrop-blur-md z-modal flex items-center justify-center p-6"
               onClick={() => setIsReviewing(false)}
            >
               <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  ref={reviewRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Revisão da seleção"
                  tabIndex={-1}
                  className="bg-white rounded-[3rem] w-full max-w-lg p-12 flex flex-col gap-8 shadow-2xl border border-ruah-100"
                  onClick={(event) => event.stopPropagation()}
               >
                  <div className="flex flex-col gap-2">
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent-gold" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-accent-gold font-bold">Revisão do pedido</h3>
                     </div>
                     <h2 className="text-4xl font-serif italic text-ruah-950">Confirmar seleção.</h2>
                  </div>

                  <div className="flex flex-col gap-6 bg-ruah-50 rounded-3xl p-8 border border-ruah-100 font-bold">
                     {[
                        { label: 'Peça', value: name },
                        { label: 'Tamanho', value: size },
                        { label: 'Cor', value: color },
                        { label: 'Estampa', value: printType },
                        { label: 'Embalagem', value: packaging },
                        { label: 'Quantidade', value: quantity },
                        { label: 'Valor unitário', value: `R$ ${unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
                        { label: 'Subtotal', value: `R$ ${totalLinePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
                     ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center pb-4 border-b border-ruah-100 last:border-0 last:pb-0">
                           <span className="text-xs font-bold text-ruah-300 uppercase tracking-[0.1em]">{item.label}</span>
                           <span className="text-xs font-bold text-ruah-950 uppercase tracking-tight">{item.value}</span>
                        </div>
                     ))}
                  </div>

                  <div className="p-6 bg-accent-gold/5 rounded-2xl border border-accent-gold/20 flex flex-col gap-2">
                     <p className="text-xs text-accent-gold font-bold uppercase tracking-[0.1em] leading-relaxed">
                        Ao confirmar, seu item segue para produção em até {productionDays} dias úteis. Depois da aprovação, alterações de arte, cor ou tamanho podem ficar indisponíveis.
                     </p>
                  </div>

                  <div className="flex flex-col gap-4">
                     <button type="button" onClick={handleAddToCart}
                       className="w-full bg-ruah-950 text-white py-6 rounded-2xl font-bold uppercase text-xs tracking-[0.1em] hover:bg-accent-gold transition-all"
                     >
                        Confirmar e adicionar ao carrinho
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
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold">Produção sob demanda</span>
            </div>
          </div>
          <span className="text-5xl font-serif text-ruah-950 tracking-tighter">R$ {unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          <div className="flex items-center gap-3">
             {priceComposition.perUnitDelta > 0 ? (
               <>
                 <span className="text-xs text-ruah-300 line-through font-bold tracking-[0.1em] uppercase">
                   DE R$ {basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </span>
                 <span className="bg-ruah-50 text-ruah-950 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-[0.1em]">
                   {priceComposition.tierLabel}
                 </span>
               </>
             ) : (
               <>
                 <span className="text-xs text-ruah-300 line-through font-bold tracking-[0.1em] uppercase">DE R$ {(price * 1.4).toFixed(2)}</span>
                 <span className="bg-ruah-50 text-ruah-950 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-[0.1em]">Oferta atual</span>
               </>
             )}
          </div>
          <p className="text-sm font-medium text-ruah-500 mt-2">
            ou {installmentCount}x de R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          {campaignContext ? (
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold">
              {priceComposition.perUnitDelta > 0
                ? `Campanha ${campaignContext.campaignName}: economia de R$ ${priceComposition.totalDelta.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })} nesta seleção.`
                : `Campanha ${campaignContext.campaignName}: a regra ${campaignContext.progressivePriceRule} passa a valer conforme a quantidade.`}
            </p>
          ) : null}
       </div>

       <div className="bg-ruah-950 text-white p-6 rounded-3xl flex flex-col gap-4 shadow-xl">
          <div className="flex justify-between items-center">
             <span className="text-xs font-bold uppercase tracking-[0.1em] text-white/40 italic">Prazo estimado</span>
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
             <span className="text-white/40">Entrega (2d)</span>
          </div>
       </div>

       <div className="flex flex-col gap-8">
          {/* Color Selection */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-400 mb-4">Cores disponíveis</h3>
            <div className="flex gap-3">
               {resolvedColorOptions.map((option) => (
                 <button type="button" key={option}
                  onClick={() => {
                    if (onColorChange) {
                      onColorChange(option);
                      return;
                    }
                    setInternalColor(option);
                  }}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                    color === option
                    ? 'bg-ruah-950 text-white border-ruah-950 shadow-lg' 
                    : 'bg-white text-ruah-950 border-ruah-100 hover:border-accent-gold'
                  }`}
                 >
                   <div className={`w-3 h-3 rounded-full ${COLOR_SWATCHES[option] ?? 'bg-neutral-300'} border border-black/10`} />
                   <span className="text-xs font-semibold tracking-[0.08em] uppercase">{option}</span>
                 </button>
               ))}
            </div>
          </div>

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
               {sizeOptions.map((s) => (
                 <button type="button" key={s}
                   onClick={() => setInternalSize(s)}
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

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-400 mb-4">Técnica de Estamparia</h3>
             <div className="flex flex-wrap gap-3">
                {printOptions.map((p) => (
                  <button type="button" key={p}
                   onClick={() => setInternalPrintType(p)}
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

          <div>
             <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-400 mb-4">Embalagem</h3>
             <div className="flex gap-4">
                {packagingOptions.map((option) => (
                  <button type="button" key={option.name}
                   onClick={() => setInternalPackaging(option.name)}
                   className={`flex-1 p-5 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${
                     packaging === option.name
                     ? 'border-accent-gold bg-accent-gold/5' 
                     : 'border-ruah-50 bg-ruah-50/30 hover:border-ruah-100'
                   }`}
                  >
                    <span className={`text-xs font-bold uppercase tracking-[0.1em] ${packaging === option.name ? 'text-accent-gold' : 'text-ruah-950'}`}>{option.name}</span>
                    <span className="text-xs font-medium text-ruah-500">{option.description}</span>
                  </button>
                ))}
             </div>
          </div>
       </div>

       <div className="flex flex-col gap-4">
          <div className="p-6 border border-dashed border-ruah-200 rounded-3xl bg-ruah-50/30">
             <p className="text-sm font-medium text-ruah-500 leading-relaxed">
                <span className="text-ruah-950">Produção do pedido</span>: seu item é preparado sob demanda. O prazo de {productionDays} dias úteis cobre produção, acabamento e conferência.
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
             ADICIONAR AO CARRINHO 
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

          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
             <span className="inline-flex items-center gap-2 rounded-full border border-ruah-100 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-400">
               <CreditCard size={12} className="text-accent-gold" />
               Visa
             </span>
             <span className="inline-flex items-center gap-2 rounded-full border border-ruah-100 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-400">
               <CreditCard size={12} className="text-accent-gold" />
               Mastercard
             </span>
             <span className="inline-flex items-center gap-2 rounded-full border border-ruah-100 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-400">
               <QrCode size={12} className="text-accent-gold" />
               Pix
             </span>
          </div>
       </div>
    </div>
  );
}

export function WhatsAppSticky() {
  return (
    <div className="fixed bottom-24 md:bottom-10 right-6 md:right-10 z-sticky">
       <Link
        href="/help-center"
        className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95 group"
       >
         <Zap size={24} className="fill-current" />
         <div className="absolute right-full mr-4 bg-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.1em] text-ruah-950 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-ruah-100">
           Central de Ajuda
         </div>
       </Link>
    </div>
  );
}






