'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, CircleDollarSign, Clock3, Wallet } from 'lucide-react';
import { getJson, HttpRequestError, postJson } from '@/lib/http-client';

interface OwnerLedgerResponse {
  ok: boolean;
  ownerId: string;
  ownerRole: 'artist' | 'community_manager';
  balances: {
    pending: number;
    availableGross: number;
    requested: number;
    availableToWithdraw: number;
  };
  commissions: Array<{
    commissionId: string;
    orderId: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  payouts: Array<{
    payoutId: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

interface CampaignRevenueResponse {
  ok: boolean;
  ownerId: string;
  ownerRole: 'community_manager';
  campaigns: Array<{
    campaignId: string;
    campaignName: string;
    campaignStatus: string;
    orderCount: number;
    commissionCount: number;
    pending: number;
    availableGross: number;
    latestOrderAt: string | null;
  }>;
}

type OwnerFinanceWorkspaceProps = {
  workspaceLabel: string;
  title: string;
  description: string;
  forbiddenMessage: string;
  loadErrorMessage: string;
  campaignBreakdown?: {
    title: string;
    description: string;
    emptyMessage: string;
    loadErrorMessage: string;
  };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function OwnerFinanceWorkspace({
  workspaceLabel,
  title,
  description,
  forbiddenMessage,
  loadErrorMessage,
  campaignBreakdown,
}: OwnerFinanceWorkspaceProps) {
  const [ledger, setLedger] = React.useState<OwnerLedgerResponse | null>(null);
  const [campaignRevenue, setCampaignRevenue] = React.useState<CampaignRevenueResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [campaignRevenueError, setCampaignRevenueError] = React.useState<string | null>(null);
  const [requesting, setRequesting] = React.useState(false);

  const refreshLedger = React.useCallback(async () => {
    const refreshed = await getJson<OwnerLedgerResponse>('/api/commissions/me');
    setLedger(refreshed);
  }, []);

  const refreshCampaignRevenue = React.useCallback(async () => {
    if (!campaignBreakdown) return;
    const refreshed = await getJson<CampaignRevenueResponse>('/api/commissions/me/campaigns');
    setCampaignRevenueError(null);
    setCampaignRevenue(refreshed);
  }, [campaignBreakdown]);

  React.useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      if (!active) return;
      refreshLedger()
        .catch((err) => {
          if (!active) return;
          if (err instanceof HttpRequestError && err.status === 403) {
            setError(forbiddenMessage);
            return;
          }
          setError(loadErrorMessage);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [forbiddenMessage, loadErrorMessage, refreshLedger]);

  React.useEffect(() => {
    if (!campaignBreakdown) return;

    let active = true;
    const timeoutId = window.setTimeout(() => {
      if (!active) return;
      refreshCampaignRevenue().catch((err) => {
        if (!active) return;
        if (err instanceof HttpRequestError && err.status === 403) {
          setCampaignRevenueError(forbiddenMessage);
          return;
        }
        setCampaignRevenueError(campaignBreakdown.loadErrorMessage);
      });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [campaignBreakdown, forbiddenMessage, refreshCampaignRevenue]);

  const requestPayout = async () => {
    if (!ledger || ledger.balances.availableToWithdraw <= 0) return;
    setRequesting(true);
    setError(null);
    try {
      await postJson(
        '/api/payouts',
        { amount: ledger.balances.availableToWithdraw, currency: 'BRL' },
        { headers: { 'x-idempotency-key': `owner-payout-${Date.now()}` } }
      );
      await refreshLedger();
    } catch (err) {
      if (err instanceof HttpRequestError && err.status === 409) {
        setError('Nao existe saldo liquido suficiente para solicitar payout agora.');
      } else {
        setError('Falha ao solicitar payout.');
      }
    } finally {
      setRequesting(false);
    }
  };

  return (
    <main className="min-h-screen bg-ruah-25 p-6 md:p-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-ruah-100 bg-white p-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent-gold">{workspaceLabel}</p>
          <h1 className="mt-3 text-3xl font-serif italic text-ruah-950">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-ruah-500">{description}</p>
        </header>

        {loading ? <p className="text-sm text-ruah-500">Carregando ledger...</p> : null}
        {error ? <p className="text-sm text-ruah-500">{error}</p> : null}

        {!loading && !error && ledger ? (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <article className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-accent-gold">
                  <Clock3 size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Pendente</span>
                </div>
                <p className="mt-4 text-2xl font-black text-ruah-950">{formatCurrency(ledger.balances.pending)}</p>
              </article>
              <article className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-accent-gold">
                  <CircleDollarSign size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Disponivel bruto</span>
                </div>
                <p className="mt-4 text-2xl font-black text-ruah-950">{formatCurrency(ledger.balances.availableGross)}</p>
              </article>
              <article className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-accent-gold">
                  <Wallet size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Em solicitacao</span>
                </div>
                <p className="mt-4 text-2xl font-black text-ruah-950">{formatCurrency(ledger.balances.requested)}</p>
              </article>
              <article className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-accent-gold">
                  <ArrowUpRight size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Saque liquido</span>
                </div>
                <p className="mt-4 text-2xl font-black text-ruah-950">{formatCurrency(ledger.balances.availableToWithdraw)}</p>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_0.9fr]">
              <article className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-ruah-950">Ledger de comissoes</h2>
                  <button
                    type="button"
                    onClick={() => void requestPayout()}
                    disabled={requesting || ledger.balances.availableToWithdraw <= 0}
                    className="rounded-2xl bg-ruah-950 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                  >
                    {requesting ? 'Solicitando...' : 'Solicitar payout total'}
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {ledger.commissions.length === 0 ? (
                    <p className="text-sm text-ruah-500">Nenhuma comissao registrada ainda.</p>
                  ) : (
                    ledger.commissions.map((commission) => (
                      <div key={commission.commissionId} className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-gold">{commission.orderId}</p>
                            <p className="mt-1 text-sm font-semibold text-ruah-950">{commission.status}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-ruah-950">{formatCurrency(commission.amount)}</p>
                            <p className="text-xs text-ruah-500">{new Date(commission.createdAt).toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <aside className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-ruah-950">Historico de payout</h2>
                <div className="mt-4 space-y-3">
                  {ledger.payouts.length === 0 ? (
                    <p className="text-sm text-ruah-500">Nenhuma solicitacao de payout registrada.</p>
                  ) : (
                    ledger.payouts.map((payout) => (
                      <div key={payout.payoutId} className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-gold">{payout.payoutId}</p>
                        <p className="mt-2 text-sm font-semibold uppercase text-ruah-950">{payout.status}</p>
                        <p className="mt-2 text-sm font-black text-ruah-950">{formatCurrency(payout.amount)}</p>
                        <p className="mt-1 text-xs text-ruah-500">{new Date(payout.createdAt).toLocaleString('pt-BR')}</p>
                      </div>
                    ))
                  )}
                </div>
              </aside>
            </section>

            {campaignBreakdown ? (
              <section className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-ruah-950">{campaignBreakdown.title}</h2>
                <p className="mt-3 max-w-3xl text-sm text-ruah-500">{campaignBreakdown.description}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500">
                  Repasse solicitado continua no nivel da comunidade. Esta leitura por campanha mostra atribuicao, nao saque isolado por campanha.
                </p>

                {campaignRevenueError ? <p className="mt-4 text-sm text-ruah-500">{campaignRevenueError}</p> : null}

                <div className="mt-5 space-y-3">
                  {campaignRevenue && campaignRevenue.campaigns.length > 0 ? (
                    campaignRevenue.campaigns.map((campaign) => (
                      <Link
                        key={campaign.campaignId}
                        href={`/community/campaigns/${campaign.campaignId}`}
                        className="block rounded-2xl border border-ruah-100 bg-ruah-50 p-4 transition hover:border-accent-gold"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-gold">{campaign.campaignId}</p>
                            <p className="mt-2 text-sm font-semibold text-ruah-950">{campaign.campaignName}</p>
                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500">
                              {campaign.campaignStatus} | {campaign.orderCount} pedido(s) | {campaign.commissionCount} comissao(oes)
                            </p>
                          </div>
                          <div className="text-left md:text-right">
                            <p className="text-sm font-black text-ruah-950">{formatCurrency(campaign.availableGross)}</p>
                            <p className="mt-1 text-xs text-ruah-500">Disponivel bruto</p>
                            <p className="mt-2 text-xs text-ruah-500">
                              Pendente {formatCurrency(campaign.pending)}
                            </p>
                            <p className="mt-2 text-xs text-ruah-500">
                              Ultimo pedido {campaign.latestOrderAt ? new Date(campaign.latestOrderAt).toLocaleString('pt-BR') : 'Nao informado'}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : campaignRevenue && !campaignRevenueError ? (
                    <p className="text-sm text-ruah-500">{campaignBreakdown.emptyMessage}</p>
                  ) : null}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
