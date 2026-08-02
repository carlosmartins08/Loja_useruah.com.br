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
import { readAddressBook, toShippingAddress } from '@/lib/address-book';

export function CheckoutPageView() {
  const { cart, total, subtotal, gifting, setGifting, clearCart } = useCart();
  const [step, setStep] = React.useState(1);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [selectedAddress, setSelectedAddress] = React.useState('home');
  const [shippingAddress, setShippingAddress] = React.useState({
    recipientName: '',
    cep: '',
    street: '',
    number: '',
    city: '',
    state: '',
    country: '',
  });
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);
  const [paymentSummary, setPaymentSummary] = React.useState<PaymentRecord | null>(null);
  const requestKeyRef = React.useRef<string | null>(null);
  const { isAuthenticated, userId } = useUser();
  const t = (id: string, vars?: Record<string, string | number>) => renderContentMessage(id, vars);

  React.useEffect(() => {
    const savedAddresses = readAddressBook(userId);
    const defaultAddress = savedAddresses.find((entry) => entry.isDefault) ?? savedAddresses[0];
    if (!defaultAddress) return;
    const timeoutId = window.setTimeout(() => {
      setShippingAddress(toShippingAddress(defaultAddress));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [userId]);

  if (cart.length === 0 && !isProcessing && step !== 3) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-serif mb-8 text-ruah-950">Seu carrinho está vazio.</h1>
        <Link href="/shop" className="bg-ruah-950 text-white px-12 py-5 rounded-2xl font-bold uppercase text-xs tracking-[0.1em] hover:bg-accent-gold transition-all">
          Voltar para a Coleção
        </Link>
      </div>
    );
  }

  const maxProductionDays = cart.reduce((max, item) => Math.max(max, item.productionDays || 7), 0);
  const handleFinish = async (method: PaymentMethod, provider: PaymentRecord['provider']) => {
    if (!isAuthenticated) {
      setCheckoutError(t('checkout_session_expired')?.body ?? 'Sua sessão expirou. Faça login novamente para concluir o pagamento.');
      window.location.href = '/login';
      return;
    }

    const campaignIds = Array.from(new Set(cart.map((item) => item.campaignId).filter((value): value is string => Boolean(value))));
    const hasMixedCampaignContext = campaignIds.length > 1 || (campaignIds.length === 1 && cart.some((item) => !item.campaignId));
    if (hasMixedCampaignContext) {
      setCheckoutError('Seu carrinho mistura itens com contexto de campanha diferente. Feche uma compra por campanha.');
      return;
    }

    const supplierId = cart[0]?.customSpecs?.supplierId || 'supplier-default';

    setIsProcessing(true);
    setCheckoutError(null);
    const attemptKey = requestKeyRef.current ?? crypto.randomUUID();
    requestKeyRef.current = attemptKey;

    try {
      const orderPayload = await postJson<{ order: OrderRecord }>(
        '/api/orders',
        {
          customer: { id: userId },
          supplierId,
          shippingAddressMode: selectedAddress === 'home' ? 'same_as_account' : 'custom',
          shippingAddress,
          campaignId: campaignIds[0],
          items: cart.map((item) => ({
            catalogItemId: item.id,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        },
        { headers: { 'x-idempotency-key': attemptKey } }
      );

      const payload = await postJson<{ payment: PaymentRecord }>(
        '/api/payments/checkout',
        {
          orderId: orderPayload.order.orderId,
          method,
          provider,
        },
        { headers: { 'x-idempotency-key': attemptKey } }
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

      <main className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          <div className="lg:col-span-7 flex flex-col gap-12">
            {step === 3 ? (
              <>
                <CheckoutSuccessCard orderId={paymentSummary?.orderId} />
                {paymentSummary && (
                  <div className="bg-white border border-ruah-100 rounded-2xl p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ruah-400">Resumo da transação</p>
                    <p className="text-sm font-semibold text-ruah-950 mt-3">Pedido: {paymentSummary.orderId}</p>
                    <p className="text-sm font-semibold text-ruah-950 mt-1">Pagamento: {paymentSummary.paymentId}</p>
                    <p className="text-sm font-semibold text-ruah-950 mt-1">Status: {paymentSummary.status}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <CheckoutStepOneSection
                  isActive={step === 1}
                  maxProductionDays={maxProductionDays}
                  selectedAddress={selectedAddress}
                  onSelectAddress={setSelectedAddress}
                  shippingAddress={shippingAddress}
                  onShippingAddressChange={(field, value) =>
                    setShippingAddress((current) => ({
                      ...current,
                      [field]: value,
                    }))
                  }
                  gifting={gifting}
                  onToggleGift={() => setGifting({ ...gifting, isGift: !gifting.isGift })}
                  onGiftMessageChange={(value) => setGifting({ ...gifting, message: value })}
                  onContinue={() => setStep(2)}
                />
                <CheckoutStepTwoSection isActive={step === 2} isProcessing={isProcessing} onFinish={handleFinish} />
                {checkoutError && <p role="alert" className="text-sm font-semibold text-red-600">{checkoutError}</p>}
              </>
            )}
          </div>

          <CheckoutOrderSummary cart={cart} subtotal={subtotal} total={total} />
        </div>
      </main>

      <footer className="py-12 border-t border-ruah-100 text-center opacity-20">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ruah-950">&copy; 2026 UseRuah | Privacidade e Segurança</span>
      </footer>
    </div>
  );
}

