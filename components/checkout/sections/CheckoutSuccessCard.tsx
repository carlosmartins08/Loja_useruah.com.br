import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import type { PaymentStatus } from '@/lib/payments';
import { humanizePaymentStatus } from '@/lib/order-ui';

interface CheckoutSuccessCardProps {
  orderId?: string;
  paymentStatus?: PaymentStatus;
}

export function CheckoutSuccessCard({ orderId, paymentStatus }: CheckoutSuccessCardProps) {
  const paymentIsApproved = paymentStatus === 'approved';
  const paymentIsProcessing = paymentStatus === 'created' || paymentStatus === 'processing';
  const orderReference = orderId ? ` ${orderId}` : '';
  const statusCopy = paymentIsApproved
    ? `O pagamento do pedido${orderReference} foi aprovado. Acompanhe a proxima etapa operacional na sua conta.`
    : paymentIsProcessing
      ? `O pedido${orderReference} foi criado e o pagamento esta em processamento. A producao so comeca depois da confirmacao do pagamento.`
      : `O pedido${orderReference} foi criado. Consulte o estado atual do pagamento na sua conta antes das proximas etapas.`;
  return (
    <div className="bg-white rounded-[3rem] p-16 shadow-subtle border border-ruah-100 flex flex-col items-center text-center">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-8">
        <CheckCircle2 size={48} />
      </div>
      <h2 className="text-4xl font-serif italic mb-4 text-ruah-950">Pedido recebido.</h2>
      <p className="text-sm font-medium uppercase tracking-widest text-ruah-400 mb-12 max-w-sm">
        {statusCopy}
      </p>
      <p className="mb-8 text-xs font-semibold uppercase tracking-[0.12em] text-ruah-500">
        Pagamento: {humanizePaymentStatus(paymentStatus)}
      </p>
      <Link href="/account/orders" className="bg-ruah-950 text-white px-12 py-5 rounded-2xl font-bold uppercase text-xs tracking-[0.1em] hover:bg-accent-gold transition-all">
        Acompanhar pedido
      </Link>
    </div>
  );
}

