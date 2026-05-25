'use client';

import React from 'react';
import Link from 'next/link';
import { Search, MessageSquare, LifeBuoy, AlertCircle, ArrowRight } from 'lucide-react';
import { getJson, HttpRequestError } from '@/lib/http-client';

interface TicketSummary {
  ticketId: string;
  orderId: string;
  customerId: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSupportPage() {
  const [orderId, setOrderId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tickets, setTickets] = React.useState<TicketSummary[]>([]);

  const handleLookup = async () => {
    if (!orderId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getJson<{
        ok: boolean;
        tickets: TicketSummary[];
      }>(`/api/tickets?orderId=${encodeURIComponent(orderId.trim())}`);
      setTickets(response.tickets);
    } catch (err) {
      if (err instanceof HttpRequestError && (err.status === 401 || err.status === 403)) {
        setError('Sessão inválida para atendimento. Faça login novamente.');
        window.location.href = '/login';
      } else {
        setError('Não foi possível consultar os tickets agora.');
      }
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className='min-h-screen bg-ruah-25 p-6 md:p-10'>
      <div className='max-w-5xl mx-auto flex flex-col gap-8'>
        <header className='bg-white border border-ruah-100 rounded-3xl p-8'>
          <div className='flex items-center gap-3 mb-3'>
            <LifeBuoy size={20} className='text-accent-gold' />
            <span className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>Operação de Suporte</span>
          </div>
          <h1 className='text-3xl font-serif italic uppercase text-ruah-950'>Central de Atendimento</h1>
          <p className='text-xs font-bold uppercase tracking-widest text-ruah-400 mt-3'>
            Consulta operacional por pedido para atendimento rápido.
          </p>
        </header>

        <section className='bg-white border border-ruah-100 rounded-3xl p-8 flex flex-col gap-6'>
          <form
            className='flex flex-col md:flex-row gap-4'
            onSubmit={(event) => {
              event.preventDefault();
              handleLookup();
            }}
          >
            <div className='relative flex-1'>
              <Search size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-ruah-300' />
              <input
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                placeholder='Informe o orderId (ex: ORD-...)'
                aria-label='Buscar ticket por order id'
                className='w-full pl-10 pr-4 py-3 border border-ruah-100 rounded-xl text-sm outline-none focus:border-accent-gold'
              />
            </div>
            <button
              type='submit'
              disabled={loading}
              aria-busy={loading}
              className='px-6 py-3 bg-ruah-950 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent-gold transition-all'
            >
              Buscar
            </button>
          </form>

          {loading && <p className='text-xs text-ruah-400 uppercase tracking-widest'>Consultando...</p>}
          {error && (
            <div className='flex items-center gap-2 text-red-600 text-xs font-bold uppercase tracking-widest'>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className='flex flex-col gap-3'>
              {tickets.length === 0 ? (
                <p className='text-xs text-ruah-400 uppercase tracking-widest'>Nenhum ticket encontrado para o pedido informado.</p>
              ) : (
                tickets.map((ticket) => (
                  <div key={ticket.ticketId} className='border border-ruah-100 rounded-2xl p-5 flex flex-col gap-3'>
                    <div className='flex items-center gap-2 text-accent-gold text-xs font-semibold uppercase tracking-[0.1em]'>
                      <MessageSquare size={14} />
                      {ticket.ticketId}
                    </div>
                    <p className='text-sm font-semibold text-ruah-950'>{ticket.subject}</p>
                    <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>
                      Pedido: {ticket.orderId} | Cliente: {ticket.customerId} | Status: {ticket.status}
                    </p>
                    <Link
                      href={`/admin/support/${encodeURIComponent(ticket.orderId)}`}
                      className='inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold hover:opacity-80 transition-opacity'
                    >
                      Abrir pedido e contexto operacional
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}


