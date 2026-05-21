import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export function CheckoutSuccessCard() {
  return (
    <div className="bg-white rounded-[3rem] p-16 shadow-subtle border border-ruah-100 flex flex-col items-center text-center">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-8">
        <CheckCircle2 size={48} />
      </div>
      <h2 className="text-4xl font-serif italic mb-4 text-ruah-950">Arte Confirmada.</h2>
      <p className="text-sm font-medium uppercase tracking-widest text-ruah-400 mb-12 max-w-sm">Sua peça exclusiva já entrou no processo de produção artesanal. O Handover operacional foi concluído com sucesso.</p>
      <Link href="/account/orders" className="bg-ruah-950 text-white px-12 py-5 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-accent-gold transition-all">
        Acompanhar Sopro da Arte
      </Link>
    </div>
  );
}

