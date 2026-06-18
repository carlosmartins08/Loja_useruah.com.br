'use client';

import React from 'react';
import { PackageCheck, Truck } from 'lucide-react';
import { getJson, HttpRequestError } from '@/lib/http-client';

interface SupplierShipmentOrder {
  orderId: string;
  createdAt: string;
  status: string;
  productionStatus: string | null;
  shipmentStatus: string | null;
  items: Array<{
    orderItemId: string;
    productName: string;
    variantLabel: string;
    quantity: number;
  }>;
}

export default function SupplierShipmentsPage() {
  const [orders, setOrders] = React.useState<SupplierShipmentOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    getJson<{ ok: true; orders: SupplierShipmentOrder[] }>('/api/orders')
      .then((data) => {
        if (active) setOrders(data.orders.filter((order) => order.productionStatus || order.shipmentStatus || order.status !== 'draft'));
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof HttpRequestError && err.status === 403) {
          setError('Este ambiente depende do papel supplier para acompanhar expedicao.');
          return;
        }
        setError('Nao foi possivel carregar a fila de expedicao agora.');
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
          <h1 className="mt-3 text-3xl font-serif italic text-ruah-950">Expedicao e entregas</h1>
          <p className="mt-3 max-w-3xl text-sm text-ruah-500">
            Esta superficie substitui a antiga reapresentacao de trocas do cliente. Aqui o foco e despacho, envio e leitura de
            status operacional por pedido associado ao fornecedor.
          </p>
        </header>

        {loading ? <p className="text-sm text-ruah-500">Carregando expedicao...</p> : null}
        {error ? <p className="text-sm text-ruah-500">{error}</p> : null}

        {!loading && !error ? (
          orders.length === 0 ? (
            <section className="rounded-[2rem] border border-ruah-100 bg-white p-8 shadow-sm">
              <p className="text-sm text-ruah-500">Nenhum pedido com leitura de expedicao foi encontrado no momento.</p>
            </section>
          ) : (
            <section className="grid grid-cols-1 gap-4">
              {orders.map((order) => (
                <article key={order.orderId} className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-gold">{order.orderId}</p>
                      <h2 className="mt-2 text-xl font-serif italic text-ruah-950">Leitura de despacho por pedido</h2>
                      <p className="mt-2 text-sm text-ruah-500">Criado em {new Date(order.createdAt).toLocaleString('pt-BR')}.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                        <div className="flex items-center gap-2 text-ruah-500">
                          <PackageCheck size={16} />
                          <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Producao</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold uppercase text-ruah-950">{order.productionStatus ?? order.status}</p>
                      </div>
                      <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                        <div className="flex items-center gap-2 text-ruah-500">
                          <Truck size={16} />
                          <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Envio</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold uppercase text-ruah-950">{order.shipmentStatus ?? 'aguardando'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-ruah-100 bg-ruah-50 p-4 text-sm text-ruah-700">
                    {order.items.map((item) => (
                      <p key={item.orderItemId}>
                        <span className="font-semibold text-ruah-950">{item.productName}</span> | {item.variantLabel} | Qtd {item.quantity}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </section>
          )
        ) : null}
      </div>
    </main>
  );
}
