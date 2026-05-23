'use client';

import React from 'react';
import { Package, RefreshCcw, ChevronRight, Truck, CheckCircle2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { getJson } from '@/lib/http-client';

type OrderStatusUi = 'recebido' | 'producao' | 'enviado' | 'entregue';

interface OrdersApiItem {
  orderId: string;
  totalAmount: number;
  createdAt: string;
  status: string;
  productionStatus: string | null;
  shipmentStatus: string | null;
  items: Array<{ catalogItemId: string; quantity: number }>;
}

const STATUS_MAP: Record<OrderStatusUi, { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  recebido: { label: 'Pedido Recebido', color: 'text-ruah-400', icon: Package },
  producao: { label: 'Em Producao', color: 'text-accent-gold', icon: RefreshCcw },
  enviado: { label: 'Em Transito', color: 'text-accent-gold', icon: Truck },
  entregue: { label: 'Entregue', color: 'text-green-600', icon: CheckCircle2 },
};

function mapToUiStatus(order: OrdersApiItem): OrderStatusUi {
  if (order.status === 'delivered') return 'entregue';
  if (order.status === 'shipped' || order.shipmentStatus === 'created' || order.shipmentStatus === 'in_transit') return 'enviado';
  if (order.status === 'in_production' || order.productionStatus === 'queued' || order.productionStatus === 'in_progress') return 'producao';
  return 'recebido';
}

export default function MyOrders() {
  const [ratedOrders, setRatedOrders] = React.useState<string[]>([]);
  const [orders, setOrders] = React.useState<OrdersApiItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    getJson<{ ok: true; orders: OrdersApiItem[] }>('/api/orders?customerId=customer-session')
      .then((data) => {
        if (!active) return;
        setOrders(data.orders);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div className='text-xs text-ruah-400 uppercase tracking-widest'>Carregando pedidos...</div>;
  if (!orders.length) return <div className='text-xs text-ruah-400 uppercase tracking-widest'>Nenhum pedido encontrado.</div>;

  return (
    <div className='flex flex-col gap-8'>
      <div className='mb-4'>
        <h2 className='text-4xl font-serif italic uppercase leading-none text-ruah-950'>Meus Pedidos</h2>
        <p className='text-[10px] font-bold text-ruah-400 uppercase tracking-widest mt-4'>Acompanhe seu historico de fe e arte.</p>
      </div>

      <div className='flex flex-col gap-6'>
        {orders.map((order) => {
          const uiStatus = mapToUiStatus(order);
          const statusConfig = STATUS_MAP[uiStatus];
          return (
            <div key={order.orderId} className='bg-white border border-ruah-100 rounded-[2.5rem] overflow-hidden hover:shadow-xl transition-all group'>
              <div className='p-8 md:p-12'>
                <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b border-ruah-50'>
                  <div className='flex flex-col gap-1'>
                    <span className='text-[9px] font-bold text-ruah-300 uppercase tracking-widest'>PEDIDO {order.orderId}</span>
                    <span className='text-xl font-serif italic text-ruah-950'>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <statusConfig.icon size={16} className={statusConfig.color} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${statusConfig.color}`}>{statusConfig.label}</span>
                  </div>
                  <div className='flex flex-col items-end gap-1'>
                    <span className='text-[9px] font-bold text-ruah-300 uppercase tracking-widest'>TOTAL</span>
                    <span className='text-xl font-mono text-ruah-950'>R$ {order.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className='flex flex-col lg:flex-row justify-between items-center gap-12'>
                  <div className='flex items-center gap-8 w-full'>
                    {order.items.slice(0, 1).map((item) => (
                      <div key={item.catalogItemId} className='flex items-center gap-6'>
                        <div className='relative w-24 h-24 rounded-2xl overflow-hidden bg-ruah-50'>
                          <Image src='https://picsum.photos/seed/ruah-order/200/200' alt={item.catalogItemId} fill className='object-cover' />
                        </div>
                        <div className='flex flex-col gap-1'>
                          <span className='text-xs font-bold uppercase tracking-tight text-ruah-950'>{item.catalogItemId}</span>
                          <span className='text-[9px] font-bold text-ruah-300 uppercase tracking-widest'>QTD: {item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className='flex flex-col sm:flex-row gap-4 w-full lg:w-auto shrink-0'>
                    {uiStatus === 'entregue' && (
                      <div className='flex flex-col gap-4'>
                        {ratedOrders.includes(order.orderId) ? (
                          <div className='bg-green-50 px-6 py-4 rounded-2xl border border-green-100 flex items-center gap-3'>
                            <Sparkles size={14} className='text-green-600' />
                            <span className='text-[8px] font-bold text-green-600 uppercase tracking-widest'>Obrigado pelo seu feedback!</span>
                          </div>
                        ) : (
                          <button onClick={() => setRatedOrders((prev) => [...prev, order.orderId])} className='bg-ruah-50 px-6 py-4 rounded-2xl border border-ruah-100 text-[8px] font-bold text-ruah-950 uppercase tracking-widest'>
                            Avaliar Experiencia
                          </button>
                        )}
                      </div>
                    )}
                    <button className='flex items-center justify-center gap-3 bg-ruah-950 text-white px-8 py-5 rounded-2xl hover:bg-accent-gold transition-all shadow-fancy'>
                      <span className='text-[9px] font-bold uppercase tracking-widest whitespace-nowrap'>Detalhes Completos</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
