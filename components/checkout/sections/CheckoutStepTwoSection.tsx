'use client';

import React from 'react';
import { CreditCard, QrCode, Wallet } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { PaymentMethod, PaymentProviderKey } from '@/lib/payments';
import { getJson } from '@/lib/http-client';

interface CheckoutStepTwoSectionProps {
  isActive: boolean;
  isProcessing: boolean;
  onFinish: (method: PaymentMethod, provider: PaymentProviderKey) => void;
}

export function CheckoutStepTwoSection({ isActive, isProcessing, onFinish }: CheckoutStepTwoSectionProps) {
  const searchParams = useSearchParams();
  const instantMethod = searchParams.get('instant');
  const [manualPaymentMethod, setManualPaymentMethod] = React.useState<PaymentMethod | null>(null);
  const [provider, setProvider] = React.useState<PaymentProviderKey>('sandbox');
  const [defaultProvider, setDefaultProvider] = React.useState<PaymentProviderKey | null>(null);
  const [providers, setProviders] = React.useState<Array<{ key: PaymentProviderKey; label: string; methods: PaymentMethod[]; enabled: boolean; isDefault?: boolean }>>([]);
  const cardPaymentUiEnabled = false;
  const paymentMethod: PaymentMethod =
    manualPaymentMethod ?? (instantMethod === 'wallet' ? 'wallet' : 'pix');
  const availableProviders = React.useMemo(
    () => providers.filter((item) => item.enabled && item.methods.includes(paymentMethod)),
    [providers, paymentMethod]
  );
  const effectiveProvider: PaymentProviderKey =
    availableProviders.find((item) => item.key === provider)?.key ??
    availableProviders.find((item) => item.key === defaultProvider)?.key ??
    availableProviders[0]?.key ??
    'sandbox';

  React.useEffect(() => {
    getJson<{ providers: Array<{ key: PaymentProviderKey; label: string; methods: PaymentMethod[]; enabled: boolean; isDefault?: boolean }>; defaultProvider?: PaymentProviderKey | null }>(
      '/api/payments/providers'
    )
      .then((response) => {
        setProviders(response.providers);
        setDefaultProvider(response.defaultProvider ?? null);
      })
      .catch(() =>
        setProviders([{ key: 'sandbox', label: 'Sandbox interno', methods: ['card', 'pix', 'wallet'], enabled: true, isDefault: true }])
      );
  }, []);

  return (
    <div className={`flex flex-col gap-8 transition-opacity ${isActive ? '' : 'opacity-40 pointer-events-none'}`}>
      <div className="flex items-center gap-6 text-ruah-950">
        <div className="w-10 h-10 bg-ruah-950 text-white rounded-full flex items-center justify-center font-serif italic text-lg">2</div>
        <h2 className="text-3xl font-serif italic uppercase tracking-tighter">Pagamento</h2>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-ruah-100 shadow-sm text-ruah-950 font-bold">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <button
            type="button"
            aria-pressed={paymentMethod === 'card'}
            disabled={!cardPaymentUiEnabled}
            onClick={() => cardPaymentUiEnabled && setManualPaymentMethod('card')}
            className={`border-2 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${paymentMethod === 'card' ? 'border-accent-gold bg-accent-gold/5' : 'border-ruah-50'} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <CreditCard className={paymentMethod === 'card' ? 'text-accent-gold' : 'text-ruah-300'} />
            <span className="text-xs font-semibold uppercase tracking-[0.12em]">Cartão de crédito</span>
            <span className="text-[10px] font-medium text-ruah-400">Indisponível até a integração segura com o provedor.</span>
          </button>
          <button
            type="button"
            aria-pressed={paymentMethod === 'pix'}
            onClick={() => setManualPaymentMethod('pix')}
            className={`border-2 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${paymentMethod === 'pix' ? 'border-accent-gold bg-accent-gold/5' : 'border-ruah-50'}`}
          >
            <QrCode className={paymentMethod === 'pix' ? 'text-accent-gold' : 'text-ruah-300'} />
            <span className="text-xs font-semibold uppercase tracking-[0.12em]">Pix (1 clique)</span>
          </button>
          <button
            type="button"
            aria-pressed={paymentMethod === 'wallet'}
            onClick={() => setManualPaymentMethod('wallet')}
            className={`border-2 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${paymentMethod === 'wallet' ? 'border-accent-gold bg-accent-gold/5' : 'border-ruah-50'}`}
          >
            <Wallet className={paymentMethod === 'wallet' ? 'text-accent-gold' : 'text-ruah-300'} />
            <span className="text-xs font-semibold uppercase tracking-[0.12em]">Carteira digital</span>
          </button>
        </div>

        {paymentMethod === 'card' ? (
          <div className="rounded-2xl border border-ruah-200 bg-ruah-50 p-6">
            <p className="text-sm font-semibold text-ruah-950">Pagamento com cartão temporariamente indisponível.</p>
            <p className="text-xs font-medium text-ruah-500 mt-2">
              Não coletamos dados de cartão neste momento. Selecione Pix ou carteira digital para continuar.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-accent-gold/40 bg-accent-gold/5 p-6">
            <p className="text-sm font-semibold text-ruah-950">
              {paymentMethod === 'pix'
                ? 'Pagamento instantâneo via Pix habilitado para este pedido.'
                : 'Pagamento instantâneo via carteira digital habilitado para este pedido.'}
            </p>
            <p className="text-xs font-medium text-ruah-500 mt-2">
              Confirme para concluir o pedido com o método selecionado.
            </p>
          </div>
        )}
      </div>

      <button type="button" onClick={() => onFinish(paymentMethod, effectiveProvider)} disabled={isProcessing || paymentMethod === 'card'} aria-busy={isProcessing} className="bg-ruah-950 text-white py-6 rounded-2xl font-bold uppercase text-xs tracking-[0.1em] hover:bg-accent-gold transition-all relative overflow-hidden disabled:cursor-not-allowed disabled:opacity-50">
        {isProcessing
          ? 'Processando...'
          : paymentMethod === 'card'
            ? 'Finalizar pagamento'
            : `Finalizar 1 clique ${paymentMethod === 'pix' ? 'PIX' : 'CARTEIRA'}`}
      </button>

      <div className="flex items-center justify-center gap-3 py-8 flex-wrap">
        <span className="inline-flex items-center gap-2 rounded-full border border-ruah-100 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-400">
          <CreditCard size={12} className="text-accent-gold" />
          Visa
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-ruah-100 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-400">
          <CreditCard size={12} className="text-accent-gold" />
          Mastercard
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-ruah-100 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-400">
          <QrCode size={12} className="text-accent-gold" />
          Pix
        </span>
      </div>
    </div>
  );
}
