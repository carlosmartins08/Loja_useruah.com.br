import React from 'react';
import { Header } from '@/components/navigation/Header';
import { CheckCircle2, Package, Mail, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.orderId;

  return (
    <main className="bg-white min-h-screen pb-40 font-sans page-header-offset">
      <Header />

      <div className="pt-12 section-container flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-8">
          <CheckCircle2 size={48} />
        </div>

        <h1 className="text-6xl font-serif italic tracking-tighter uppercase mb-4">
          Pedido <span className="text-accent-gold">Recebido.</span>
        </h1>
        <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-ruah-400 mb-12">
          Acompanhe na sua conta a confirmacao do pagamento e as proximas etapas.
        </p>

        <div className="bg-ruah-50 p-12 rounded-[3.5rem] border border-ruah-100 w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-12 text-left mb-16 shadow-fancy">
          <div className="flex flex-col gap-4">
            <span className="tech-label text-accent-gold">Detalhes do Pedido</span>
            <div>
              <span className="text-[10px] text-ruah-400 font-bold uppercase tracking-widest block mb-1">Numero</span>
              <span className="text-xl font-mono font-bold text-ruah-950">{orderId ?? 'Consulte sua conta'}</span>
            </div>
            <div>
              <span className="text-[10px] text-ruah-400 font-bold uppercase tracking-widest block mb-1">Status do pagamento</span>
              <span className="text-[10px] font-bold text-ruah-600 uppercase tracking-widest">
                Consulte o estado atual na sua conta
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-3">
              <Mail size={16} className="text-ruah-300 shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-ruah-950">
                Acompanhe a evolucao oficial do pedido direto na sua conta.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Calendar size={16} className="text-ruah-300 shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-ruah-950">
                Assim que o envio for registrado, o rastreio aparecera na sua conta.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-ruah-300 shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-ruah-950">
                Consulte o acompanhamento real em /account/orders.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <Link href={orderId ? `/account/orders/${orderId}` : '/account/orders'} className="bg-ruah-950 text-white px-12 py-5 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-accent-gold transition-all flex items-center justify-center gap-3 shadow-xl">
            Acompanhar Pedido
          </Link>
          <Link href="/" className="bg-white border border-ruah-100 px-12 py-5 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] hover:border-ruah-950 transition-all flex items-center justify-center gap-3">
            Voltar para Inicio
          </Link>
        </div>

        <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-12 text-left border-t border-ruah-100 pt-20">
          <div className="flex flex-col gap-4">
            <Package className="text-accent-gold mb-2" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-ruah-950">Pack Respiro</h4>
            <p className="text-[10px] font-bold text-ruah-400 uppercase tracking-widest leading-relaxed">
              A producao so comeca depois da confirmacao do pagamento.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <MapPin className="text-accent-gold mb-2" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-ruah-950">Logistica de Fe</h4>
            <p className="text-[10px] font-bold text-ruah-400 uppercase tracking-widest leading-relaxed">
              O rastreio real aparece na sua conta assim que o envio e registrado.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <CheckCircle2 className="text-accent-gold mb-2" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-ruah-950">Garantia Ruah</h4>
            <p className="text-[10px] font-bold text-ruah-400 uppercase tracking-widest leading-relaxed">
              O pedido nao depende mais de numero cenografico nem rastreio ficticio.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
