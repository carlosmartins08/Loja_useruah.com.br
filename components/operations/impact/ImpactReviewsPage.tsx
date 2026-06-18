'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Clock3, Megaphone, Play, ShieldAlert, XCircle } from 'lucide-react';
import { useUser } from '@/context/UserContext';

type ImpactReviewStatus = 'pending_review' | 'approved' | 'rejected';
type ImpactReviewPriority = 'high' | 'normal';
type ImpactReviewScope = 'all' | 'campaigns';
type ImpactReviewFilter = 'pending' | 'overdue' | 'history' | 'all';
type CampaignStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'closed' | 'rejected' | 'cancelled';

interface CampaignImpactContext {
  campaignId: string;
  name: string;
  organizationId: string;
  status: CampaignStatus;
  progressivePriceRule: string;
  startsAt?: string;
  endsAt?: string;
  createdBy: string;
  updatedAt: string;
  productCount: number;
}

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
  campaign?: CampaignImpactContext | null;
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

interface CampaignDetailPayload {
  ok: true;
  campaign: {
    campaignId: string;
    name: string;
    status: CampaignStatus;
    progressivePriceRule: string;
    productCount: number;
  };
  governance: {
    reviewId: string;
    status: ImpactReviewStatus;
    updatedAt: string;
    decisionReason: string | null;
  } | null;
  timeline: Array<{
    type: string;
    label: string;
    occurredAt: string;
    reason?: string;
    reviewId?: string;
  }>;
  linkedProducts: Array<{
    campaignProductId: string;
    catalogItemId: string;
    item: {
      name: string;
      publicationStatus: string;
    } | null;
  }>;
  readiness: {
    blockers: Array<{
      code: string;
      message: string;
    }>;
  };
  attributionSummary: {
    orderCount: number;
    commissionCount: number;
    pending: number;
    availableGross: number;
    latestOrderAt: string | null;
  };
}

function parseScope(input: string | null): ImpactReviewScope {
  return input === 'campaigns' ? 'campaigns' : 'all';
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', { hour12: false });
}

function isOverdue(value: string) {
  return new Date(value).getTime() < Date.now();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function riskTag(fields: string[]) {
  if (fields.includes('priceTable') || fields.includes('payoutDecision') || fields.includes('campaignBudget') || fields.includes('refundDecision') || fields.includes('chargebackDecision')) return 'Financeiro Alto';
  if (fields.includes('freightRule') || fields.includes('productionLeadTime')) return 'Operacional Alto';
  if (fields.includes('progressivePriceRule')) return 'Comercial Alto';
  return 'Revisao';
}

function entityLabel(entityType: ImpactReview['entityType']) {
  switch (entityType) {
    case 'CatalogItem':
      return 'CatalogItem';
    case 'Payout':
      return 'Payout';
    case 'Campaign':
      return 'Campanha';
    case 'Refund':
      return 'Refund';
    case 'Chargeback':
      return 'Chargeback';
    default:
      return entityType;
  }
}

function campaignStatusLabel(status: CampaignStatus) {
  switch (status) {
    case 'draft':
      return 'Rascunho';
    case 'pending_review':
      return 'Aguardando moderacao final';
    case 'active':
      return 'Ativa';
    case 'paused':
      return 'Pausada';
    case 'closed':
      return 'Encerrada';
    case 'rejected':
      return 'Rejeitada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
}

function reviewHeadline(row: ImpactReview) {
  if (row.entityType === 'Campaign') {
    return row.campaign?.name ? `Campanha: ${row.campaign.name}` : `Campanha: ${row.entityId}`;
  }

  return `${entityLabel(row.entityType)}: ${row.entityId}`;
}

function reviewScopeIntro(scope: ImpactReviewScope) {
  if (scope === 'campaigns') {
    return 'Fila propria de decisao e historico de campanha, sem misturar payout, chargeback ou catalogo.';
  }

  return 'Revisao critica de preco, frete, prazo de producao, campanha e payout com SLA de 2h.';
}

function emptyMessage(scope: ImpactReviewScope, filter: ImpactReviewFilter) {
  if (scope === 'campaigns' && filter === 'history') return 'Sem historico de decisoes de campanha neste recorte.';
  if (scope === 'campaigns') return 'Sem campanhas nesta fila agora.';
  if (filter === 'history') return 'Sem historico de decisoes para este filtro.';
  return 'Sem revisoes para este filtro.';
}

export default function ImpactReviewsPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSessionReady, userRole } = useUser();
  const isAdminContext = pathname.startsWith('/admin');
  const isSupportContext = pathname.startsWith('/support');
  const isCurationContext = pathname.startsWith('/curation');
  const canDecideImpact = userRole === 'platform_admin';
  const canModerateCampaign = userRole === 'platform_admin' || userRole === 'curator';
  const contextLabel = isAdminContext
    ? 'Admin / Governance'
    : isSupportContext
      ? 'Support / Governance'
      : isCurationContext
        ? 'Curation / Governance'
        : 'Governance';
  const backHref = isAdminContext ? '/admin' : isSupportContext ? '/support' : isCurationContext ? '/curation' : '/';
  const backLabel = isAdminContext ? 'Voltar ao hub' : 'Voltar ao ambiente';
  const [scope, setScope] = React.useState<ImpactReviewScope>(() => parseScope(searchParams.get('scope')));
  const [reviews, setReviews] = React.useState<ImpactReview[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState<string | null>(null);
  const [decisionReason, setDecisionReason] = React.useState<Record<string, string>>({});
  const [filter, setFilter] = React.useState<ImpactReviewFilter>('pending');
  const [runningImpactDecision, setRunningImpactDecision] = React.useState<Record<string, boolean>>({});
  const [runningCampaignAction, setRunningCampaignAction] = React.useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = React.useState<ImpactNotificationLog[]>([]);
  const [expandedCampaignId, setExpandedCampaignId] = React.useState<string | null>(null);
  const [campaignDetailById, setCampaignDetailById] = React.useState<Record<string, CampaignDetailPayload | null>>({});
  const [campaignDetailLoading, setCampaignDetailLoading] = React.useState<Record<string, boolean>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    setMessage(null);

    const params = new URLSearchParams();
    if (scope === 'campaigns') {
      params.set('entityType', 'Campaign');
    }
    if (filter === 'pending' || filter === 'overdue') {
      params.set('status', 'pending_review');
    }
    if (filter === 'overdue') {
      params.set('onlyOverdue', 'true');
    }

    const query = params.size > 0 ? `/api/admin/impact-reviews?${params.toString()}` : '/api/admin/impact-reviews';
    const response = await fetch(query, { cache: 'no-store' });
    if (!response.ok) {
      setMessage(response.status === 403 ? 'Acesso negado: este papel nao participa desta superficie.' : 'Falha ao carregar fila.');
      setLoading(false);
      return;
    }

    const data = (await response.json()) as { ok: true; reviews: ImpactReview[] };
    let nextReviews = data.reviews.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (filter === 'history') {
      nextReviews = nextReviews.filter((row) => row.status !== 'pending_review');
    }
    setReviews(nextReviews);

    const notificationsRes = await fetch('/api/admin/impact-reviews/notifications?limit=8', { cache: 'no-store' });
    if (notificationsRes.ok) {
      const notificationsData = (await notificationsRes.json()) as { ok: true; logs: ImpactNotificationLog[] };
      setNotifications(notificationsData.logs);
    }
    setLoading(false);
  }, [filter, scope]);

  React.useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      if (!active) return;
      void load();
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [load]);

  const approveImpact = async (reviewId: string) => {
    setRunningImpactDecision((prev) => ({ ...prev, [reviewId]: true }));
    setMessage(null);
    const response = await fetch(`/api/admin/impact-reviews/${encodeURIComponent(reviewId)}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: decisionReason[reviewId] || undefined }),
    });
    setRunningImpactDecision((prev) => ({ ...prev, [reviewId]: false }));
    if (!response.ok) {
      setMessage('Falha ao aprovar impact review.');
      return;
    }
    setMessage('Impact review aprovada. Se a campanha seguir em pending_review, a moderacao final ja pode ativar.');
    await load();
  };

  const rejectImpact = async (reviewId: string) => {
    const reason = (decisionReason[reviewId] || '').trim();
    if (!reason) {
      setMessage('Rejeicao exige justificativa.');
      return;
    }

    setRunningImpactDecision((prev) => ({ ...prev, [reviewId]: true }));
    setMessage(null);
    const response = await fetch(`/api/admin/impact-reviews/${encodeURIComponent(reviewId)}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    setRunningImpactDecision((prev) => ({ ...prev, [reviewId]: false }));
    if (!response.ok) {
      setMessage('Falha ao rejeitar impact review.');
      return;
    }
    setMessage('Impact review rejeitada. A campanha volta para rejected com devolutiva visivel ao owner.');
    await load();
  };

  const runCampaignAction = async (campaignId: string, action: 'activate' | 'reactivate' | 'pause') => {
    const endpoint = action === 'pause' ? 'pause' : 'approve';
    const nextMessage =
      action === 'pause'
        ? 'Campanha pausada na superficie de governanca.'
        : action === 'reactivate'
          ? 'Campanha reativada na superficie de governanca.'
          : 'Campanha ativada na superficie de governanca.';

    setRunningCampaignAction((prev) => ({ ...prev, [`${campaignId}:${action}`]: true }));
    setMessage(null);
    const response = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    setRunningCampaignAction((prev) => ({ ...prev, [`${campaignId}:${action}`]: false }));
    if (!response.ok) {
      setMessage(action === 'pause' ? 'Falha ao pausar campanha.' : 'Falha ao mudar status final da campanha.');
      return;
    }
    setMessage(nextMessage);
    await load();
  };

  const toggleCampaignContext = async (campaignId: string) => {
    if (expandedCampaignId === campaignId) {
      setExpandedCampaignId(null);
      return;
    }

    setExpandedCampaignId(campaignId);
    if (campaignDetailById[campaignId] || campaignDetailLoading[campaignId]) {
      return;
    }

    setCampaignDetailLoading((prev) => ({ ...prev, [campaignId]: true }));
    try {
      const response = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}`, { cache: 'no-store' });
      if (!response.ok) {
        setMessage('Falha ao carregar contexto operacional da campanha.');
        return;
      }

      const data = (await response.json()) as CampaignDetailPayload;
      setCampaignDetailById((prev) => ({ ...prev, [campaignId]: data }));
    } finally {
      setCampaignDetailLoading((prev) => ({ ...prev, [campaignId]: false }));
    }
  };

  const pendingCount = reviews.filter((row) => row.status === 'pending_review').length;
  const overdueCount = reviews.filter((row) => row.status === 'pending_review' && isOverdue(row.dueAt)).length;
  const decidedCount = reviews.filter((row) => row.status !== 'pending_review').length;

  return (
    <main className='min-h-screen bg-ruah-25 p-6 md:p-10'>
      <div className='max-w-6xl mx-auto flex flex-col gap-6'>
        <header className='bg-white rounded-3xl border border-ruah-100 p-8'>
          <div className='flex items-center justify-between gap-4 flex-wrap'>
            <div className='max-w-3xl'>
              <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>{contextLabel}</p>
              <h1 className='text-3xl font-serif italic uppercase text-ruah-950'>
                {scope === 'campaigns' ? 'Campaign Governance Desk' : 'Impact Review Hub'}
              </h1>
              <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500 mt-3'>{reviewScopeIntro(scope)}</p>
            </div>
            <Link href={backHref} className='px-4 py-2 rounded-xl border border-ruah-200 text-xs font-semibold uppercase tracking-[0.1em]'>
              {backLabel}
            </Link>
          </div>

          <div className='mt-4 flex flex-wrap gap-2'>
            <button
              type='button'
              onClick={() => setScope('campaigns')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-2 ${scope === 'campaigns' ? 'bg-ruah-950 text-white' : 'bg-ruah-50 text-ruah-600'}`}
            >
              <Megaphone size={14} />
              Campanhas
            </button>
            <button
              type='button'
              onClick={() => setScope('all')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-[0.1em] ${scope === 'all' ? 'bg-ruah-950 text-white' : 'bg-ruah-50 text-ruah-600'}`}
            >
              Fila geral
            </button>
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
            <p className='text-xs font-semibold uppercase tracking-[0.1em] text-amber-500'>Historico decidido</p>
            <p className='text-3xl font-black text-amber-600'>{decidedCount}</p>
          </div>
        </section>

        <section className='bg-white rounded-3xl border border-ruah-100 p-6 flex flex-col gap-4'>
          <div className='flex items-center justify-between gap-3 flex-wrap'>
            <div className='flex items-center gap-2 flex-wrap'>
              <button type='button' onClick={() => setFilter('pending')} className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-[0.1em] ${filter === 'pending' ? 'bg-ruah-950 text-white' : 'bg-ruah-50 text-ruah-600'}`}>
                Fila
              </button>
              <button type='button' onClick={() => setFilter('overdue')} className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-[0.1em] ${filter === 'overdue' ? 'bg-red-600 text-white' : 'bg-ruah-50 text-ruah-600'}`}>
                Atrasados
              </button>
              <button type='button' onClick={() => setFilter('history')} className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-[0.1em] ${filter === 'history' ? 'bg-amber-600 text-white' : 'bg-ruah-50 text-ruah-600'}`}>
                Historico
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

          {isSessionReady && !canDecideImpact ? (
            <div className='rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold uppercase tracking-[0.1em] text-amber-700 inline-flex items-center gap-2'>
              <ShieldAlert size={14} />
              Leitura cross-role ativa. Impact review segue restrita a platform_admin.
            </div>
          ) : null}

          {loading ? (
            <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>Carregando fila...</p>
          ) : reviews.length === 0 ? (
            <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>{emptyMessage(scope, filter)}</p>
          ) : (
            <div className='flex flex-col gap-4'>
              {reviews.map((row) => {
                const overdue = row.status === 'pending_review' && isOverdue(row.dueAt);
                const runningDecision = Boolean(runningImpactDecision[row.reviewId]);
                const canActivateCampaign = Boolean(row.entityType === 'Campaign' && row.campaign && row.status === 'approved' && row.campaign.status === 'pending_review' && canModerateCampaign);
                const canReactivateCampaign = Boolean(row.entityType === 'Campaign' && row.campaign && row.campaign.status === 'paused' && canModerateCampaign);
                const canPauseCampaign = Boolean(row.entityType === 'Campaign' && row.campaign && row.campaign.status === 'active' && canModerateCampaign);
                const detail = campaignDetailById[row.entityId];
                const isExpanded = expandedCampaignId === row.entityId;

                return (
                  <article key={row.reviewId} className={`rounded-2xl border p-5 ${overdue ? 'border-red-300 bg-red-50/40' : 'border-ruah-100 bg-white'}`}>
                    <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4'>
                      <div className='flex flex-col gap-2 min-w-0'>
                        <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>{row.reviewId}</p>
                        <h2 className='text-lg font-black text-ruah-950'>{reviewHeadline(row)}</h2>
                        <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500'>
                          Tipo: {entityLabel(row.entityType)} | Risco: {riskTag(row.sensitiveFields)} | Prioridade: {row.priority}
                        </p>
                        <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500'>
                          Campos: {row.sensitiveFields.join(', ')}
                        </p>
                        <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500'>
                          Solicitado por: {row.requestedBy}
                        </p>
                      </div>

                      <div className='flex flex-col gap-2 min-w-[280px]'>
                        <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500 inline-flex items-center gap-2'>
                          <Clock3 size={14} /> Criado: {formatDate(row.createdAt)}
                        </p>
                        <p className={`text-xs font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-2 ${overdue ? 'text-red-600' : 'text-ruah-500'}`}>
                          <ShieldAlert size={14} /> SLA (2h): {formatDate(row.dueAt)} {overdue ? '(atrasado)' : ''}
                        </p>
                        <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500'>Status review: {row.status}</p>
                      </div>
                    </div>

                    {row.entityType === 'Campaign' && row.campaign ? (
                      <>
                        <div className='mt-4 grid grid-cols-1 md:grid-cols-4 gap-3'>
                          <div className='rounded-2xl border border-ruah-100 bg-ruah-50/70 p-4'>
                            <p className='text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400'>Organizacao</p>
                            <p className='mt-2 text-sm font-semibold text-ruah-950'>{row.campaign.organizationId}</p>
                          </div>
                          <div className='rounded-2xl border border-ruah-100 bg-ruah-50/70 p-4'>
                            <p className='text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400'>Status runtime</p>
                            <p className='mt-2 text-sm font-semibold text-ruah-950'>{campaignStatusLabel(row.campaign.status)}</p>
                          </div>
                          <div className='rounded-2xl border border-ruah-100 bg-ruah-50/70 p-4'>
                            <p className='text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400'>Vitrine</p>
                            <p className='mt-2 text-sm font-semibold text-ruah-950'>{row.campaign.productCount} item(ns)</p>
                          </div>
                          <div className='rounded-2xl border border-ruah-100 bg-ruah-50/70 p-4'>
                            <p className='text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400'>Regra</p>
                            <p className='mt-2 text-sm font-semibold text-ruah-950'>{row.campaign.progressivePriceRule}</p>
                          </div>
                        </div>

                        <div className='mt-4 flex flex-wrap items-center gap-2'>
                          <button
                            type='button'
                            onClick={() => void toggleCampaignContext(row.entityId)}
                            className='px-3 py-2 rounded-xl border border-ruah-200 text-xs font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-2'
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {isExpanded ? 'Fechar contexto' : 'Abrir contexto completo'}
                          </button>
                        </div>

                        {isExpanded ? (
                          <div className='mt-4 rounded-2xl border border-ruah-100 bg-ruah-50/70 p-4'>
                            {campaignDetailLoading[row.entityId] ? (
                              <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>Carregando contexto...</p>
                            ) : detail ? (
                              <div className='grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-4'>
                                <div className='space-y-4'>
                                  <div className='rounded-2xl border border-ruah-100 bg-white p-4'>
                                    <p className='text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400'>Bloqueios atuais</p>
                                    {detail.readiness.blockers.length === 0 ? (
                                      <p className='mt-2 text-sm text-emerald-700'>Sem bloqueios agora.</p>
                                    ) : (
                                      <div className='mt-3 space-y-2'>
                                        {detail.readiness.blockers.map((blocker) => (
                                          <div key={blocker.code} className='rounded-xl border border-amber-200 bg-amber-50 p-3'>
                                            <p className='text-[11px] font-bold uppercase tracking-[0.12em] text-amber-700'>{blocker.code}</p>
                                            <p className='mt-1 text-sm text-amber-950'>{blocker.message}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className='rounded-2xl border border-ruah-100 bg-white p-4'>
                                    <p className='text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400'>Timeline resumida</p>
                                    <div className='mt-3 space-y-2'>
                                      {detail.timeline.slice(0, 5).map((event) => (
                                        <div key={`${event.type}-${event.occurredAt}-${event.reviewId ?? 'timeline'}`} className='rounded-xl border border-ruah-100 bg-ruah-50 p-3'>
                                          <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-950'>{event.label}</p>
                                          <p className='mt-1 text-xs text-ruah-500'>{formatDate(event.occurredAt)}</p>
                                          {event.reason ? <p className='mt-2 text-sm text-ruah-700'>{event.reason}</p> : null}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className='space-y-4'>
                                  <div className='rounded-2xl border border-ruah-100 bg-white p-4'>
                                    <p className='text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400'>Justificativa mais recente</p>
                                    <p className='mt-2 text-sm text-ruah-900'>
                                      {detail.governance?.decisionReason ?? 'Sem justificativa registrada ate aqui.'}
                                    </p>
                                  </div>

                                  <div className='rounded-2xl border border-ruah-100 bg-white p-4'>
                                    <p className='text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400'>Itens vinculados</p>
                                    <div className='mt-3 space-y-2'>
                                      {detail.linkedProducts.length === 0 ? (
                                        <p className='text-sm text-ruah-500'>Nenhum item vinculado.</p>
                                      ) : (
                                        detail.linkedProducts.slice(0, 4).map((link) => (
                                          <div key={link.campaignProductId} className='rounded-xl border border-ruah-100 bg-ruah-50 p-3'>
                                            <p className='text-xs font-semibold text-ruah-950'>{link.item?.name ?? link.catalogItemId}</p>
                                            <p className='mt-1 text-xs text-ruah-500'>{link.item?.publicationStatus ?? 'item indisponivel'}</p>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>

                                  <div className='rounded-2xl border border-ruah-100 bg-white p-4'>
                                    <p className='text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400'>Atribuicao</p>
                                    <p className='mt-2 text-sm text-ruah-900'>
                                      {detail.attributionSummary.orderCount} pedido(s) | {detail.attributionSummary.commissionCount} comissao(oes)
                                    </p>
                                    <p className='mt-2 text-sm text-ruah-900'>
                                      Disponivel bruto {formatCurrency(detail.attributionSummary.availableGross)} | Pendente {formatCurrency(detail.attributionSummary.pending)}
                                    </p>
                                    <p className='mt-2 text-xs text-ruah-500'>
                                      Ultimo pedido {detail.attributionSummary.latestOrderAt ? formatDate(detail.attributionSummary.latestOrderAt) : 'Nao informado'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>Sem detalhe adicional carregado.</p>
                            )}
                          </div>
                        ) : null}
                      </>
                    ) : null}

                    {row.status === 'pending_review' && canDecideImpact ? (
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
                            onClick={() => void approveImpact(row.reviewId)}
                            disabled={runningDecision}
                            className='px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-2 disabled:opacity-50'
                          >
                            <CheckCircle2 size={14} />
                            Aprovar impact review
                          </button>
                          <button
                            type='button'
                            onClick={() => void rejectImpact(row.reviewId)}
                            disabled={runningDecision}
                            className='px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-2 disabled:opacity-50'
                          >
                            <XCircle size={14} />
                            Rejeitar impact review
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {(canActivateCampaign || canReactivateCampaign || canPauseCampaign) ? (
                      <div className='mt-4 flex flex-wrap gap-2'>
                        {canActivateCampaign ? (
                          <button
                            type='button'
                            onClick={() => void runCampaignAction(row.entityId, 'activate')}
                            disabled={Boolean(runningCampaignAction[`${row.entityId}:activate`])}
                            className='px-3 py-2 rounded-xl bg-ruah-950 text-white text-xs font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-2 disabled:opacity-50'
                          >
                            <Play size={14} />
                            {runningCampaignAction[`${row.entityId}:activate`] ? 'Ativando...' : 'Ativar campanha'}
                          </button>
                        ) : null}

                        {canReactivateCampaign ? (
                          <button
                            type='button'
                            onClick={() => void runCampaignAction(row.entityId, 'reactivate')}
                            disabled={Boolean(runningCampaignAction[`${row.entityId}:reactivate`])}
                            className='px-3 py-2 rounded-xl bg-ruah-950 text-white text-xs font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-2 disabled:opacity-50'
                          >
                            <Play size={14} />
                            {runningCampaignAction[`${row.entityId}:reactivate`] ? 'Reativando...' : 'Reativar campanha'}
                          </button>
                        ) : null}

                        {canPauseCampaign ? (
                          <button
                            type='button'
                            onClick={() => void runCampaignAction(row.entityId, 'pause')}
                            disabled={Boolean(runningCampaignAction[`${row.entityId}:pause`])}
                            className='px-3 py-2 rounded-xl border border-ruah-200 text-ruah-950 text-xs font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-2 disabled:opacity-50'
                          >
                            <ShieldAlert size={14} />
                            {runningCampaignAction[`${row.entityId}:pause`] ? 'Pausando...' : 'Pausar campanha'}
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    {row.status === 'pending_review' && !canDecideImpact ? (
                      <div className='mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-amber-700'>
                        Leitura liberada para este papel. A decisao de impact review segue com platform_admin.
                      </div>
                    ) : null}

                    {row.status !== 'pending_review' ? (
                      <div className='mt-4 rounded-2xl border border-ruah-100 bg-ruah-50/70 p-4'>
                        <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500'>
                          Decisao registrada em {formatDate(row.updatedAt)}
                        </p>
                        <p className='mt-2 text-sm text-ruah-900'>{row.decisionReason ?? 'Sem justificativa registrada.'}</p>
                      </div>
                    ) : null}
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
