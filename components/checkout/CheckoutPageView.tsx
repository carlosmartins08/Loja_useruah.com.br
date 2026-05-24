'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { CheckoutHeader } from '@/components/checkout/sections/CheckoutHeader';
import { CheckoutOrderSummary } from '@/components/checkout/sections/CheckoutOrderSummary';
import { CheckoutStepOneSection } from '@/components/checkout/sections/CheckoutStepOneSection';
import { CheckoutStepTwoSection } from '@/components/checkout/sections/CheckoutStepTwoSection';
import { CheckoutSuccessCard } from '@/components/checkout/sections/CheckoutSuccessCard';
import type { PaymentMethod, PaymentRecord } from '@/lib/payments';
import type { OrderRecord } from '@/lib/order-store';
import { HttpRequestError, postJson } from '@/lib/http-client';
import { useUser } from '@/context/UserContext';
import { renderContentMessage } from '@/lib/content-messages';

export function CheckoutPageView() {
  const { cart, total, subtotal, location, gifting, setGifting, clearCart } = useCart();
  const [step, setStep] = React.useState(1);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [selectedAddress, setSelectedAddress] = React.useState('home');
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);
  const [paymentSummary, setPaymentSummary] = React.useState<PaymentRecord | null>(null);
  const requestKeyRef = React.useRef<string | null>(null);
  const { isAuthenticated } = useUser();
  const t = (id: string, vars?: Record<string, string | number>) => renderContentMessage(id, vars);

  if (cart.length === 0 && !isProcessing && step !== 3) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-serif mb-8 text-ruah-950">Seu carrinho está vazio.</h1>
        <Link href="/shop" className="bg-ruah-950 text-white px-12 py-5 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-accent-gold transition-all">
          Voltar para a Coleção
        </Link>
      </div>
    );
  }

  const maxProductionDays = cart.reduce((max, item) => Math.max(max, item.productionDays || 7), 0);
  const composedDeadline = maxProductionDays + location.shippingDays;
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + composedDeadline);

  const handleFinish = async (method: PaymentMethod, provider: PaymentRecord['provider']) => {
    if (!isAuthenticated) {
      setCheckoutError(t('checkout_session_expired')?.body ?? 'Sua sessão expirou. Faça login novamente para concluir o pagamento.');
      window.location.href = '/login';
      return;
    }

    setIsProcessing(true);
    setCheckoutError(null);
    if (!requestKeyRef.current) requestKeyRef.current = crypto.randomUUID();

    try {
      const orderPayload = await postJson<{ order: OrderRecord }>('/api/orders', {
          customer: { id: 'customer-session' },
          items: cart.map((item) => ({
            catalogItemId: item.id,
            variantId: item.spec || 'default',
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        }
      );

      const payload = await postJson<{ payment: PaymentRecord }>(
        '/api/payments/checkout',
        {
          orderId: orderPayload.order.orderId,
          method,
          provider,
          amount: total,
          currency: 'BRL',
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            spec: item.spec,
          })),
        },
        { headers: { 'x-idempotency-key': requestKeyRef.current ?? '' } }
      );

      setPaymentSummary(payload.payment);
      clearCart();
      setStep(3);
      requestKeyRef.current = null;
    } catch (error) {
      console.error(error);
      if (error instanceof HttpRequestError) {
        if (error.status === 401 || error.status === 403) {
          setCheckoutError(t('checkout_session_expired')?.body ?? 'Sua sessão expirou. Faça login novamente para concluir o pagamento.');
          window.location.href = '/login';
        } else if (error.status === 409) {
          setCheckoutError(t('checkout_invalid_state')?.body ?? 'Não foi possível processar este pedido no estado atual. Revise seu carrinho e tente novamente.');
        } else if (error.status >= 500) {
          setCheckoutError(t('checkout_temporary_instability')?.body ?? 'Instabilidade temporária no pagamento. Tente novamente em instantes.');
        } else {
          setCheckoutError(t('checkout_payment_generic_error')?.body ?? 'Não foi possível concluir o pagamento agora. Tente novamente.');
        }
      } else {
        setCheckoutError(t('checkout_payment_generic_error')?.body ?? 'Não foi possível concluir o pagamento agora. Tente novamente.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <CheckoutHeader />

      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          <div className="lg:col-span-7 flex flex-col gap-12">
            {step === 3 ? (
              <>
                <CheckoutSuccessCard orderId={paymentSummary?.orderId} />
                {paymentSummary && (
                  <div className="bg-white border border-ruah-100 rounded-2xl p-6">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-ruah-400">Resumo da transação</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ruah-950 mt-3">Pedido: {paymentSummary.orderId}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ruah-950 mt-1">Pagamento: {paymentSummary.paymentId}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ruah-950 mt-1">Status: {paymentSummary.status}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <CheckoutStepOneSection
                  isActive={step === 1}
                  region={location.region}
                  deliveryDateLabel={deliveryDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                  maxProductionDays={maxProductionDays}
                  shippingDays={location.shippingDays}
                  composedDeadline={composedDeadline}
                  selectedAddress={selectedAddress}
                  onSelectAddress={setSelectedAddress}
                  gifting={gifting}
                  onToggleGift={() => setGifting({ ...gifting, isGift: !gifting.isGift })}
                  onGiftMessageChange={(value) => setGifting({ ...gifting, message: value })}
                  onContinue={() => setStep(2)}
                />
                <CheckoutStepTwoSection isActive={step === 2} total={total} isProcessing={isProcessing} onFinish={handleFinish} />
                {checkoutError && <p className="text-[10px] font-bold uppercase tracking-widest text-red-600">{checkoutError}</p>}
              </>
            )}
          </div>

          <CheckoutOrderSummary cart={cart} subtotal={subtotal} total={total} />
        </div>
      </main>

      <footer className="py-12 border-t border-ruah-100 text-center opacity-20">
        <span className="text-[9px] font-bold uppercase tracking-widest text-ruah-950">&copy; 2026 USERUAH | PRIVACIDADE & SEGURANÇA</span>
      </footer>
    </div>
  );
}
