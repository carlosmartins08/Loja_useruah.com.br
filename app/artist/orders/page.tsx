'use client';

import React from 'react';
import Link from 'next/link';
import { Boxes, CircleDollarSign, Link2 } from 'lucide-react';
import { getJson, HttpRequestError } from '@/lib/http-client';

interface ArtistLedgerResponse {
  ok: boolean;
  ownerId: string;
  ownerRole: 'artist';
  commissions: Array<{
    commissionId: string;
    orderId: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

type OrderSummary = {
  orderId: string;
  totalAmount: number;
  statuses: string[];
  latestAt: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function ArtistOrdersPage() {
  const [orders, setOrders] = React.useState<OrderSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    getJson<ArtistLedgerResponse>('/api/commissions/me')
      .then((data) => {
        if (!active) return;
        const grouped = new Map<string, OrderSummary>();
        for (const commission of data.commissions) {
          const current = grouped.get(commission.orderId);
          const next: OrderSummary = current
            ? {
                ...current,
                totalAmount: Number((current.totalAmount + commission.amount).toFixed(2)),
                statuses: current.statuses.includes(commission.status) ? current.statuses : [...current.statuses, commission.status],
                latestAt: current.latestAt > commission.createdAt ? current.latestAt : commission.createdAt,
              }
            : {
                orderId: commission.orderId,
                totalAmount: commission.amount,
                statuses: [commission.status],
                latestAt: commission.createdAt,
              };
          grouped.set(commission.orderId, next);
        }

        setOrders(Array.from(grouped.values()).sort((a, b) => b.latestAt.localeCompare(a.latestAt)));
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof HttpRequestError && err.status === 403) {
          setError('Este ambiente depende do papel artist para consolidar pedidos vinculados.');
          return;
        }
        setError('Nao foi possivel carregar os pedidos vinculados agora.');
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
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent-gold">Ambiente artista</p>
          <h1 className="mt-3 text-3xl font-serif italic text-ruah-950">Pedidos vinculados</h1>
          <p className="mt-3 max-w-3xl text-sm text-ruah-500">
            Aqui a leitura nasce do ledger autoral. Em vez de espelhar a conta do cliente, o ambiente mostra quais pedidos
            realmente geraram comissao para sua operacao.
          </p>
        </header>

        {loading ? <p className="text-sm text-ruah-500">Carregando pedidos vinculados...</p> : null}
        {error ? <p className="text-sm text-ruah-500">{error}</p> : null}

        {!loading && !error ? (
          orders.length === 0 ? (
            <section className="rounded-[2rem] border border-ruah-100 bg-white p-8 shadow-sm">
              <p className="text-sm text-ruah-500">Ainda nao existem pedidos vinculados a comissoes para este perfil.</p>
            </section>
          ) : (
            <section className="grid grid-cols-1 gap-4">
              {orders.map((order) => (
                <article key={order.orderId} className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-gold">{order.orderId}</p>
                      <h2 className="mt-2 text-xl font-serif italic text-ruah-950">Pedido com impacto autoral confirmado</h2>
                      <p className="mt-2 text-sm text-ruah-500">
                        Ultimo reflexo no ledger em {new Date(order.latestAt).toLocaleString('pt-BR')}.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-ruah-100 bg-ruah-50 px-4 py-3 text-right">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Comissao agregada</p>
                      <p className="mt-2 text-xl font-black text-ruah-950">{formatCurrency(order.totalAmount)}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                      <div className="flex items-center gap-2 text-ruah-500">
                        <Boxes size={16} />
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Pedido</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-ruah-950">{order.orderId}</p>
                    </div>
                    <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                      <div className="flex items-center gap-2 text-ruah-500">
                        <CircleDollarSign size={16} />
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Estados de comissao</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold uppercase text-ruah-950">{order.statuses.join(' | ')}</p>
                    </div>
                    <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                      <div className="flex items-center gap-2 text-ruah-500">
                        <Link2 size={16} />
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Proxima acao</span>
                      </div>
                      <Link href="/artist/commissions" className="mt-2 inline-flex text-sm font-semibold text-accent-gold">
                        Ir para saldo e payout
                      </Link>
                    </div>
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
