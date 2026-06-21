'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Box,
  Clock3,
  Megaphone,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { Header } from '@/components/navigation/Header';
import { getJson, HttpRequestError, postJson } from '@/lib/http-client';
import { useUser } from '@/context/UserContext';

type CampaignStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'closed' | 'rejected' | 'cancelled';
type GovernanceStatus = 'pending_review' | 'approved' | 'rejected';

interface CampaignDetailResponse {
  ok: true;
  campaign: {
    campaignId: string;
    organizationId: string;
    name: string;
    description: string;
    budget: number;
    progressivePriceRule: string;
    startsAt?: string;
    endsAt?: string;
    status: CampaignStatus;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    productCount: number;
  };
  governance: {
    reviewId: string;
    status: GovernanceStatus;
    createdAt: string;
    updatedAt: string;
    dueAt: string;
    requestedBy: string;
    approvedBy?: string;
    rejectedBy?: string;
    decisionReason: string | null;
    historyCount: number;
  } | null;
  governanceHistory: Array<{
    reviewId: string;
    status: GovernanceStatus;
    createdAt: string;
    updatedAt: string;
    dueAt: string;
    requestedBy: string;
    approvedBy?: string;
    rejectedBy?: string;
    decisionReason: string | null;
    historyCount: number;
  }>;
  timeline: Array<{
    type: string;
    label: string;
    occurredAt: string;
    actorId: string;
    actorRole: string;
    source: 'audit_log' | 'impact_review_store';
    previousStatus?: string;
    newStatus?: string;
    reason?: string;
    reviewId?: string;
  }>;
  linkedProducts: Array<{
    campaignProductId: string;
    catalogItemId: string;
    linkedBy: string;
    createdAt: string;
    item: {
      catalogItemId: string;
      name: string;
      price: number;
      image: string;
      category?: string;
      segment?: string;
      publicationStatus: string;
    } | null;
  }>;
  readiness: {
    hasLinkedProducts: boolean;
    hasPendingImpactReview: boolean;
    latestImpactRejected: boolean;
    isPublicStorefrontLive: boolean;
    canSubmit: boolean;
    canActivate: boolean;
    canPause: boolean;
    canClose: boolean;
    blockers: Array<{
      code: string;
      message: string;
    }>;
  };
  attributionSummary: {
    campaignId: string;
    campaignName: string;
    campaignStatus: CampaignStatus | 'unknown';
    orderCount: number;
    commissionCount: number;
    pending: number;
    availableGross: number;
    latestOrderAt: string | null;
    orders: Array<{
      campaignId: string;
      orderId: string;
      orderItemId: string;
      commissionId: string;
      commissionStatus: string;
      commissionAmount: number;
      orderCreatedAt: string;
      orderPaidAt: string | null;
    }>;
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return 'Nao informado';
  return new Date(value).toLocaleString('pt-BR', { hour12: false });
}

function statusLabel(status: CampaignStatus) {
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

function governanceStatusLabel(status: GovernanceStatus) {
  switch (status) {
    case 'pending_review':
      return 'Impact review pendente';
    case 'approved':
      return 'Impact review aprovada';
    case 'rejected':
      return 'Impact review rejeitada';
    default:
      return status;
  }
}

function readinessActionLabel(label: string, active: boolean) {
  return (
    <span
      className={`rounded-2xl px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] ${
        active ? 'bg-emerald-100 text-emerald-800' : 'bg-ruah-100 text-ruah-500'
      }`}
    >
      {label}
    </span>
  );
}

function nextStepMessage(detail: CampaignDetailResponse, capabilities: {
  canSubmitCampaign: boolean;
  canActivateCampaign: boolean;
  canPauseCampaign: boolean;
  canCloseCampaign: boolean;
}) {
  if (detail.campaign.status === 'draft') {
    if (!detail.readiness.hasLinkedProducts) {
      return 'Vincule ao menos um CatalogItem publicado antes de submeter a campanha para revisao.';
    }
    if (capabilities.canSubmitCampaign) {
      return 'A campanha ja tem base minima. O proximo passo coerente e submeter para impact review.';
    }
    return 'A campanha esta pronta para submissao, mas a acao depende do owner ou de platform_admin.';
  }

  if (detail.campaign.status === 'rejected') {
    if (!detail.readiness.hasLinkedProducts) {
      return 'A ultima governanca rejeitou a campanha e a vitrine ainda esta incompleta. Corrija a base e reenvie.';
    }
    if (capabilities.canSubmitCampaign) {
      return 'Revise a devolutiva da governanca, ajuste a campanha e reenvie para nova revisao.';
    }
    return 'A campanha foi rejeitada. O reenvio depende do owner ou de platform_admin.';
  }

  if (detail.campaign.status === 'pending_review') {
    if (detail.readiness.hasPendingImpactReview) {
      return 'A campanha esta na fila de impact review. Agora o owner deve acompanhar a governanca, nao tentar contornar o bloqueio.';
    }
    if (capabilities.canActivateCampaign) {
      return 'A impact review ja passou. O proximo passo coerente e ativar a campanha na governanca final.';
    }
    return 'A campanha aguarda moderacao final depois da impact review.';
  }

  if (detail.campaign.status === 'active') {
    if (capabilities.canPauseCampaign) {
      return 'A campanha esta ativa e a vitrine publica ja vale no runtime. Pause antes de qualquer mudanca estrutural.';
    }
    if (capabilities.canCloseCampaign) {
      return 'A campanha esta ativa. O owner pode encerrar quando o ciclo comercial terminar.';
    }
    return 'A campanha esta ativa. Agora a disciplina e acompanhar vitrine, atribuicao e receita por campanha.';
  }

  if (detail.campaign.status === 'paused') {
    if (capabilities.canActivateCampaign) {
      return 'A campanha esta pausada. A governanca pode reativar quando o recorte estiver pronto para voltar ao ar.';
    }
    if (capabilities.canCloseCampaign) {
      return 'A campanha esta pausada. O owner pode encerrar se nao fizer sentido reativar.';
    }
    return 'A campanha esta pausada. O proximo passo depende de reativacao por governanca ou encerramento pelo owner.';
  }

  if (detail.campaign.status === 'closed') {
    return 'A campanha foi encerrada. Use esta pagina como memoria operacional e referencia de atribuicao.';
  }

  if (detail.campaign.status === 'cancelled') {
    return 'A campanha foi cancelada. Nao ha proxima acao operacional no runtime atual.';
  }

  return 'Sem proxima acao automatica definida para este estado.';
}

export default function CommunityCampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = React.use(params);
  const { userId, userRole } = useUser();
  const [detail, setDetail] = React.useState<CampaignDetailResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);
  const [runningAction, setRunningAction] = React.useState<'submit' | 'activate' | 'pause' | 'close' | null>(null);

  const loadDetail = React.useCallback(async () => {
    return getJson<CampaignDetailResponse>(`/api/campaigns/${encodeURIComponent(resolved.id)}`);
  }, [resolved.id]);

  React.useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      if (!active) return;
      loadDetail()
        .then((payload) => {
          if (!active) return;
          setDetail(payload);
        })
        .catch((err) => {
          if (!active) return;
          if (err instanceof HttpRequestError && err.status === 401) {
            setError('Sua sessao expirou. Entre novamente para abrir esta campanha.');
            return;
          }
          if (err instanceof HttpRequestError && err.status === 403) {
            setError('Esta campanha nao pertence ao seu escopo atual.');
            return;
          }
          if (err instanceof HttpRequestError && err.status === 404) {
            setError('Campanha nao encontrada.');
            return;
          }
          setError('Nao foi possivel carregar o detalhe operacional da campanha.');
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
  }, [loadDetail]);

  const refreshDetail = React.useCallback(async () => {
    const payload = await loadDetail();
    setDetail(payload);
    return payload;
  }, [loadDetail]);

  const isPlatformAdmin = userRole === 'platform_admin';
  const isCommunityOwner = detail ? userRole === 'community_manager' && detail.campaign.createdBy === userId : false;
  const canSubmitCampaign = Boolean(detail && detail.readiness.canSubmit && (isCommunityOwner || isPlatformAdmin));
  const canActivateCampaign = Boolean(detail && detail.readiness.canActivate && isPlatformAdmin);
  const canPauseCampaign = Boolean(detail && detail.readiness.canPause && isPlatformAdmin);
  const canCloseCampaign = Boolean(detail && detail.readiness.canClose && (isCommunityOwner || isPlatformAdmin));

  const handleCampaignAction = React.useCallback(
    async (action: 'submit' | 'activate' | 'pause' | 'close') => {
      const endpoint =
        action === 'submit'
          ? 'submit'
          : action === 'activate'
            ? 'approve'
            : action === 'pause'
              ? 'pause'
              : 'close';

      const successMessage =
        action === 'submit'
          ? 'Campanha reenviada para impact review.'
          : action === 'activate'
            ? 'Campanha ativada no runtime.'
            : action === 'pause'
              ? 'Campanha pausada na governanca.'
              : 'Campanha encerrada pelo owner.';

      setRunningAction(action);
      setError(null);
      setActionMessage(null);
      try {
        await postJson(`/api/campaigns/${encodeURIComponent(resolved.id)}/${endpoint}`, {});
        await refreshDetail();
        setActionMessage(successMessage);
      } catch (err) {
        if (err instanceof HttpRequestError && err.status === 403) {
          setError('Seu papel atual nao pode executar esta acao nesta campanha.');
        } else if (err instanceof HttpRequestError && err.status === 409) {
          setError('A campanha nao aceita esta transicao no estado atual.');
        } else if (err instanceof HttpRequestError && err.status === 401) {
          setError('Sua sessao expirou antes de concluir a acao.');
        } else {
          setError('Nao foi possivel executar a acao na campanha agora.');
        }
      } finally {
        setRunningAction(null);
      }
    },
    [refreshDetail, resolved.id]
  );

  return (
    <main className="min-h-screen bg-ruah-50 page-header-offset">
      <Header />

      <section className="section-space bg-white border-b border-ruah-100">
        <div className="section-container flex flex-col gap-4">
          <Link href="/community/campaigns" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-ruah-500">
            <ArrowLeft size={14} />
            Voltar para campanhas
          </Link>

          {loading ? <p className="text-sm text-ruah-500">Carregando memoria operacional...</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {actionMessage ? <p className="text-sm text-emerald-700">{actionMessage}</p> : null}

          {detail ? (
            <>
              <span className="tech-label text-accent-gold">Campaign detail</span>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">{detail.campaign.campaignId}</p>
                  <h1 className="mt-3 ur-type-display-md italic uppercase text-ruah-950">{detail.campaign.name}</h1>
                  <p className="mt-3 max-w-2xl text-sm text-ruah-500">{detail.campaign.description}</p>
                </div>
                <div className="rounded-3xl border border-ruah-100 bg-ruah-50 px-5 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Status runtime</p>
                  <p className="mt-2 text-sm font-semibold uppercase text-ruah-950">{statusLabel(detail.campaign.status)}</p>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </section>

      {detail ? (
        <section className="section-space">
          <div className="section-container flex flex-col gap-6">
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <article className="rounded-3xl border border-ruah-100 bg-white p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Organizacao</p>
                <p className="mt-3 text-sm font-semibold text-ruah-950">{detail.campaign.organizationId}</p>
              </article>
              <article className="rounded-3xl border border-ruah-100 bg-white p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Budget</p>
                <p className="mt-3 text-sm font-semibold text-ruah-950">{formatCurrency(detail.campaign.budget)}</p>
              </article>
              <article className="rounded-3xl border border-ruah-100 bg-white p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Regra progressiva</p>
                <p className="mt-3 text-sm font-semibold text-ruah-950">{detail.campaign.progressivePriceRule}</p>
              </article>
              <article className="rounded-3xl border border-ruah-100 bg-white p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Vitrine vinculada</p>
                <p className="mt-3 text-sm font-semibold text-ruah-950">{detail.campaign.productCount} item(ns)</p>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-3xl border border-ruah-100 bg-white p-6">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className="text-accent-gold" />
                  <h2 className="text-lg font-semibold text-ruah-950">Readiness e proximos movimentos</h2>
                </div>

                <div className="mt-4 rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Proximo passo coerente</p>
                  <p className="mt-2 text-sm text-ruah-950">
                    {nextStepMessage(detail, { canSubmitCampaign, canActivateCampaign, canPauseCampaign, canCloseCampaign })}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {readinessActionLabel('Pode submeter', detail.readiness.canSubmit)}
                  {readinessActionLabel('Pode ativar', detail.readiness.canActivate)}
                  {readinessActionLabel('Pode pausar', detail.readiness.canPause)}
                  {readinessActionLabel('Pode encerrar', detail.readiness.canClose)}
                </div>

                {(canSubmitCampaign || canActivateCampaign || canPauseCampaign || canCloseCampaign || detail.readiness.isPublicStorefrontLive) ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {canSubmitCampaign ? (
                      <button
                        type="button"
                        onClick={() => void handleCampaignAction('submit')}
                        disabled={runningAction !== null}
                        className="rounded-2xl bg-ruah-950 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                      >
                        {runningAction === 'submit' ? 'Enviando...' : 'Submeter para revisao'}
                      </button>
                    ) : null}

                    {canActivateCampaign ? (
                      <button
                        type="button"
                        onClick={() => void handleCampaignAction('activate')}
                        disabled={runningAction !== null}
                        className="rounded-2xl bg-ruah-950 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                      >
                        {runningAction === 'activate' ? 'Ativando...' : detail.campaign.status === 'paused' ? 'Reativar campanha' : 'Ativar campanha'}
                      </button>
                    ) : null}

                    {canPauseCampaign ? (
                      <button
                        type="button"
                        onClick={() => void handleCampaignAction('pause')}
                        disabled={runningAction !== null}
                        className="rounded-2xl border border-ruah-200 bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-950 disabled:opacity-50"
                      >
                        {runningAction === 'pause' ? 'Pausando...' : 'Pausar campanha'}
                      </button>
                    ) : null}

                    {canCloseCampaign ? (
                      <button
                        type="button"
                        onClick={() => void handleCampaignAction('close')}
                        disabled={runningAction !== null}
                        className="rounded-2xl border border-ruah-200 bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-950 disabled:opacity-50"
                      >
                        {runningAction === 'close' ? 'Encerrando...' : 'Encerrar campanha'}
                      </button>
                    ) : null}

                    {detail.readiness.isPublicStorefrontLive ? (
                      <Link
                        href={`/c/${detail.campaign.campaignId}`}
                        className="rounded-2xl border border-ruah-200 bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-950"
                      >
                        Abrir rota publica
                      </Link>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Impacto</p>
                    <p className="mt-2 text-sm text-ruah-950">
                      {detail.readiness.hasPendingImpactReview
                        ? 'Existe review pendente'
                        : detail.readiness.latestImpactRejected
                          ? 'Ultima review rejeitada'
                          : 'Sem bloqueio de impacto pendente'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Vitrine publica</p>
                    <p className="mt-2 text-sm text-ruah-950">
                      {detail.readiness.isPublicStorefrontLive ? 'Ativa em /c/' : 'Ainda offline'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {detail.readiness.blockers.length === 0 ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                      Sem bloqueios operacionais registrados agora.
                    </div>
                  ) : (
                    detail.readiness.blockers.map((blocker) => (
                      <div key={blocker.code} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-700">{blocker.code}</p>
                        <p className="mt-2 text-sm text-amber-950">{blocker.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <aside className="rounded-3xl border border-ruah-100 bg-white p-6">
                <div className="flex items-center gap-2">
                  <Megaphone size={18} className="text-accent-gold" />
                  <h2 className="text-lg font-semibold text-ruah-950">Governanca atual</h2>
                </div>

                {detail.governance ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Review</p>
                      <p className="mt-2 text-sm font-semibold text-ruah-950">{detail.governance.reviewId}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500">
                        {governanceStatusLabel(detail.governance.status)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4 text-sm text-ruah-700">
                      <p>
                        <strong className="text-ruah-950">Criada:</strong> {formatDate(detail.governance.createdAt)}
                      </p>
                      <p className="mt-2">
                        <strong className="text-ruah-950">Atualizada:</strong> {formatDate(detail.governance.updatedAt)}
                      </p>
                      <p className="mt-2">
                        <strong className="text-ruah-950">SLA:</strong> {formatDate(detail.governance.dueAt)}
                      </p>
                    </div>
                    {detail.governance.decisionReason ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                        {detail.governance.decisionReason}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-ruah-500">Sem governanca registrada para esta campanha.</p>
                )}
              </aside>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
              <article className="rounded-3xl border border-ruah-100 bg-white p-6">
                <div className="flex items-center gap-2">
                  <Box size={18} className="text-accent-gold" />
                  <h2 className="text-lg font-semibold text-ruah-950">Itens vinculados</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {detail.linkedProducts.length === 0 ? (
                    <p className="text-sm text-ruah-500">Nenhum item publicado foi vinculado a esta campanha ainda.</p>
                  ) : (
                    detail.linkedProducts.map((link) => (
                      <div key={link.campaignProductId} className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-gold">{link.catalogItemId}</p>
                        <p className="mt-2 text-sm font-semibold text-ruah-950">{link.item?.name ?? 'Item indisponivel'}</p>
                        <p className="mt-2 text-xs text-ruah-500">
                          {link.item
                            ? `${formatCurrency(link.item.price)} | ${link.item.publicationStatus}`
                            : 'O item saiu do catalogo publicado.'}
                        </p>
                        <p className="mt-2 text-xs text-ruah-500">
                          Vinculado por {link.linkedBy} em {formatDate(link.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="rounded-3xl border border-ruah-100 bg-white p-6">
                <div className="flex items-center gap-2">
                  <Wallet size={18} className="text-accent-gold" />
                  <h2 className="text-lg font-semibold text-ruah-950">Atribuicao de receita</h2>
                </div>
                <p className="mt-3 text-sm text-ruah-500">
                  Repasse solicitado continua no nivel da comunidade. Esta leitura por campanha mostra atribuicao, nao saque isolado.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Pedidos</p>
                    <p className="mt-2 text-sm font-semibold text-ruah-950">{detail.attributionSummary.orderCount}</p>
                  </div>
                  <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Comissoes</p>
                    <p className="mt-2 text-sm font-semibold text-ruah-950">{detail.attributionSummary.commissionCount}</p>
                  </div>
                  <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Pendente</p>
                    <p className="mt-2 text-sm font-semibold text-ruah-950">{formatCurrency(detail.attributionSummary.pending)}</p>
                  </div>
                  <div className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Disponivel bruto</p>
                    <p className="mt-2 text-sm font-semibold text-ruah-950">{formatCurrency(detail.attributionSummary.availableGross)}</p>
                  </div>
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500">
                  Ultimo pedido: {formatDate(detail.attributionSummary.latestOrderAt)}
                </p>

                <div className="mt-4 space-y-3">
                  {detail.attributionSummary.orders.length === 0 ? (
                    <p className="text-sm text-ruah-500">Sem pedidos atribuidos a esta campanha por enquanto.</p>
                  ) : (
                    detail.attributionSummary.orders.slice(0, 5).map((order) => (
                      <div key={order.commissionId} className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-gold">{order.orderId}</p>
                        <p className="mt-2 text-sm font-semibold text-ruah-950">{formatCurrency(order.commissionAmount)}</p>
                        <p className="mt-2 text-xs text-ruah-500">
                          Status {order.commissionStatus} | pedido em {formatDate(order.orderPaidAt ?? order.orderCreatedAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <article className="rounded-3xl border border-ruah-100 bg-white p-6">
                <div className="flex items-center gap-2">
                  <Clock3 size={18} className="text-accent-gold" />
                  <h2 className="text-lg font-semibold text-ruah-950">Timeline operacional</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {detail.timeline.length === 0 ? (
                    <p className="text-sm text-ruah-500">Sem eventos registrados nesta campanha.</p>
                  ) : (
                    detail.timeline.map((event) => (
                      <div key={`${event.type}-${event.occurredAt}-${event.reviewId ?? event.actorId}`} className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-gold">{event.label}</p>
                            <p className="mt-2 text-sm text-ruah-700">
                              {event.actorId} ({event.actorRole})
                            </p>
                          </div>
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500">{formatDate(event.occurredAt)}</p>
                        </div>
                        {event.reason ? <p className="mt-3 text-sm text-ruah-900">{event.reason}</p> : null}
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="rounded-3xl border border-ruah-100 bg-white p-6">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-accent-gold" />
                  <h2 className="text-lg font-semibold text-ruah-950">Historico de governanca</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {detail.governanceHistory.length === 0 ? (
                    <p className="text-sm text-ruah-500">Sem historico de governanca nesta campanha.</p>
                  ) : (
                    detail.governanceHistory.map((review) => (
                      <div key={review.reviewId} className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-gold">{review.reviewId}</p>
                        <p className="mt-2 text-sm font-semibold text-ruah-950">{governanceStatusLabel(review.status)}</p>
                        <p className="mt-2 text-xs text-ruah-500">Atualizado em {formatDate(review.updatedAt)}</p>
                        {review.decisionReason ? <p className="mt-3 text-sm text-ruah-900">{review.decisionReason}</p> : null}
                      </div>
                    ))
                  )}
                </div>
              </article>
            </section>

            <section className="rounded-3xl border border-ruah-100 bg-white p-6">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle size={18} className="mt-0.5 text-amber-700" />
                <p className="text-sm text-amber-950">
                  Esta pagina concentra memoria operacional, historico de decisao e atribuicao de receita. A acao de payout continua agregada no ledger da comunidade.
                </p>
              </div>
            </section>
          </div>
        </section>
      ) : null}
    </main>
  );
}
