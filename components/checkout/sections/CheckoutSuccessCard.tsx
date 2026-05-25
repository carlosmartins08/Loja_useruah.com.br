import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { renderContentMessage } from '@/lib/content-messages';

export function CheckoutSuccessCard({ orderId }: { orderId?: string }) {
  const message = renderContentMessage('checkout_success_title', orderId ? { orderId } : undefined);
  return (
    <div className="bg-white rounded-[3rem] p-16 shadow-subtle border border-ruah-100 flex flex-col items-center text-center">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-8">
        <CheckCircle2 size={48} />
      </div>
      <h2 className="text-4xl font-serif italic mb-4 text-ruah-950">{message?.headline ?? 'Arte Confirmada.'}</h2>
      <p className="text-sm font-medium uppercase tracking-widest text-ruah-400 mb-12 max-w-sm">
        {message?.body ?? 'Sua peca exclusiva entrou em producao artesanal com sucesso.'}
      </p>
      <Link href="/account/orders" className="bg-ruah-950 text-white px-12 py-5 rounded-2xl font-bold uppercase text-xs tracking-[0.1em] hover:bg-accent-gold transition-all">
        {message?.ctaPrimary ?? 'Acompanhar pedido'}
      </Link>
    </div>
  );
}

