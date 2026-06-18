'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { AppImage } from '@/components/shared/AppImage';
import Link from 'next/link';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { BRAND_PRODUCT_SEEDS } from '@/lib/brand-assets';

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cart, removeFromCart, updateQuantity, total, subtotal, discount, location } = useCart();
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const freeShippingThreshold = 3000;
  const progress = Math.min((total / freeShippingThreshold) * 100, 100);
  const cartUpsellItems = [
    {
      id: BRAND_PRODUCT_SEEDS[4].id,
      name: BRAND_PRODUCT_SEEDS[4].name,
      price: BRAND_PRODUCT_SEEDS[4].price,
      image: BRAND_PRODUCT_SEEDS[4].image,
    },
    {
      id: BRAND_PRODUCT_SEEDS[5].id,
      name: BRAND_PRODUCT_SEEDS[5].name,
      price: BRAND_PRODUCT_SEEDS[5].price,
      image: BRAND_PRODUCT_SEEDS[5].image,
    },
  ];

  useFocusTrap({
    active: isCartOpen,
    containerRef: drawerRef,
    onEscape: () => setIsCartOpen(false),
  });

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-ruah-950/40 backdrop-blur-sm z-overlay"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            role="dialog"
            aria-modal="true"
            aria-label="Carrinho de compras"
            ref={drawerRef}
            tabIndex={-1}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-drawer flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-ruah-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-accent-gold" />
                <h2 className="text-lg font-serif italic uppercase tracking-tighter">Seu Carrinho</h2>
                <span className="bg-ruah-50 text-ruah-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {cart.length} peças
                </span>
              </div>
              <button type="button" onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-ruah-50 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Free Shipping Progress */}
            <div className="px-8 py-6 bg-ruah-50/50 border-b border-ruah-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                   <Truck size={12} className={total >= 3000 ? 'text-green-500' : 'text-accent-gold'} />
                   <span className="text-xs font-bold uppercase tracking-[0.1em] text-ruah-400">
                     {total >= 3000 ? 'Frete Grátis Liberado!' : `Faltam R$ ${(3000 - total).toLocaleString('pt-BR')} para frete grátis`}
                   </span>
                </div>
                <span className="text-xs font-mono font-bold text-ruah-300">{Math.round(Math.min((total/3000)*100, 100))}%</span>
              </div>
              <div className="h-1 w-full bg-ruah-100 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min((total/3000)*100, 100)}%` }}
                   className={`h-full transition-all duration-500 ${total >= 3000 ? 'bg-green-500' : 'bg-accent-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]'}`}
                />
              </div>
              <p className="text-xs text-ruah-300 uppercase tracking-[0.1em] mt-3 flex items-center gap-2 italic">
                 <span className="w-1 h-1 bg-ruah-300 rounded-full" />
                 Handover Logístico: {location.region} (+{location.shippingDays}d úteis)
              </p>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-8 space-y-12">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <ShoppingBag size={48} className="mb-4" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">Seu carrinho está vazio</p>
                  <button type="button" onClick={() => setIsCartOpen(false)}
                    className="mt-6 text-xs font-bold border-b border-ruah-950 pb-1"
                  >
                    Continuar Explorando
                  </button>
                </div>
              ) : (
                <>
                <div className="space-y-8">
                  {cart.map((item, idx) => (
                    <div key={item.lineId || `${item.id}-${idx}`} className="flex gap-6 group">
                      <div className="relative w-24 h-32 rounded-2xl overflow-hidden bg-ruah-50 border border-ruah-100 shadow-sm">
                        <AppImage context="content-banner" src={item.image} alt={item.name} fill className="object-cover" />
                        {item.productionDays && (
                          <div className="absolute top-2 left-2 bg-accent-gold text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-[0.1em]">
                             Bespoke
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1 py-1">
                        <div className="flex justify-between items-start mb-1 text-ruah-950 font-bold">
                          <h3 className="text-xs font-bold uppercase tracking-tight text-ruah-950 group-hover:text-accent-gold transition-colors">
                            {item.name}
                          </h3>
                          <button type="button" onClick={() => removeFromCart(item.lineId)}
                            className="text-ruah-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex flex-col gap-0.5 mb-4">
                           <span className="text-xs font-bold text-ruah-400 uppercase tracking-[0.1em]">
                             Sku: RH-{item.id.padStart(4, '0')} | {item.category || 'Ruah'}
                           </span>
                           {item.spec && (
                             <span className="text-xs font-bold text-accent-gold uppercase tracking-[0.1em] flex items-center gap-1">
                                <span className="w-1 h-1 bg-accent-gold rounded-full" />
                                Customização: {item.spec}
                             </span>
                           )}
                           {item.productionDays && (
                             <span className="text-xs font-bold text-ruah-400 uppercase tracking-[0.1em] italic">
                                Sopro Criativo: {item.productionDays} dias úteis
                             </span>
                           )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-4 bg-ruah-50 rounded-full px-3 py-1">
                            <button type="button" onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                              className="text-ruah-400 hover:text-ruah-950"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-mono font-bold w-4 text-center">{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                              className="text-ruah-400 hover:text-ruah-950"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-xs font-bold text-ruah-950 font-mono">
                            R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {item.movementMarkup ? (
                          <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-accent-gold">
                            Campanha ativa: -R$ {item.movementMarkup.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upselling Section */}
                <div className="pt-12 border-t border-ruah-50">
                   <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-ruah-300 mb-6 font-bold">Complete sua Experiência</h4>
                   <div className="grid grid-cols-1 gap-4">
                      {cartUpsellItems.map((acc) => (
                        <div key={acc.id} className="flex items-center gap-4 p-4 bg-ruah-50 rounded-2xl border border-ruah-100 group cursor-pointer hover:border-accent-gold/30 transition-all font-bold">
                           <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white shrink-0">
                              <AppImage context="content-banner" src={acc.image} alt={acc.name} fill className="object-cover" />
                           </div>
                           <div className="flex-1 flex flex-col gap-0.5">
                              <span className="text-xs font-bold uppercase tracking-tight text-ruah-950">{acc.name}</span>
                              <span className="text-xs font-mono text-accent-gold">R$ {acc.price.toLocaleString('pt-BR')}</span>
                           </div>
                           <button type="button" className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-ruah-400 hover:bg-accent-gold hover:text-white transition-all">
                              <Plus size={14} />
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
                </>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-8 bg-white border-t border-ruah-100 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col gap-4 mb-8">
                  <div className="flex justify-between items-center opacity-40 text-ruah-950 font-bold">
                    <span className="text-xs font-bold uppercase tracking-[0.1em]">Subtotal</span>
                    <span className="text-sm font-mono tracking-tighter">
                      R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-green-600 font-bold">
                      <span className="text-xs font-bold uppercase tracking-[0.1em]">PROGRESSIVE VOL (OFF)</span>
                      <span className="text-sm font-mono tracking-tighter">
                        - R$ {discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-4 border-t border-ruah-50 text-ruah-950 font-bold">
                    <span className="text-xs font-bold uppercase tracking-[0.1em] text-ruah-400">Total do Investimento</span>
                    <span className="text-2xl font-serif italic tracking-tighter text-ruah-950">
                      R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Link 
                    href="/checkout"
                    onClick={() => setIsCartOpen(false)}
                    className="w-full bg-ruah-950 text-white py-5 rounded-2xl font-bold uppercase text-xs tracking-[0.1em] hover:bg-accent-gold transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-xl shadow-ruah-950/10"
                  >
                    Confirmar Handover <ArrowRight size={16} />
                  </Link>
                  <button type="button" onClick={() => setIsCartOpen(false)}
                    className="w-full bg-white border border-ruah-100 py-4 rounded-xl font-bold uppercase text-xs tracking-[0.2em] text-ruah-400 hover:text-ruah-950 hover:border-ruah-200 transition-all font-bold"
                  >
                    Olhar Outras Peças
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}



