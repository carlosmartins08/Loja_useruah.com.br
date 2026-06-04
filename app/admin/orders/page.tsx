'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CreditCard, Package, Truck } from 'lucide-react';
import { getJson, HttpRequestError, postJson } from '@/lib/http-client';
import {
  humanizeOrderStatus,
  humanizePaymentStatus,
  humanizeProductionStatus,
  humanizeShipmentStatus,
} from '@/lib/order-ui';

interface AdminOrderItem {
  orderId: string;
  customerId: string;
  totalAmount: number;
  createdAt: string;
  status: string;
  paymentStatus: string | null;
  productionStatus: string | null;
  shipmentStatus: string | null;
  items: Array<{
    orderItemId: string;
    productName: string;
    variantLabel: string;
    quantity: number;
    supplierId: string;
  }>;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = React.useState<AdminOrderItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<Record<string, boolean>>({});

  const load = React.useCallback(async () => {
    const payload = await getJson<{ ok: true; orders: AdminOrderItem[] }>('/api/orders');
    setOrders(payload.orders);
  }, []);

  React.useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      if (!active) return;
      setError(null);
      load()
        .catch((err) => {
          if (!active) return;
          if (err instanceof HttpRequestError && (err.status === 401 || err.status === 403)) {
            setError('Sua sessao nao permite consultar os pedidos administrativos.');
            return;
          }
          setError('Nao foi possivel carregar os pedidos agora.');
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
  }, [load]);

  async function createProduction(orderId: string) {
    setActionLoading((current) => ({ ...current, [orderId]: true }));
    setError(null);
    try {
      await postJson('/api/production-jobs', { orderId });
      await load();
    } catch (err) {
      if (err instanceof HttpRequestError && err.status === 409) {
        setError('Este pedido ainda nao pode entrar em producao ou ja possui fila criada.');
      } else {
        setError('Nao foi possivel criar a fila de producao para este pedido.');
      }
    } finally {
      setActionLoading((current) => ({ ...current, [orderId]: false }));
    }
  }

  return (
    <main className="min-h-screen bg-ruah-25 p-6 md:p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-ruah-400">Fase 1</p>
          <h1 className="mt-2 text-3xl font-serif italic text-ruah-950">Pedidos operacionais</h1>
          <p className="mt-2 max-w-2xl text-sm text-ruah-500">
            Aqui o admin master acompanha pedido, pagamento, fila de producao e envio sem depender de leitura difusa.
          </p>
        </div>

        {loading ? <p className="text-sm text-ruah-500">Carregando pedidos...</p> : null}
        {error ? <p className="text-sm text-ruah-500">{error}</p> : null}

        {!loading && !error ? (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="rounded-[2rem] border border-ruah-100 bg-white p-8 shadow-sm text-sm text-ruah-500">
                Nenhum pedido encontrado.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.orderId} className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-accent-gold">{order.orderId}</p>
                      <h2 className="mt-2 text-xl font-serif italic text-ruah-950">{order.items[0]?.productName ?? 'Pedido sem item'}</h2>
                      <p className="mt-2 text-sm text-ruah-500">
                        Cliente {order.customerId} • {new Date(order.createdAt).toLocaleString('pt-BR')} • Total R${' '}
                        {order.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                        <div className="flex items-center gap-2 text-ruah-400">
                          <Package size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Pedido</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold uppercase text-ruah-950">{humanizeOrderStatus(order.status)}</p>
                      </div>
                      <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                        <div className="flex items-center gap-2 text-ruah-400">
                          <CreditCard size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Pagamento</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold uppercase text-ruah-950">{humanizePaymentStatus(order.paymentStatus)}</p>
                      </div>
                      <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                        <div className="flex items-center gap-2 text-ruah-400">
                          <Truck size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Envio</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold uppercase text-ruah-950">
                          {order.shipmentStatus ? humanizeShipmentStatus(order.shipmentStatus) : humanizeProductionStatus(order.productionStatus)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
                    <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ruah-400">Itens do pedido</p>
                      <div className="mt-3 space-y-2">
                        {order.items.map((item) => (
                          <div key={item.orderItemId} className="text-sm text-ruah-700">
                            <span className="font-semibold text-ruah-950">{item.productName}</span> • {item.variantLabel} • Qtd {item.quantity}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-start gap-3">
                      {!order.productionStatus && order.status === 'paid' ? (
                        <button
                          onClick={() => void createProduction(order.orderId)}
                          disabled={Boolean(actionLoading[order.orderId])}
                          className="rounded-2xl bg-ruah-950 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-white disabled:opacity-50"
                        >
                          Criar fila de producao
                        </button>
                      ) : null}
                      <Link
                        href={`/admin/support/${encodeURIComponent(order.orderId)}`}
                        className="inline-flex items-center gap-2 rounded-2xl border border-ruah-200 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-ruah-700"
                      >
                        Abrir contexto <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}
