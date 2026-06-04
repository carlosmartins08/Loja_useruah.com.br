'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Package, Truck, Wallet } from 'lucide-react';
import { getJson, HttpRequestError } from '@/lib/http-client';
import { AppImage } from '@/components/shared/AppImage';
import {
  humanizeOrderStatus,
  humanizePaymentStatus,
  humanizeProductionStatus,
  humanizeShipmentStatus,
  humanizeTimelineEvent,
} from '@/lib/order-ui';

interface OrderStatusPayload {
  ok: true;
  orderId: string;
  status: string;
  paymentStatus: string | null;
  productionStatus: string | null;
  items: Array<{
    orderItemId: string;
    catalogItemId: string;
    productName: string;
    productImage: string;
    variantId: string;
    variantLabel: string;
    quantity: number;
    unitPrice: number;
    snapshotVersion: string;
  }>;
  shipment: null | {
    trackingCode: string;
    carrier: string;
    status: string;
  };
  timeline: Array<{ event: string; createdAt: string }>;
}

export default function AccountOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = React.use(params);
  const [data, setData] = React.useState<OrderStatusPayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      if (!active) return;
      getJson<OrderStatusPayload>(`/api/orders/${resolved.id}/status`)
        .then((payload) => {
          if (!active) return;
          setData(payload);
        })
        .catch((err) => {
          if (!active) return;
          if (err instanceof HttpRequestError && err.status === 401) {
            setError('Sua sessao expirou. Entre novamente para acompanhar seu pedido.');
            return;
          }
          if (err instanceof HttpRequestError && err.status === 403) {
            setError('Este pedido nao esta disponivel para a sua conta.');
            return;
          }
          setError('Nao foi possivel carregar o acompanhamento deste pedido.');
        })
        .finally(() => {
          if (!active) return;
          setLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [resolved.id]);

  return (
    <main className='min-h-screen bg-ruah-25 p-6 md:p-10'>
      <div className='mx-auto flex max-w-5xl flex-col gap-6'>
        <Link href='/account/orders' className='inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-ruah-500'>
          <ChevronLeft size={14} />
          Voltar para pedidos
        </Link>

        {loading ? <p className='text-xs font-semibold uppercase tracking-widest text-ruah-400'>Carregando acompanhamento...</p> : null}
        {error ? <p className='text-xs font-semibold uppercase tracking-widest text-red-600'>{error}</p> : null}

        {data ? (
          <>
            <section className='rounded-[2rem] border border-ruah-100 bg-white p-8 shadow-sm'>
              <p className='text-xs font-bold uppercase tracking-[0.12em] text-ruah-400'>Pedido {data.orderId}</p>
              <h1 className='mt-3 text-4xl font-serif italic text-ruah-950'>Acompanhamento do pedido</h1>
              <div className='mt-8 grid grid-cols-1 gap-4 md:grid-cols-3'>
                <div className='rounded-2xl border border-ruah-100 bg-ruah-50 p-4'>
                  <p className='text-[10px] font-bold uppercase tracking-[0.1em] text-ruah-400'>Pedido</p>
                  <p className='mt-2 text-sm font-semibold uppercase text-ruah-950'>{humanizeOrderStatus(data.status)}</p>
                </div>
                <div className='rounded-2xl border border-ruah-100 bg-ruah-50 p-4'>
                  <p className='text-[10px] font-bold uppercase tracking-[0.1em] text-ruah-400'>Pagamento</p>
                  <p className='mt-2 text-sm font-semibold uppercase text-ruah-950'>{humanizePaymentStatus(data.paymentStatus)}</p>
                </div>
                <div className='rounded-2xl border border-ruah-100 bg-ruah-50 p-4'>
                  <p className='text-[10px] font-bold uppercase tracking-[0.1em] text-ruah-400'>Producao</p>
                  <p className='mt-2 text-sm font-semibold uppercase text-ruah-950'>{humanizeProductionStatus(data.productionStatus)}</p>
                </div>
              </div>
            </section>

            <section className='grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.7fr]'>
              <div className='space-y-6'>
                <div className='rounded-[2rem] border border-ruah-100 bg-white p-8 shadow-sm'>
                  <div className='flex items-center gap-3'>
                    <Package size={18} className='text-accent-gold' />
                    <h2 className='text-lg font-bold text-ruah-950'>Itens congelados do pedido</h2>
                  </div>
                  <div className='mt-6 space-y-4'>
                    {data.items.map((item) => (
                      <div key={item.orderItemId} className='flex items-center gap-4 rounded-2xl border border-ruah-100 bg-ruah-50 p-4'>
                        <div className='relative h-20 w-20 overflow-hidden rounded-2xl bg-white'>
                          <AppImage
                            context='content-banner'
                            src={item.productImage || 'https://picsum.photos/seed/ruah-order-detail/200/200'}
                            alt={item.productName}
                            fill
                            className='object-cover'
                          />
                        </div>
                        <div className='flex flex-1 flex-col gap-1'>
                          <p className='text-sm font-semibold text-ruah-950'>{item.productName}</p>
                          <p className='text-xs font-semibold uppercase tracking-[0.08em] text-ruah-500'>{item.variantLabel}</p>
                          <p className='text-xs font-semibold uppercase tracking-[0.08em] text-ruah-400'>
                            Qtd: {item.quantity} · R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='rounded-[2rem] border border-ruah-100 bg-white p-8 shadow-sm'>
                  <div className='flex items-center gap-3'>
                    <Package size={18} className='text-accent-gold' />
                    <h2 className='text-lg font-bold text-ruah-950'>Linha do tempo oficial</h2>
                  </div>
                  <div className='mt-6 space-y-4'>
                    {data.timeline.length === 0 ? (
                      <p className='text-xs font-semibold uppercase tracking-widest text-ruah-400'>Sem eventos registrados.</p>
                    ) : (
                      data.timeline.map((entry, index) => (
                      <div key={`${entry.event}-${entry.createdAt}-${index}`} className='rounded-2xl border border-ruah-100 bg-ruah-50 p-4'>
                          <p className='text-xs font-bold uppercase tracking-[0.1em] text-ruah-950'>{humanizeTimelineEvent(entry.event)}</p>
                          <p className='mt-2 text-xs text-ruah-500'>{new Date(entry.createdAt).toLocaleString('pt-BR')}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className='space-y-6'>
                <div className='rounded-[2rem] border border-ruah-100 bg-white p-8 shadow-sm'>
                  <div className='flex items-center gap-3'>
                    <Truck size={18} className='text-accent-gold' />
                    <h2 className='text-lg font-bold text-ruah-950'>Rastreio</h2>
                  </div>
                  {data.shipment ? (
                    <div className='mt-6 space-y-3 text-sm'>
                      <p><span className='font-semibold text-ruah-950'>Transportadora:</span> {data.shipment.carrier}</p>
                      <p><span className='font-semibold text-ruah-950'>Codigo:</span> {data.shipment.trackingCode}</p>
                      <p><span className='font-semibold text-ruah-950'>Status:</span> {humanizeShipmentStatus(data.shipment.status)}</p>
                    </div>
                  ) : (
                    <p className='mt-6 text-xs font-semibold uppercase tracking-widest text-ruah-400'>Rastreio ainda nao disponivel.</p>
                  )}
                </div>

                <div className='rounded-[2rem] border border-ruah-100 bg-white p-8 shadow-sm'>
                  <div className='flex items-center gap-3'>
                    <Wallet size={18} className='text-accent-gold' />
                    <h2 className='text-lg font-bold text-ruah-950'>Pagamento</h2>
                  </div>
                  <p className='mt-6 text-sm text-ruah-700'>Status atual: <span className='font-semibold uppercase text-ruah-950'>{humanizePaymentStatus(data.paymentStatus)}</span></p>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
