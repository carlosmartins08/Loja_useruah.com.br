'use client';

import React from 'react';
import { Header } from '@/components/navigation/Header';
import { Trash2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { AppImage } from '@/components/shared/AppImage';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { cart, subtotal, total, discount, updateQuantity, removeFromCart, location } = useCart();
  const [updatingItemId, setUpdatingItemId] = React.useState<string | null>(null);
  const [cartError, setCartError] = React.useState<string | null>(null);

  const shippingFee = total >= 200 ? 0 : 24.9;
  const grandTotal = total + shippingFee;

  const handleQuantityChange = (id: string, nextQuantity: number) => {
    if (nextQuantity < 1) return;
    setCartError(null);
    setUpdatingItemId(id);
    try {
      updateQuantity(id, nextQuantity);
    } catch (_error) {
      setCartError('Nao foi possivel atualizar a quantidade. Tente novamente.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemove = (id: string) => {
    setCartError(null);
    setUpdatingItemId(id);
    try {
      removeFromCart(id);
    } catch (_error) {
      setCartError('Nao foi possivel remover o item. Tente novamente.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <main className="bg-ruah-50 min-h-screen pb-32 font-sans page-header-offset">
      <Header />

      <div className="pt-8 pb-16">
        <div className="section-container">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-gold">Seu Respiro</span>
            <div className="w-1 h-1 rounded-full bg-ruah-200" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-ruah-400">Selecao de Arte</span>
          </div>
          <h1 className="text-5xl font-serif font-black tracking-tighter text-ruah-950 uppercase italic">
            Carrinho de <span className="text-accent-gold">Compras.</span>
          </h1>
        </div>
      </div>

      <section className="section-container grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8 space-y-8">
          {cart.length === 0 ? (
            <div className="bg-white p-10 rounded-[2.5rem] border border-ruah-100 flex flex-col gap-6 items-start">
              <h2 className="text-2xl font-serif italic uppercase text-ruah-950">Seu carrinho esta vazio.</h2>
              <p className="text-sm font-medium text-ruah-500 max-w-xl">
                Adicione produtos para iniciar a compra e acompanhar o pedido pela sua conta.
              </p>
              <Link href="/shop" className="inline-flex items-center gap-2 bg-ruah-950 text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-[0.16em] hover:bg-accent-gold transition-colors">
                Voltar para a colecao <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <>
              {cart.map((item, index) => (
                <div key={item.lineId || `${item.id}-${item.spec ?? index}`} className="flex gap-8 pb-8 border-b border-ruah-100 group bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all">
                  <div className="relative w-32 aspect-square bg-ruah-50 rounded-2xl overflow-hidden shrink-0 border border-ruah-100 group-hover:border-accent-gold transition-colors">
                    <AppImage
                      context="content-banner"
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-2">
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <h3 className="font-black text-xl text-ruah-950 uppercase tracking-tight">{item.name}</h3>
                        <span className="font-mono font-bold text-accent-gold">
                          R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex gap-4 text-[10px] uppercase font-black text-ruah-400 tracking-widest flex-wrap">
                        <span>{item.category ?? 'Colecao Ruah'}</span>
                        {item.spec ? (
                          <>
                            <span className="text-accent-gold">•</span>
                            <span>{item.spec}</span>
                          </>
                        ) : null}
                        {item.productionDays ? (
                          <>
                            <span className="text-accent-gold">•</span>
                            <span>{item.productionDays} dias uteis</span>
                          </>
                        ) : null}
                        {item.campaignName ? (
                          <>
                            <span className="text-accent-gold">•</span>
                            <span>{item.campaignName}</span>
                          </>
                        ) : null}
                      </div>
                      {item.movementMarkup ? (
                        <p className="mt-3 text-[10px] uppercase font-black tracking-widest text-accent-gold">
                          Campanha aplicada: -R$ {item.movementMarkup.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between mt-8">
                      <div className="flex items-center border border-ruah-100 rounded-xl p-2 gap-6 bg-ruah-50/60">
                        <button
                          type="button"
                          disabled={updatingItemId === item.lineId}
                          onClick={() => handleQuantityChange(item.lineId, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-ruah-400 hover:text-accent-gold hover:bg-white transition-all disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-black text-ruah-950">{item.quantity}</span>
                        <button
                          type="button"
                          disabled={updatingItemId === item.lineId}
                          onClick={() => handleQuantityChange(item.lineId, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-ruah-400 hover:text-accent-gold hover:bg-white transition-all disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={updatingItemId === item.lineId}
                        onClick={() => handleRemove(item.lineId)}
                        className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-ruah-300 hover:text-red-500 transition-colors py-2 px-4 hover:bg-red-50 rounded-xl disabled:opacity-50"
                      >
                        <Trash2 size={14} /> Remover Arte
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="bg-ruah-950 text-white p-8 flex items-start gap-6 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-full bg-accent-gold/10 blur-3xl" />
            <AlertCircle className="text-accent-gold shrink-0 mt-1" size={24} />
            <div className="relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-gold mb-2">Compromisso Ruah</h4>
              <p className="text-xs text-ruah-400 font-medium uppercase tracking-widest leading-loose">
                Este item pode ser produzido sob demanda após a confirmação do pagamento.
                O prazo cobre produção, acabamento e separação para envio.
              </p>
            </div>
          </div>

          {cartError && <p role="alert" className="text-sm font-semibold text-red-600">{cartError}</p>}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white p-10 rounded-[3rem] sticky top-32 border border-ruah-100 shadow-fancy">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-ruah-300 mb-10 pb-4 border-b border-ruah-50">Resumo do pedido</h2>

            <div className="space-y-4 mb-10">
              <div className="flex justify-between text-xs uppercase font-bold tracking-widest">
                <span className="text-ruah-500">Subtotal</span>
                <span className="font-mono font-bold text-ruah-950">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs uppercase font-bold tracking-widest">
                <span className="text-ruah-500">Frete</span>
                <span className={`font-mono font-bold uppercase tracking-[0.2em] ${shippingFee === 0 ? 'text-green-600' : 'text-ruah-950'}`}>
                  {shippingFee === 0 ? 'Grátis' : `R$ ${shippingFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
              <div className="flex justify-between text-xs uppercase font-bold tracking-widest">
                <span className="text-ruah-500">Descontos</span>
                <span className="font-mono font-bold text-ruah-950">{discount > 0 ? `- R$ ${discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-12 pt-8 border-t border-ruah-50">
              <span className="font-black text-sm uppercase tracking-widest text-ruah-950">Total Final</span>
              <div className="text-right">
                <div className="text-4xl font-serif italic font-black text-accent-gold">R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="text-[9px] text-ruah-400 font-bold uppercase tracking-[0.2em] mt-2">
                  Ate 10x de R$ {(grandTotal / 10).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <Link href="/checkout" aria-disabled={cart.length === 0} className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-ruah-950/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] group ${cart.length === 0 ? 'bg-ruah-200 text-ruah-400 pointer-events-none' : 'bg-ruah-950 text-white hover:bg-accent-gold'}`}>
              Ir para checkout <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
            </Link>

            <div className="mt-10 pt-10 border-t border-ruah-50">
              <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-ruah-400">
                <ShieldCheck size={16} className="text-green-500" /> Compra protegida
              </div>
              <div className="mt-3 text-[9px] font-bold uppercase tracking-[0.12em] text-ruah-400">
                Entrega estimada: {location.region} + {location.shippingDays}d uteis
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
