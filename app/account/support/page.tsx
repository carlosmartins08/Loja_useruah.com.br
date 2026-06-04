'use client';

import React from 'react';
import { LifeBuoy, MessageSquarePlus } from 'lucide-react';
import { getJson, HttpRequestError, postJson } from '@/lib/http-client';

interface SupportOrder {
  orderId: string;
  createdAt: string;
}

interface SupportTicket {
  ticketId: string;
  orderId: string;
  subject: string;
  status: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    actorRole: string;
    message: string;
    createdAt: string;
  }>;
}

export default function AccountSupportPage() {
  const [orders, setOrders] = React.useState<SupportOrder[]>([]);
  const [tickets, setTickets] = React.useState<SupportTicket[]>([]);
  const [orderId, setOrderId] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const [ordersPayload, ticketsPayload] = await Promise.all([
      getJson<{ ok: true; orders: SupportOrder[] }>('/api/orders'),
      getJson<{ ok: true; tickets: SupportTicket[] }>('/api/tickets'),
    ]);
    setOrders(ordersPayload.orders);
    setTickets(ticketsPayload.tickets);
    setOrderId((current) => current || ordersPayload.orders[0]?.orderId || '');
  }, []);

  React.useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      if (!active) return;
      setError(null);
      load()
        .catch((err) => {
          if (!active) return;
          if (err instanceof HttpRequestError && err.status === 401) {
            setError('Sua sessao expirou. Entre novamente para falar com o suporte.');
            return;
          }
          setError('Nao foi possivel carregar seu suporte agora.');
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await postJson('/api/tickets', { orderId, subject, message });
      setSubject('');
      setMessage('');
      setSuccess('Chamado aberto com sucesso.');
      await load();
    } catch (err) {
      if (err instanceof HttpRequestError && err.status === 422) {
        setError('Preencha pedido, assunto e mensagem para abrir o chamado.');
      } else if (err instanceof HttpRequestError && err.status === 403) {
        setError('Voce nao pode abrir suporte para este pedido.');
      } else {
        setError('Nao foi possivel abrir o chamado agora.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-[2rem] border border-ruah-100 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <LifeBuoy size={18} className="text-accent-gold" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-400">Suporte do cliente</p>
            <h1 className="mt-2 text-3xl font-serif italic text-ruah-950">Fale sobre um pedido</h1>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-sm text-ruah-500">
          Na Fase 1 o suporte e simples: voce abre um chamado vinculado ao pedido e acompanha a resposta por aqui.
        </p>
      </section>

      {loading ? <p className="text-sm text-ruah-500">Carregando suporte...</p> : null}
      {error ? <p className="text-sm text-ruah-500">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}

      {!loading && !error ? (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-ruah-100 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <MessageSquarePlus size={18} className="text-accent-gold" />
              <h2 className="text-lg font-bold text-ruah-950">Abrir chamado</h2>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-400">Pedido</span>
                <select
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                  className="w-full rounded-2xl border border-ruah-200 px-4 py-3 text-sm text-ruah-950"
                >
                  {orders.length === 0 ? <option value="">Nenhum pedido disponivel</option> : null}
                  {orders.map((order) => (
                    <option key={order.orderId} value={order.orderId}>
                      {order.orderId} • {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-400">Assunto</span>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="w-full rounded-2xl border border-ruah-200 px-4 py-3 text-sm text-ruah-950"
                  placeholder="Ex.: duvida sobre envio"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-400">Mensagem</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="min-h-32 w-full rounded-2xl border border-ruah-200 px-4 py-3 text-sm text-ruah-950"
                  placeholder="Descreva o que aconteceu com o seu pedido."
                />
              </label>

              <button
                type="submit"
                disabled={submitting || orders.length === 0}
                className="rounded-2xl bg-ruah-950 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
              >
                {submitting ? 'Abrindo chamado...' : 'Abrir chamado'}
              </button>
            </div>
          </form>

          <div className="rounded-[2rem] border border-ruah-100 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-bold text-ruah-950">Chamados recentes</h2>
            <div className="mt-6 space-y-4">
              {tickets.length === 0 ? (
                <p className="text-sm text-ruah-500">Nenhum chamado aberto ainda.</p>
              ) : (
                tickets.map((ticket) => (
                  <div key={ticket.ticketId} className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-ruah-950">{ticket.subject}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ruah-400">
                          {ticket.orderId} • {ticket.status}
                        </p>
                      </div>
                      <p className="text-[10px] text-ruah-400">
                        {new Date(ticket.updatedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {ticket.messages[0] ? (
                      <p className="mt-3 text-sm text-ruah-600">{ticket.messages[ticket.messages.length - 1]?.message}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
