import Image from 'next/image';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { CartItem } from '@/context/CartContext';

interface CheckoutOrderSummaryProps {
  cart: CartItem[];
  subtotal: number;
  total: number;
}

export function CheckoutOrderSummary({ cart, subtotal, total }: CheckoutOrderSummaryProps) {
  return (
    <aside className="lg:col-span-5">
      <div className="sticky top-8 bg-white rounded-[2.5rem] p-8 lg:p-10 border border-ruah-100 shadow-xl">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ruah-400 mb-8 pb-4 border-b border-ruah-100">Resumo da Reserva</h3>

        <div className="flex flex-col gap-8 mb-10 max-h-80 overflow-y-auto pr-2">
          {cart.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex gap-6">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-ruah-50 border border-ruah-100 shrink-0">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex flex-col justify-center gap-1">
                <span className="text-sm font-semibold text-ruah-950">{item.name}</span>
                <span className="text-xs font-semibold text-ruah-400 uppercase tracking-[0.1em]">QTD: {item.quantity} | {item.spec}</span>
                {item.productionDays && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle size={10} className="text-accent-gold" />
                    <span className="text-xs font-semibold text-accent-gold uppercase tracking-[0.1em]">Sopro da Arte: {item.productionDays} dias</span>
                  </div>
                )}
                <span className="text-xs font-mono font-semibold text-ruah-950">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          ))}
        </div>

        {cart.some((i) => i.productionDays) && (
          <div className="mb-10 p-6 bg-ruah-50/50 border border-ruah-100 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-accent-gold" />
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-gold">Compromisso de Manufatura</span>
            </div>
            <p className="text-sm text-ruah-500 font-medium leading-relaxed">
              Você está adquirindo itens que serão <span className="text-ruah-950 font-bold">tecidos e soprados sob demanda</span> com suas especificações exclusivas. Ao confirmar, você aceita o tempo de cura da arte e o fluxo de produção artesanal.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4 pt-10 border-t border-ruah-100">
          <div className="flex justify-between items-center opacity-40 text-ruah-950 font-bold">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400">Subtotal</span>
            <span className="text-xs font-mono font-semibold">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center opacity-40 text-ruah-950 font-bold">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400">Frete & Sopro</span>
            <span className="text-xs font-mono font-semibold">GRÁTIS</span>
          </div>
          <div className="flex justify-between items-center pt-6 mt-2 border-t border-ruah-100">
            <span className="text-sm font-semibold uppercase tracking-[0.08em] text-ruah-950">Total do Investimento</span>
            <span className="text-3xl font-serif italic text-accent-gold font-bold">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="mt-12 p-6 bg-ruah-50 rounded-2xl flex gap-4 items-center border border-ruah-100 shadow-sm">
          <ShieldCheck size={20} className="text-accent-gold" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-accent-gold uppercase tracking-[0.1em]">Sopro Protegido</span>
            <span className="text-xs font-medium text-ruah-500">Garantia total de recebimento e satisfação.</span>
          </div>
        </div>
      </div>
    </aside>
  );
}



