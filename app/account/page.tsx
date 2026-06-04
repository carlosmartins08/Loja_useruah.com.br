'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, MessageSquare, Package } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { getJson, HttpRequestError } from '@/lib/http-client';
import { humanizeOrderStatus, mapToUiStatus } from '@/lib/order-ui';

interface DashboardOrderItem {
  orderId: string;
  totalAmount: number;
  createdAt: string;
  status: string;
  productionStatus: string | null;
  shipmentStatus: string | null;
  items: Array<{
    catalogItemId: string;
    productName: string;
    productImage: string;
    variantLabel: string;
    quantity: number;
  }>;
}

interface DashboardTicket {
  ticketId: string;
  orderId: string;
  subject: string;
  status: string;
  updatedAt: string;
}

function SummaryCard({
  href,
  label,
  value,
  helper,
  icon: Icon,
}: {
  href: string;
  label: string;
  value: string;
  helper: string;
  icon: typeof Package;
}) {
  return (
    <Link
      href={href}
      className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-400">{label}</p>
          <p className="mt-3 text-3xl font-serif italic text-ruah-950">{value}</p>
          <p className="mt-3 text-sm text-ruah-500">{helper}</p>
        </div>
        <div className="rounded-2xl bg-ruah-50 p-3 text-accent-gold">
          <Icon size={18} />
        </div>
      </div>
    </Link>
  );
}

export default function AccountPage() {
  const { userName, registrationStatus } = useUser();
  const [orders, setOrders] = React.useState<DashboardOrderItem[]>([]);
  const [tickets, setTickets] = React.useState<DashboardTicket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      if (!active) return;
      setError(null);
      Promise.all([
        getJson<{ ok: true; orders: DashboardOrderItem[] }>('/api/orders'),
        getJson<{ ok: true; tickets: DashboardTicket[] }>('/api/tickets'),
      ])
        .then(([ordersPayload, ticketsPayload]) => {
          if (!active) return;
          setOrders(ordersPayload.orders);
          setTickets(ticketsPayload.tickets);
        })
        .catch((err) => {
          if (!active) return;
          if (err instanceof HttpRequestError && err.status === 401) {
            setError('Sua sessao expirou. Entre novamente para ver sua conta.');
            return;
          }
          setError('Nao foi possivel carregar o resumo da sua conta.');
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
  }, []);

  const latestOrder = orders[0] ?? null;
  const activeOrders = orders.filter((order) => mapToUiStatus(order) !== 'entregue').length;
  const openTickets = tickets.filter((ticket) => ticket.status !== 'resolved').length;

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-[2.5rem] border border-ruah-100 bg-white p-8 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent-gold">Fase 1</span>
        <h1 className="mt-3 text-4xl font-serif italic uppercase text-ruah-950">Minha conta</h1>
        <p className="mt-4 max-w-2xl text-sm text-ruah-500">
          Oi, {userName}. Aqui voce acompanha pedidos, organiza enderecos e resolve suporte sem sair do fluxo da compra.
        </p>
        {registrationStatus === 'incomplete' ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Seu cadastro ainda esta incompleto. Finalize seus dados para evitar bloqueios no checkout e no suporte.
          </div>
        ) : null}
      </section>

      {loading ? <p className="text-sm text-ruah-500">Carregando resumo da conta...</p> : null}
      {error ? <p className="text-sm text-ruah-500">{error}</p> : null}

      {!loading && !error ? (
        <>
          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <SummaryCard
              href="/account/orders"
              label="Pedidos ativos"
              value={String(activeOrders)}
              helper="Pedidos que ainda exigem acompanhamento."
              icon={Package}
            />
            <SummaryCard
              href="/account/addresses"
              label="Enderecos"
              value="Revisar"
              helper="Confira seus dados de entrega antes de finalizar a compra."
              icon={MapPin}
            />
            <SummaryCard
              href="/account/support"
              label="Suporte aberto"
              value={String(openTickets)}
              helper="Tickets em andamento vinculados aos seus pedidos."
              icon={MessageSquare}
            />
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[2rem] border border-ruah-100 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-400">Ultimo pedido</p>
                  <h2 className="mt-2 text-2xl font-serif italic text-ruah-950">
                    {latestOrder ? latestOrder.orderId : 'Nenhum pedido ainda'}
                  </h2>
                </div>
                <Link
                  href="/account/orders"
                  className="inline-flex items-center gap-2 rounded-xl border border-ruah-200 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-ruah-700"
                >
                  Ver todos <ArrowRight size={14} />
                </Link>
              </div>

              {latestOrder ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ruah-400">Status atual</p>
                    <p className="mt-2 text-lg font-semibold uppercase text-ruah-950">
                      {humanizeOrderStatus(latestOrder.status)}
                    </p>
                    <p className="mt-3 text-sm text-ruah-500">
                      Criado em {new Date(latestOrder.createdAt).toLocaleDateString('pt-BR')} • Total R${' '}
                      {latestOrder.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {latestOrder.items.slice(0, 2).map((item) => (
                      <div
                        key={`${latestOrder.orderId}-${item.catalogItemId}-${item.variantLabel}`}
                        className="rounded-2xl border border-ruah-100 bg-white p-4"
                      >
                        <p className="text-sm font-semibold text-ruah-950">{item.productName}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-ruah-500">
                          {item.variantLabel} • Qtd {item.quantity}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-ruah-100 bg-ruah-50 p-5 text-sm text-ruah-500">
                  Voce ainda nao fez nenhum pedido. Explore a loja e encontre seu primeiro produto.
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-ruah-100 bg-white p-8 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-400">Atalhos da Fase 1</p>
              <div className="mt-6 space-y-3">
                <Link href="/shop" className="flex items-center justify-between rounded-2xl border border-ruah-100 p-4 text-sm font-semibold text-ruah-950">
                  Voltar para a loja <ArrowRight size={14} />
                </Link>
                <Link href="/account/orders" className="flex items-center justify-between rounded-2xl border border-ruah-100 p-4 text-sm font-semibold text-ruah-950">
                  Acompanhar meus pedidos <ArrowRight size={14} />
                </Link>
                <Link href="/account/addresses" className="flex items-center justify-between rounded-2xl border border-ruah-100 p-4 text-sm font-semibold text-ruah-950">
                  Revisar enderecos <ArrowRight size={14} />
                </Link>
                <Link href="/account/support" className="flex items-center justify-between rounded-2xl border border-ruah-100 p-4 text-sm font-semibold text-ruah-950">
                  Abrir suporte <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
