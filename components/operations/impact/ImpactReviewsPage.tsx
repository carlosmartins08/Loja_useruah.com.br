'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Clock3, ShieldAlert, XCircle } from 'lucide-react';

type ImpactReviewStatus = 'pending_review' | 'approved' | 'rejected';
type ImpactReviewPriority = 'high' | 'normal';

interface ImpactReview {
  reviewId: string;
  domain: 'supplier_catalog' | 'payout_finance' | 'campaign_growth';
  entityType: 'CatalogItem' | 'Payout' | 'Campaign' | 'Refund' | 'Chargeback';
  entityId: string;
  sensitiveFields: string[];
  status: ImpactReviewStatus;
  priority: ImpactReviewPriority;
  createdAt: string;
  updatedAt: string;
  dueAt: string;
  requestedBy: string;
  approvedBy?: string;
  rejectedBy?: string;
  decisionReason?: string;
}

interface ImpactNotificationLog {
  id: string;
  provider: string;
  action: string;
  responsePayload?: {
    headline?: string;
    body?: string;
  };
  createdAt: string;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', { hour12: false });
}

function isOverdue(value: string) {
  return new Date(value).getTime() < Date.now();
}

function riskTag(fields: string[]) {
  if (fields.includes('priceTable') || fields.includes('payoutDecision') || fields.includes('campaignBudget') || fields.includes('refundDecision') || fields.includes('chargebackDecision')) return 'Financeiro Alto';
  if (fields.includes('freightRule') || fields.includes('productionLeadTime')) return 'Operacional Alto';
  if (fields.includes('progressivePriceRule')) return 'Comercial Alto';
  return 'Revisao';
}

export default function ImpactReviewsPage() {
  const pathname = usePathname();
  const isAdminContext = pathname.startsWith('/admin');
  const isSupportContext = pathname.startsWith('/support');
  const isCurationContext = pathname.startsWith('/curation');
  const contextLabel = isAdminContext
    ? 'Admin / Governance'
    : isSupportContext
      ? 'Support / Governance'
      : isCurationContext
        ? 'Curation / Governance'
        : 'Governance';
  const backHref = isAdminContext ? '/admin' : isSupportContext ? '/support' : isCurationContext ? '/curation' : '/';
  const backLabel = isAdminContext ? 'Voltar ao hub' : 'Voltar ao ambiente';
  const [reviews, setReviews] = React.useState<ImpactReview[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState<string | null>(null);
  const [decisionReason, setDecisionReason] = React.useState<Record<string, string>>({});
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'overdue'>('pending');
  const [running, setRunning] = React.useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = React.useState<ImpactNotificationLog[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setMessage(null);
    const query =
      filter === 'overdue'
        ? '/api/admin/impact-reviews?status=pending_review&onlyOverdue=true'
        : filter === 'pending'
          ? '/api/admin/impact-reviews?status=pending_review'
          : '/api/admin/impact-reviews';

    const response = await fetch(query, { cache: 'no-store' });
    if (!response.ok) {
      setMessage(response.status === 403 ? 'Acesso negado: apenas platform_admin aprova revisoes.' : 'Falha ao carregar fila.');
      setLoading(false);
      return;
    }
    const data = (await response.json()) as { ok: true; reviews: ImpactReview[] };
    setReviews(data.reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    const notificationsRes = await fetch('/api/admin/impact-reviews/notifications?limit=8', { cache: 'no-store' });
    if (notificationsRes.ok) {
      const notificationsData = (await notificationsRes.json()) as { ok: true; logs: ImpactNotificationLog[] };
      setNotifications(notificationsData.logs);
    }
    setLoading(false);
  }, [filter]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const approve = async (reviewId: string) => {
    setRunning((prev) => ({ ...prev, [reviewId]: true }));
    setMessage(null);
    const response = await fetch(`/api/admin/impact-reviews/${encodeURIComponent(reviewId)}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: decisionReason[reviewId] || undefined }),
    });
    setRunning((prev) => ({ ...prev, [reviewId]: false }));
    if (!response.ok) {
      setMessage('Falha ao aprovar revisao.');
      return;
    }
    setMessage('Revisao aprovada e aplicacao liberada.');
    await load();
  };

  const reject = async (reviewId: string) => {
    const reason = (decisionReason[reviewId] || '').trim();
    if (!reason) {
      setMessage('Rejeicao exige justificativa.');
      return;
    }
    setRunning((prev) => ({ ...prev, [reviewId]: true }));
    setMessage(null);
    const response = await fetch(`/api/admin/impact-reviews/${encodeURIComponent(reviewId)}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    setRunning((prev) => ({ ...prev, [reviewId]: false }));
    if (!response.ok) {
      setMessage('Falha ao rejeitar revisao.');
      return;
    }
    setMessage('Revisao rejeitada e item mantido bloqueado.');
    await load();
  };

  const pendingCount = reviews.filter((row) => row.status === 'pending_review').length;
  const overdueCount = reviews.filter((row) => row.status === 'pending_review' && isOverdue(row.dueAt)).length;
  const highCount = reviews.filter((row) => row.priority === 'high' && row.status === 'pending_review').length;

  return (
    <main className='min-h-screen bg-ruah-25 p-6 md:p-10'>
      <div className='max-w-6xl mx-auto flex flex-col gap-6'>
        <header className='bg-white rounded-3xl border border-ruah-100 p-8'>
          <div className='flex items-center justify-between gap-4 flex-wrap'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>{contextLabel}</p>
              <h1 className='text-3xl font-serif italic uppercase text-ruah-950'>Impact Review Hub</h1>
              <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500 mt-3'>
                Revisao critica de preco, frete, prazo de producao e payout com SLA de 2h.
              </p>
            </div>
            <Link href={backHref} className='px-4 py-2 rounded-xl border border-ruah-200 text-xs font-semibold uppercase tracking-[0.1em]'>
              {backLabel}
            </Link>
          </div>
        </header>

        <section className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-white rounded-2xl border border-ruah-100 p-5'>
            <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>Pendentes</p>
            <p className='text-3xl font-black text-ruah-950'>{pendingCount}</p>
          </div>
          <div className='bg-white rounded-2xl border border-red-200 p-5'>
            <p className='text-xs font-semibold uppercase tracking-[0.1em] text-red-500'>Atrasados SLA</p>
            <p className='text-3xl font-black text-red-600'>{overdueCount}</p>
          </div>
          <div className='bg-white rounded-2xl border border-amber-200 p-5'>
            <p className='text-xs font-semibold uppercase tracking-[0.1em] text-amber-500'>Prioridade Alta</p>
            <p className='text-3xl font-black text-amber-600'>{highCount}</p>
          </div>
        </section>

        <section className='bg-white rounded-3xl border border-ruah-100 p-6 flex flex-col gap-4'>
          <div className='flex items-center justify-between gap-3 flex-wrap'>
            <div className='flex items-center gap-2'>
              <button type='button' onClick={() => setFilter('pending')} className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-[0.1em] ${filter === 'pending' ? 'bg-ruah-950 text-white' : 'bg-ruah-50 text-ruah-600'}`}>
                Pendentes
              </button>
              <button type='button' onClick={() => setFilter('overdue')} className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-[0.1em] ${filter === 'overdue' ? 'bg-red-600 text-white' : 'bg-ruah-50 text-ruah-600'}`}>
                Atrasados
              </button>
              <button type='button' onClick={() => setFilter('all')} className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-[0.1em] ${filter === 'all' ? 'bg-ruah-700 text-white' : 'bg-ruah-50 text-ruah-600'}`}>
                Todos
              </button>
            </div>
            <button type='button' onClick={() => void load()} className='px-3 py-2 rounded-xl border border-ruah-200 text-xs font-semibold uppercase tracking-[0.1em]'>
              Atualizar
            </button>
          </div>

          {message && (
            <div className='rounded-xl border border-ruah-200 bg-ruah-50 p-3 text-xs font-semibold uppercase tracking-[0.1em] text-ruah-600 inline-flex items-center gap-2'>
              <AlertTriangle size={14} />
              {message}
            </div>
          )}

          {loading ? (
            <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>Carregando fila...</p>
          ) : reviews.length === 0 ? (
            <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>Sem revisoes para este filtro.</p>
          ) : (
            <div className='flex flex-col gap-4'>
              {reviews.map((row) => {
                const overdue = row.status === 'pending_review' && isOverdue(row.dueAt);
                const runningDecision = Boolean(running[row.reviewId]);
                return (
                  <article key={row.reviewId} className={`rounded-2xl border p-5 ${overdue ? 'border-red-300 bg-red-50/40' : 'border-ruah-100 bg-white'}`}>
                    <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4'>
                      <div className='flex flex-col gap-2'>
                        <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>{row.reviewId}</p>
                        <h2 className='text-lg font-black text-ruah-950'>CatalogItem: {row.entityId}</h2>
                        <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500'>
                          Risco: {riskTag(row.sensitiveFields)} | Prioridade: {row.priority}
                        </p>
                        <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500'>
                          Campos: {row.sensitiveFields.join(', ')}
                        </p>
                      </div>

                      <div className='flex flex-col gap-2 min-w-[280px]'>
                        <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500 inline-flex items-center gap-2'>
                          <Clock3 size={14} /> Criado: {formatDate(row.createdAt)}
                        </p>
                        <p className={`text-xs font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-2 ${overdue ? 'text-red-600' : 'text-ruah-500'}`}>
                          <ShieldAlert size={14} /> SLA (2h): {formatDate(row.dueAt)} {overdue ? '(atrasado)' : ''}
                        </p>
                        <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500'>Status: {row.status}</p>
                      </div>
                    </div>

                    {row.status === 'pending_review' ? (
                      <div className='mt-4 flex flex-col gap-3'>
                        <textarea
                          value={decisionReason[row.reviewId] ?? ''}
                          onChange={(event) => setDecisionReason((prev) => ({ ...prev, [row.reviewId]: event.target.value }))}
                          placeholder='Motivo da decisao (obrigatorio para rejeitar)'
                          className='min-h-20 rounded-xl border border-ruah-100 p-3 text-sm'
                        />
                        <div className='flex flex-wrap gap-2'>
                          <button
                            type='button'
                            onClick={() => void approve(row.reviewId)}
                            disabled={runningDecision}
                            className='px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-2 disabled:opacity-50'
                          >
                            <CheckCircle2 size={14} />
                            Aprovar
                          </button>
                          <button
                            type='button'
                            onClick={() => void reject(row.reviewId)}
                            disabled={runningDecision}
                            className='px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-2 disabled:opacity-50'
                          >
                            <XCircle size={14} />
                            Rejeitar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className='mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500'>
                        Decisao: {row.decisionReason ?? 'sem justificativa'}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className='bg-white rounded-3xl border border-ruah-100 p-6 flex flex-col gap-3'>
          <h2 className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500'>Comunicacao Operacional (trilha)</h2>
          {notifications.length === 0 ? (
            <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>Sem notificacoes registradas.</p>
          ) : (
            notifications.map((log) => (
              <article key={log.id} className='rounded-xl border border-ruah-100 p-3'>
                <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>{new Date(log.createdAt).toLocaleString('pt-BR')}</p>
                <p className='text-sm font-semibold text-ruah-950'>{log.responsePayload?.headline ?? log.action}</p>
                <p className='text-xs text-ruah-600'>{log.responsePayload?.body ?? 'Sem corpo de mensagem'}</p>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
