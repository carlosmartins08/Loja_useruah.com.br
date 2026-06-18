'use client';

import React from 'react';
import Link from 'next/link';
import { Boxes, Factory, ShieldAlert } from 'lucide-react';
import { getJson, HttpRequestError } from '@/lib/http-client';

interface SupplierOrderItem {
  orderId: string;
  totalAmount: number;
  createdAt: string;
  status: string;
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function SupplierOrdersPage() {
  const [orders, setOrders] = React.useState<SupplierOrderItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    getJson<{ ok: true; orders: SupplierOrderItem[] }>('/api/orders')
      .then((data) => {
        if (active) setOrders(data.orders);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof HttpRequestError && err.status === 403) {
          setError('Este ambiente depende do papel supplier para listar a carteira operacional.');
          return;
        }
        setError('Nao foi possivel carregar os pedidos da carteira agora.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-ruah-25 p-6 md:p-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-ruah-100 bg-white p-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent-gold">Ambiente fornecedor</p>
          <h1 className="mt-3 text-3xl font-serif italic text-ruah-950">Pedidos em carteira</h1>
          <p className="mt-3 max-w-3xl text-sm text-ruah-500">
            Esta lista agora e propria do namespace supplier. Ela mostra a carteira operacional sem reaproveitar a jornada do
            cliente e evidencia quando o pedido ainda nao pode entrar na sua esteira exclusiva de producao.
          </p>
        </header>

        {loading ? <p className="text-sm text-ruah-500">Carregando carteira do fornecedor...</p> : null}
        {error ? <p className="text-sm text-ruah-500">{error}</p> : null}

        {!loading && !error ? (
          orders.length === 0 ? (
            <section className="rounded-[2rem] border border-ruah-100 bg-white p-8 shadow-sm">
              <p className="text-sm text-ruah-500">Nenhum pedido foi associado a este fornecedor no momento.</p>
            </section>
          ) : (
            <section className="grid grid-cols-1 gap-4">
              {orders.map((order) => {
                const supplierIds = Array.from(new Set(order.items.map((item) => item.supplierId)));
                const hasStrictProductionScope = supplierIds.length === 1;
                return (
                  <article key={order.orderId} className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-gold">{order.orderId}</p>
                        <h2 className="mt-2 text-xl font-serif italic text-ruah-950">Carteira operacional do fornecedor</h2>
                        <p className="mt-2 text-sm text-ruah-500">
                          Criado em {new Date(order.createdAt).toLocaleString('pt-BR')} com total de {formatCurrency(order.totalAmount)}.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-ruah-100 bg-ruah-50 px-4 py-3 text-right">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Status atual</p>
                        <p className="mt-2 text-sm font-semibold uppercase text-ruah-950">
                          {order.shipmentStatus ?? order.productionStatus ?? order.status}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
                      <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                        <div className="flex items-center gap-2 text-ruah-500">
                          <Boxes size={16} />
                          <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Itens do pedido</span>
                        </div>
                        <div className="mt-3 space-y-2 text-sm text-ruah-700">
                          {order.items.map((item) => (
                            <p key={item.orderItemId}>
                              <span className="font-semibold text-ruah-950">{item.productName}</span> | {item.variantLabel} | Qtd {item.quantity}
                            </p>
                          ))}
                        </div>
                      </div>

                      <aside className="flex w-full max-w-sm flex-col gap-3">
                        <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                          <div className="flex items-center gap-2 text-ruah-500">
                            <Factory size={16} />
                            <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Escopo de producao</span>
                          </div>
                          <p className="mt-2 text-sm text-ruah-700">
                            {hasStrictProductionScope
                              ? 'Pedido elegivel para operacao supplier quando o ownership for univoco.'
                              : 'Pedido multi-supplier. A mutacao de producao fica restrita ao operador global.'}
                          </p>
                        </div>
                        {!hasStrictProductionScope ? (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            <div className="flex items-center gap-2 font-semibold">
                              <ShieldAlert size={16} />
                              Escopo estrito aplicado
                            </div>
                            <p className="mt-2">Enquanto nao existir job parcial por fornecedor, este pedido nao entra na sua mutacao direta.</p>
                          </div>
                        ) : null}
                        <Link href="/supplier/production" className="rounded-2xl border border-ruah-100 px-4 py-3 text-sm font-semibold text-ruah-700 hover:bg-ruah-50">
                          Abrir fila de producao
                        </Link>
                      </aside>
                    </div>
                  </article>
                );
              })}
            </section>
          )
        ) : null}
      </div>
    </main>
  );
}
