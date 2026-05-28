'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, LifeBuoy, Send } from 'lucide-react';
import { getJson, HttpRequestError, postJson } from '@/lib/http-client';
import { renderContentMessageByLayer } from '@/lib/content-messages';

interface SupportContextTicketMessage {
  at: string;
  actorId: string;
  actorRole: string;
  message: string;
}

interface SupportContextTicket {
  ticketId: string;
  orderId: string;
  customerId: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: SupportContextTicketMessage[];
}

interface SupportContextResponse {
  ok: boolean;
  order: {
    id: string;
    status: string;
    customerId: string;
    createdAt: string;
  };
  payment: { id: string; status: string } | null;
  production: { id: string; status: string } | null;
  shipment: { trackingCode: string; carrier: string } | null;
  tickets: SupportContextTicket[];
  impactReview: {
    hasRisk: boolean;
    pendingCount: number;
    overduePendingCount: number;
    rejectedCount: number;
    approvedCount: number;
    reviewsByCatalogItem: Array<{
      catalogItemId: string;
      latestReview: {
        reviewId: string;
        status: 'pending_review' | 'approved' | 'rejected';
        dueAt: string;
        priority: 'high' | 'normal';
        decisionReason: string | null;
      } | null;
    }>;
  };
}

export default function AdminSupportOrderContextPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = String(params?.orderId ?? '');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [context, setContext] = React.useState<SupportContextResponse | null>(null);
  const [replyByTicket, setReplyByTicket] = React.useState<Record<string, string>>({});
  const [replyingTicketId, setReplyingTicketId] = React.useState<string | null>(null);

  const suggestedReply = React.useMemo(() => {
    if (!context?.impactReview.hasRisk) return null;
    if (context.impactReview.rejectedCount > 0) {
      return (
        renderContentMessageByLayer('support_impact_rejected_macro', { layer: 'base' })?.body ??
        'A revisao operacional do item foi rejeitada e o time esta ajustando os parametros com seguranca.'
      );
    }
    if (context.impactReview.overduePendingCount > 0) {
      return (
        renderContentMessageByLayer('support_impact_overdue_macro', { layer: 'base' })?.body ??
        'Identificamos revisao operacional critica acima do SLA e o time administrativo ja atua em prioridade maxima.'
      );
    }
    return (
      renderContentMessageByLayer('support_impact_pending_macro', { layer: 'base' })?.body ??
      'Seu pedido esta em revisao operacional preventiva e seguiremos com atualizacao no proximo status.'
    );
  }, [context]);

  const loadContext = React.useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getJson<SupportContextResponse>(`/api/support/orders/${encodeURIComponent(orderId)}/context`);
      setContext(data);
    } catch (err) {
      if (err instanceof HttpRequestError && (err.status === 401 || err.status === 403)) {
        setError('Sessão inválida para atendimento. Atualize a página para renovar a sessão.');
        return;
      }
      if (err instanceof HttpRequestError && err.status === 404) {
        setError('Pedido nao encontrado para contexto operacional.');
      } else {
        setError('Falha ao carregar contexto operacional.');
      }
      setContext(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContext();
  }, [loadContext]);

  const handleReply = async (ticketId: string) => {
    const message = (replyByTicket[ticketId] ?? '').trim();
    if (!message) return;
    setReplyingTicketId(ticketId);
    setError(null);
    try {
      await postJson(`/api/tickets/${encodeURIComponent(ticketId)}/reply`, { message });
      setReplyByTicket((prev) => ({ ...prev, [ticketId]: '' }));
      await loadContext();
    } catch (err) {
      if (err instanceof HttpRequestError && (err.status === 401 || err.status === 403)) {
        setError('Sua sessão não permite responder ticket agora. Atualize a página para renovar a sessão.');
      } else {
        setError('Não foi possível registrar a resposta do ticket.');
      }
    } finally {
      setReplyingTicketId(null);
    }
  };

  return (
    <main className='min-h-screen bg-ruah-25 p-6 md:p-10'>
      <div className='max-w-6xl mx-auto flex flex-col gap-6'>
        <header className='bg-white border border-ruah-100 rounded-3xl p-8'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <LifeBuoy size={20} className='text-accent-gold' />
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>Atendimento operacional</p>
                <h1 className='text-2xl font-serif italic uppercase text-ruah-950'>Pedido {orderId}</h1>
              </div>
            </div>
            <Link
              href='/admin/support'
              className='inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500 hover:text-ruah-950 transition-colors'
            >
              <ArrowLeft size={14} />
              Voltar para busca
            </Link>
          </div>
        </header>

        {loading && <p className='text-xs text-ruah-400 uppercase tracking-widest'>Carregando contexto...</p>}

        {error && (
          <div className='bg-white border border-red-200 rounded-2xl p-4 flex items-center gap-2 text-red-700 text-xs font-semibold uppercase tracking-[0.1em]'>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {!loading && !error && context && (
          <>
            {context.impactReview.hasRisk && (
              <section className='bg-red-50 border border-red-200 rounded-3xl p-6 flex flex-col gap-3'>
                <p className='text-xs font-bold uppercase tracking-[0.1em] text-red-700'>
                  Risco de impacto no pedido: {context.impactReview.pendingCount} pendente(s), {context.impactReview.overduePendingCount} atrasada(s), {context.impactReview.rejectedCount} rejeitada(s)
                </p>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {context.impactReview.reviewsByCatalogItem.map((row) => (
                    <div key={row.catalogItemId} className='rounded-xl border border-red-200 bg-white p-3'>
                      <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500'>CatalogItem</p>
                      <p className='text-sm font-semibold text-ruah-950'>{row.catalogItemId}</p>
                      <p className='text-xs font-semibold uppercase tracking-[0.1em] text-red-700 mt-1'>
                        {row.latestReview ? `${row.latestReview.status} | prioridade ${row.latestReview.priority}` : 'sem review'}
                      </p>
                    </div>
                  ))}
                </div>
                <Link href='/admin/impact-reviews' className='text-xs font-semibold uppercase tracking-[0.1em] text-red-700 hover:opacity-80'>
                  Ir para fila critica de revisao
                </Link>
              </section>
            )}

            <section className='bg-white border border-ruah-100 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4'>
              <StatusCard label='Pedido' value={context.order.status} />
              <StatusCard label='Pagamento' value={context.payment?.status ?? 'n/a'} />
              <StatusCard label='Producao' value={context.production?.status ?? 'n/a'} />
              <StatusCard label='Envio' value={context.shipment?.trackingCode ? 'rastreavel' : 'n/a'} />
            </section>

            <section className='bg-white border border-ruah-100 rounded-3xl p-6 flex flex-col gap-4'>
              <h2 className='text-sm font-bold uppercase tracking-widest text-ruah-500'>Tickets do pedido</h2>
              {context.tickets.length === 0 ? (
                <p className='text-xs text-ruah-400 uppercase tracking-widest'>
                  Sem ticket para este pedido. Oriente o cliente a abrir chamado via conta.
                </p>
              ) : (
                context.tickets.map((ticket) => (
                  <article key={ticket.ticketId} className='border border-ruah-100 rounded-2xl p-4 flex flex-col gap-3'>
                    <div className='flex items-center justify-between gap-3'>
                      <div>
                        <p className='text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold'>{ticket.ticketId}</p>
                        <p className='text-sm font-semibold text-ruah-950'>{ticket.subject}</p>
                      </div>
                      <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500'>{ticket.status}</p>
                    </div>

                    <div className='flex flex-col gap-2'>
                      {ticket.messages.map((message, index) => (
                        <div key={`${ticket.ticketId}-${index}`} className='text-xs text-ruah-700 bg-ruah-25 rounded-xl p-3'>
                          <p className='font-semibold uppercase tracking-wide text-xs text-ruah-500'>
                            {message.actorRole} · {new Date(message.at).toLocaleString('pt-BR')}
                          </p>
                          <p className='mt-1'>{message.message}</p>
                        </div>
                      ))}
                    </div>

                    <div className='flex flex-col md:flex-row gap-3'>
                      <input
                        value={replyByTicket[ticket.ticketId] ?? ''}
                        onChange={(event) => setReplyByTicket((prev) => ({ ...prev, [ticket.ticketId]: event.target.value }))}
                        placeholder='Resposta operacional para o cliente'
                        className='flex-1 px-4 py-3 border border-ruah-100 rounded-xl text-sm outline-none focus:border-accent-gold'
                      />
                      {suggestedReply && (
                        <button
                          type='button'
                          onClick={() => setReplyByTicket((prev) => ({ ...prev, [ticket.ticketId]: suggestedReply }))}
                          className='px-4 py-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 text-xs font-semibold uppercase tracking-[0.1em] hover:bg-amber-100 transition-all'
                        >
                          Usar resposta padrão
                        </button>
                      )}
                      <button
                        onClick={() => handleReply(ticket.ticketId)}
                        disabled={replyingTicketId === ticket.ticketId}
                        className='px-5 py-3 rounded-xl bg-ruah-950 text-white text-xs font-semibold uppercase tracking-[0.1em] hover:bg-accent-gold transition-all disabled:opacity-50'
                      >
                        <span className='inline-flex items-center gap-2'>
                          <Send size={14} />
                          {replyingTicketId === ticket.ticketId ? 'Enviando...' : 'Responder'}
                        </span>
                      </button>
                    </div>
                  </article>
                ))
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className='border border-ruah-100 rounded-2xl p-4 flex items-center gap-3'>
      <CheckCircle2 size={16} className='text-accent-gold' />
      <div>
        <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>{label}</p>
        <p className='text-sm font-semibold text-ruah-950 uppercase'>{value}</p>
      </div>
    </div>
  );
}


