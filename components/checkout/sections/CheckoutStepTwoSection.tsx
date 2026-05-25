'use client';

import React from 'react';
import Image from 'next/image';
import { CreditCard, QrCode, Wallet } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { PaymentMethod, PaymentProviderKey } from '@/lib/payments';
import { getJson } from '@/lib/http-client';

interface CheckoutStepTwoSectionProps {
  isActive: boolean;
  total: number;
  isProcessing: boolean;
  onFinish: (method: PaymentMethod, provider: PaymentProviderKey) => void;
}

export function CheckoutStepTwoSection({ isActive, total, isProcessing, onFinish }: CheckoutStepTwoSectionProps) {
  const searchParams = useSearchParams();
  const instantMethod = searchParams.get('instant');
  const [manualPaymentMethod, setManualPaymentMethod] = React.useState<PaymentMethod | null>(null);
  const [provider, setProvider] = React.useState<PaymentProviderKey>('sandbox');
  const [defaultProvider, setDefaultProvider] = React.useState<PaymentProviderKey | null>(null);
  const [providers, setProviders] = React.useState<Array<{ key: PaymentProviderKey; label: string; methods: PaymentMethod[]; enabled: boolean; isDefault?: boolean }>>([]);
  const paymentMethod: PaymentMethod =
    manualPaymentMethod ?? (instantMethod === 'pix' ? 'pix' : instantMethod === 'wallet' ? 'wallet' : 'card');
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
        <h2 className="text-3xl font-serif italic uppercase tracking-tighter">Pagamento Executivo</h2>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-ruah-100 shadow-sm text-ruah-950 font-bold">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <button
            type="button"
            aria-pressed={paymentMethod === 'card'}
            onClick={() => setManualPaymentMethod('card')}
            className={`border-2 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all ${paymentMethod === 'card' ? 'border-accent-gold bg-accent-gold/5' : 'border-ruah-50'}`}
          >
            <CreditCard className={paymentMethod === 'card' ? 'text-accent-gold' : 'text-ruah-300'} />
            <span className="text-xs font-semibold uppercase tracking-[0.12em]">Cartão de crédito</span>
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
          <div className="grid grid-cols-1 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-400">Número do cartão</label>
              <input type="text" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" className="bg-ruah-50 border border-ruah-100 rounded-xl px-6 py-4 text-xs font-bold focus:border-accent-gold outline-none transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-400">Validade</label>
                <input type="text" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" className="bg-ruah-50 border border-ruah-100 rounded-xl px-6 py-4 text-xs font-bold focus:border-accent-gold outline-none transition-all" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-400">CVV</label>
                <input type="password" inputMode="numeric" autoComplete="cc-csc" placeholder="123" className="bg-ruah-50 border border-ruah-100 rounded-xl px-6 py-4 text-xs font-bold focus:border-accent-gold outline-none transition-all" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-400">Parcelamento</label>
              <select className="bg-ruah-50 border border-ruah-100 rounded-xl px-6 py-4 text-xs font-bold focus:border-accent-gold outline-none transition-all appearance-none cursor-pointer">
                <option>10x de R$ {(total / 10).toLocaleString('pt-BR')} sem juros</option>
                <option>À vista com 5% de desconto</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-accent-gold/40 bg-accent-gold/5 p-6">
            <p className="text-sm font-semibold text-ruah-950">
              {paymentMethod === 'pix'
                ? 'Pagamento instantâneo via Pix habilitado para este pedido.'
                : 'Pagamento instantâneo via carteira digital habilitado para este pedido.'}
            </p>
            <p className="text-xs font-medium text-ruah-500 mt-2">
              Confirme para finalizar em fluxo de 1 clique com fallback para checkout padrão.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-ruah-400">Gateway de pagamento</label>
          <select
            value={effectiveProvider}
            onChange={(event) => setProvider(event.target.value as PaymentProviderKey)}
            className="bg-ruah-50 border border-ruah-100 rounded-xl px-6 py-4 text-xs font-bold focus:border-accent-gold outline-none transition-all appearance-none cursor-pointer"
          >
            {availableProviders.map((item) => (
              <option key={item.key} value={item.key}>
                {item.isDefault ? `${item.label} (Padrao)` : item.label}
              </option>
            ))}
            {availableProviders.length === 0 && <option value="sandbox">Sandbox interno</option>}
          </select>
        </div>
      </div>

      <button type="button" onClick={() => onFinish(paymentMethod, effectiveProvider)} disabled={isProcessing} aria-busy={isProcessing} className="bg-ruah-950 text-white py-6 rounded-2xl font-bold uppercase text-xs tracking-[0.1em] hover:bg-accent-gold transition-all relative overflow-hidden">
        {isProcessing
          ? 'Processando...'
          : paymentMethod === 'card'
            ? 'Finalizar pagamento'
            : `Finalizar 1 clique ${paymentMethod === 'pix' ? 'PIX' : 'CARTEIRA'}`}
      </button>

      <div className="flex items-center justify-center gap-8 py-8 opacity-40 grayscale scale-90">
        <Image src="https://picsum.photos/seed/visa/100/50" alt="Visa" width={40} height={20} />
        <Image src="https://picsum.photos/seed/master/100/50" alt="Mastercard" width={40} height={20} />
        <Image src="https://picsum.photos/seed/pix/100/50" alt="Pix" width={40} height={20} />
      </div>
    </div>
  );
}

