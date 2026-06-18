'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, Box, CalendarClock, Megaphone, PackagePlus, Send, ShieldAlert, Unlink2 } from 'lucide-react';
import { deleteJson, getJson, HttpRequestError, postJson } from '@/lib/http-client';
import { Header } from '@/components/navigation/Header';

type CampaignStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'closed' | 'rejected' | 'cancelled';

interface CampaignRecord {
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
}

interface CatalogItemOption {
  catalogItemId: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  segment?: string;
  tags: string[];
}

interface CampaignProductLink {
  campaignProductId: string;
  campaignId: string;
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
}

const INITIAL_FORM = {
  organizationId: 'org-community-main',
  name: '',
  description: '',
  budget: 0,
  progressivePriceRule: 'baseline',
  startsAt: '',
  endsAt: '',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

function statusLabel(status: CampaignStatus) {
  switch (status) {
    case 'draft':
      return 'Rascunho';
    case 'pending_review':
      return 'Em revisao';
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

function canManageProducts(status: CampaignStatus) {
  return status === 'draft' || status === 'rejected' || status === 'paused';
}

export default function CommunityCampaignsPage() {
  const [campaigns, setCampaigns] = React.useState<CampaignRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [actionByCampaign, setActionByCampaign] = React.useState<Record<string, boolean>>({});
  const [selectedCampaignId, setSelectedCampaignId] = React.useState<string | null>(null);
  const [campaignLinks, setCampaignLinks] = React.useState<CampaignProductLink[]>([]);
  const [campaignLinksLoading, setCampaignLinksLoading] = React.useState(false);
  const [catalogOptions, setCatalogOptions] = React.useState<CatalogItemOption[]>([]);
  const [catalogOptionsLoading, setCatalogOptionsLoading] = React.useState(false);
  const [selectedCatalogItemIdByCampaign, setSelectedCatalogItemIdByCampaign] = React.useState<Record<string, string>>({});
  const [form, setForm] = React.useState(INITIAL_FORM);

  const loadCampaigns = React.useCallback(async () => {
    const response = await getJson<{ ok: true; campaigns: CampaignRecord[] }>('/api/campaigns');
    setCampaigns(response.campaigns.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }, []);

  const loadCatalogOptions = React.useCallback(async () => {
    setCatalogOptionsLoading(true);
    try {
      const response = await getJson<{ ok: true; items: CatalogItemOption[] }>('/api/catalog-items');
      setCatalogOptions(response.items);
    } finally {
      setCatalogOptionsLoading(false);
    }
  }, []);

  const loadCampaignLinks = React.useCallback(async (campaignId: string) => {
    setCampaignLinksLoading(true);
    try {
      const response = await getJson<{ ok: true; links: CampaignProductLink[] }>(`/api/campaigns/${encodeURIComponent(campaignId)}/products`);
      setCampaignLinks(response.links);
    } finally {
      setCampaignLinksLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      if (!active) return;
      loadCampaigns()
        .catch((err) => {
          if (!active) return;
          if (err instanceof HttpRequestError && err.status === 401) {
            setError('Sessao obrigatoria para abrir a mesa de campanhas.');
            return;
          }
          if (err instanceof HttpRequestError && err.status === 403) {
            setError('Seu papel atual nao permite consultar a fila de campanhas.');
            return;
          }
          setError('Nao foi possivel carregar as campanhas agora.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [loadCampaigns]);

  const handleCreateCampaign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await postJson('/api/campaigns', {
        organizationId: form.organizationId.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        budget: Number(form.budget),
        progressivePriceRule: form.progressivePriceRule.trim(),
        startsAt: form.startsAt || undefined,
        endsAt: form.endsAt || undefined,
      });
      setForm(INITIAL_FORM);
      await loadCampaigns();
    } catch (err) {
      if (err instanceof HttpRequestError && err.status === 422) {
        setError('Revise os campos da campanha. Faltou algum dado obrigatorio.');
      } else if (err instanceof HttpRequestError && err.status === 403) {
        setError('Seu papel atual nao pode criar campanha.');
      } else {
        setError('Nao foi possivel criar a campanha agora.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitCampaign = async (campaignId: string) => {
    setActionByCampaign((current) => ({ ...current, [campaignId]: true }));
    setError(null);
    try {
      await postJson(`/api/campaigns/${encodeURIComponent(campaignId)}/submit`);
      await loadCampaigns();
    } catch (err) {
      if (err instanceof HttpRequestError && err.status === 403) {
        setError('Esta campanha nao pertence ao seu escopo atual.');
      } else if (err instanceof HttpRequestError && err.status === 409) {
        setError('A campanha nao pode ser submetida neste estado.');
      } else {
        setError('Falha ao submeter a campanha para revisao.');
      }
    } finally {
      setActionByCampaign((current) => ({ ...current, [campaignId]: false }));
    }
  };

  const handleOpenProducts = async (campaign: CampaignRecord) => {
    const nextCampaignId = selectedCampaignId === campaign.campaignId ? null : campaign.campaignId;
    setSelectedCampaignId(nextCampaignId);
    setError(null);

    if (!nextCampaignId) {
      setCampaignLinks([]);
      return;
    }

    try {
      await Promise.all([
        loadCampaignLinks(nextCampaignId),
        catalogOptions.length === 0 ? loadCatalogOptions() : Promise.resolve(),
      ]);
    } catch (err) {
      if (err instanceof HttpRequestError && err.status === 403) {
        setError('Seu papel atual nao pode abrir a vitrine desta campanha.');
      } else {
        setError('Nao foi possivel carregar a vitrine vinculada da campanha.');
      }
    }
  };

  const handleLinkProduct = async (campaign: CampaignRecord) => {
    const catalogItemId = selectedCatalogItemIdByCampaign[campaign.campaignId];
    if (!catalogItemId) {
      setError('Escolha um item publicado antes de vincular a campanha.');
      return;
    }

    setActionByCampaign((current) => ({ ...current, [`${campaign.campaignId}:link`] : true }));
    setError(null);
    try {
      await postJson(`/api/campaigns/${encodeURIComponent(campaign.campaignId)}/products`, { catalogItemId });
      await Promise.all([loadCampaignLinks(campaign.campaignId), loadCampaigns()]);
    } catch (err) {
      if (err instanceof HttpRequestError && err.status === 403) {
        setError('Esta campanha nao pertence ao seu escopo atual.');
      } else if (err instanceof HttpRequestError && err.status === 409) {
        setError('A campanha ou o item escolhido nao aceitam este vinculo agora.');
      } else if (err instanceof HttpRequestError && err.status === 422) {
        setError('Escolha um item valido antes de vincular a campanha.');
      } else {
        setError('Nao foi possivel vincular este item publicado a campanha.');
      }
    } finally {
      setActionByCampaign((current) => ({ ...current, [`${campaign.campaignId}:link`] : false }));
    }
  };

  const handleUnlinkProduct = async (campaign: CampaignRecord, catalogItemId: string) => {
    setActionByCampaign((current) => ({ ...current, [`${campaign.campaignId}:unlink:${catalogItemId}`]: true }));
    setError(null);
    try {
      await deleteJson(`/api/campaigns/${encodeURIComponent(campaign.campaignId)}/products`, { catalogItemId });
      await Promise.all([loadCampaignLinks(campaign.campaignId), loadCampaigns()]);
    } catch (err) {
      if (err instanceof HttpRequestError && err.status === 403) {
        setError('Esta campanha nao pertence ao seu escopo atual.');
      } else if (err instanceof HttpRequestError && err.status === 409) {
        setError('Esta campanha nao aceita mais remocao de vitrine neste estado.');
      } else {
        setError('Nao foi possivel remover este item da campanha.');
      }
    } finally {
      setActionByCampaign((current) => ({ ...current, [`${campaign.campaignId}:unlink:${catalogItemId}`]: false }));
    }
  };

  const totals = campaigns.reduce(
    (acc, campaign) => {
      acc.total += 1;
      acc.byStatus[campaign.status] = (acc.byStatus[campaign.status] ?? 0) + 1;
      acc.totalBudget += campaign.budget;
      acc.totalLinkedProducts += campaign.productCount;
      return acc;
    },
    {
      total: 0,
      totalBudget: 0,
      totalLinkedProducts: 0,
      byStatus: {} as Partial<Record<CampaignStatus, number>>,
    }
  );

  const selectedCampaign = selectedCampaignId ? campaigns.find((campaign) => campaign.campaignId === selectedCampaignId) ?? null : null;
  const linkedCatalogItemIds = new Set(campaignLinks.map((link) => link.catalogItemId));
  const availableCatalogOptions = catalogOptions.filter((item) => !linkedCatalogItemIds.has(item.catalogItemId));

  return (
    <main className="min-h-screen bg-ruah-50 page-header-offset">
      <Header />
      <section className="section-space bg-white border-b border-ruah-100">
        <div className="section-container flex flex-col gap-4">
          <span className="tech-label text-accent-gold">Community Workspace</span>
          <h1 className="ur-type-display-md italic uppercase text-ruah-950">Campanhas</h1>
          <p className="text-sm text-ruah-500 max-w-2xl">
            Agora a campanha nao e so status. Voce monta a vitrine real com `CatalogItem` publicado, acompanha o recorte e leva esse contexto ate a loja.
          </p>
        </div>
      </section>

      <section className="section-space">
        <div className="section-container grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="bg-white border border-ruah-100 rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-ruah-950 inline-flex items-center gap-2">
                <Megaphone size={18} className="text-accent-gold" /> Fila real de campanhas
              </h2>
              <Link href="/community" className="text-xs font-bold uppercase tracking-[0.1em] text-accent-gold inline-flex items-center gap-2">
                Voltar <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? <p className="text-sm text-ruah-500">Carregando fila...</p> : null}
            {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

            {!loading ? (
              campaigns.length === 0 ? (
                <p className="text-sm text-ruah-500">Nenhuma campanha criada ainda para este ambiente.</p>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => {
                    const canSubmit = campaign.status === 'draft' || campaign.status === 'rejected';
                    const productsMutable = canManageProducts(campaign.status);
                    const isSelected = selectedCampaignId === campaign.campaignId;

                    return (
                      <article key={campaign.campaignId} className="rounded-3xl border border-ruah-100 bg-ruah-50/60 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-gold">{campaign.campaignId}</p>
                            <h3 className="mt-2 text-lg font-semibold text-ruah-950">{campaign.name}</h3>
                            <p className="mt-2 text-sm text-ruah-500">{campaign.description}</p>
                          </div>
                          <div className="rounded-2xl border border-ruah-100 bg-white px-4 py-3 text-right">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Status</p>
                            <p className="mt-2 text-sm font-semibold uppercase text-ruah-950">{statusLabel(campaign.status)}</p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
                          <div className="rounded-2xl border border-ruah-100 bg-white p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Organizacao</p>
                            <p className="mt-2 text-sm font-semibold text-ruah-950">{campaign.organizationId}</p>
                          </div>
                          <div className="rounded-2xl border border-ruah-100 bg-white p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Budget</p>
                            <p className="mt-2 text-sm font-semibold text-ruah-950">{formatCurrency(campaign.budget)}</p>
                          </div>
                          <div className="rounded-2xl border border-ruah-100 bg-white p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Regra</p>
                            <p className="mt-2 text-sm font-semibold text-ruah-950">{campaign.progressivePriceRule}</p>
                          </div>
                          <div className="rounded-2xl border border-ruah-100 bg-white p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Vitrine</p>
                            <p className="mt-2 text-sm font-semibold text-ruah-950">{campaign.productCount} item(ns)</p>
                          </div>
                          <div className="rounded-2xl border border-ruah-100 bg-white p-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Atualizado</p>
                            <p className="mt-2 text-sm font-semibold text-ruah-950">{new Date(campaign.updatedAt).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {canSubmit ? (
                            <button
                              type="button"
                              onClick={() => void handleSubmitCampaign(campaign.campaignId)}
                              disabled={Boolean(actionByCampaign[campaign.campaignId])}
                              className="rounded-2xl bg-ruah-950 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                            >
                              <span className="inline-flex items-center gap-2">
                                <Send size={14} />
                                {actionByCampaign[campaign.campaignId] ? 'Enviando...' : 'Submeter para revisao'}
                              </span>
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => void handleOpenProducts(campaign)}
                            className="rounded-2xl border border-ruah-200 bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-950"
                          >
                            <span className="inline-flex items-center gap-2">
                              <Box size={14} />
                              {isSelected ? 'Fechar vitrine' : 'Gerir vitrine'}
                            </span>
                          </button>

                          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500">
                            {campaign.status === 'active' ? `Rota publica /c/${campaign.campaignId}` : 'Rota publica libera quando a campanha ficar ativa'}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500">
                            {productsMutable ? 'Vitrine editavel neste estado' : 'Vitrine congelada neste estado'}
                          </span>
                        </div>

                        {isSelected ? (
                          <div className="mt-5 rounded-3xl border border-ruah-100 bg-white p-5">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-gold">Vitrine vinculada</p>
                                <h4 className="mt-2 text-base font-semibold text-ruah-950">{campaign.name}</h4>
                                <p className="mt-2 text-sm text-ruah-500">
                                  O link publico da campanha agora aponta para uma vitrine filtrada. No checkout com contexto de campanha, so entram itens vinculados aqui.
                                </p>
                              </div>
                              {campaign.status === 'active' ? (
                                <Link
                                  href={`/c/${campaign.campaignId}`}
                                  className="text-xs font-bold uppercase tracking-[0.1em] text-accent-gold inline-flex items-center gap-2"
                                >
                                  Abrir rota publica <ArrowRight size={12} />
                                </Link>
                              ) : null}
                            </div>

                            <div className="mt-5 rounded-2xl border border-ruah-100 bg-ruah-50/70 p-4">
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Itens vinculados</p>
                              {campaignLinksLoading ? <p className="mt-3 text-sm text-ruah-500">Carregando vitrine...</p> : null}
                              {!campaignLinksLoading && campaignLinks.length === 0 ? (
                                <p className="mt-3 text-sm text-ruah-500">Nenhum `CatalogItem` vinculado ainda. Sem isso, a campanha ativa nao tem recorte real de vitrine.</p>
                              ) : null}
                              {!campaignLinksLoading && campaignLinks.length > 0 ? (
                                <div className="mt-4 grid grid-cols-1 gap-3">
                                  {campaignLinks.map((link) => (
                                    <article key={link.campaignProductId} className="rounded-2xl border border-ruah-100 bg-white p-4">
                                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="min-w-0">
                                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-gold">{link.catalogItemId}</p>
                                          <h5 className="mt-2 text-sm font-semibold text-ruah-950">{link.item?.name ?? 'Item indisponivel'}</h5>
                                          <p className="mt-2 text-xs text-ruah-500">
                                            {link.item ? `${formatCurrency(link.item.price)} • ${link.item.publicationStatus}` : 'O catálogo foi removido ou deixou de existir.'}
                                          </p>
                                        </div>
                                        {productsMutable ? (
                                          <button
                                            type="button"
                                            onClick={() => void handleUnlinkProduct(campaign, link.catalogItemId)}
                                            disabled={Boolean(actionByCampaign[`${campaign.campaignId}:unlink:${link.catalogItemId}`])}
                                            className="rounded-2xl border border-ruah-200 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-950 disabled:opacity-50"
                                          >
                                            <span className="inline-flex items-center gap-2">
                                              <Unlink2 size={14} />
                                              {actionByCampaign[`${campaign.campaignId}:unlink:${link.catalogItemId}`] ? 'Removendo...' : 'Remover'}
                                            </span>
                                          </button>
                                        ) : null}
                                      </div>
                                    </article>
                                  ))}
                                </div>
                              ) : null}
                            </div>

                            <div className="mt-4 rounded-2xl border border-ruah-100 bg-ruah-50/70 p-4">
                              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Adicionar item publicado</p>
                              <p className="mt-2 text-sm text-ruah-500">
                                {productsMutable
                                  ? 'Escolha um item ja publicado para a campanha apontar para oferta real, sem produto paralelo.'
                                  : 'Campanhas ativas, encerradas ou em revisao ficam congeladas aqui para nao virar vitrine mutavel sem controle.'}
                              </p>

                              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                                <select
                                  value={selectedCatalogItemIdByCampaign[campaign.campaignId] ?? ''}
                                  onChange={(event) =>
                                    setSelectedCatalogItemIdByCampaign((current) => ({
                                      ...current,
                                      [campaign.campaignId]: event.target.value,
                                    }))
                                  }
                                  disabled={!productsMutable || catalogOptionsLoading}
                                  className="w-full rounded-2xl border border-ruah-100 bg-white px-4 py-3 text-sm outline-none focus:border-accent-gold disabled:opacity-60"
                                >
                                  <option value="">{catalogOptionsLoading ? 'Carregando catálogo...' : 'Selecione um CatalogItem publicado'}</option>
                                  {availableCatalogOptions.map((item) => (
                                    <option key={item.catalogItemId} value={item.catalogItemId}>
                                      {item.name} • {formatCurrency(item.price)}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => void handleLinkProduct(campaign)}
                                  disabled={!productsMutable || !selectedCatalogItemIdByCampaign[campaign.campaignId] || Boolean(actionByCampaign[`${campaign.campaignId}:link`])}
                                  className="rounded-2xl bg-ruah-950 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                                >
                                  <span className="inline-flex items-center gap-2">
                                    <PackagePlus size={14} />
                                    {actionByCampaign[`${campaign.campaignId}:link`] ? 'Vinculando...' : 'Vincular item'}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )
            ) : null}
          </article>

          <aside className="space-y-6">
            <article className="bg-white border border-ruah-100 rounded-3xl p-6">
              <h2 className="text-base font-semibold text-ruah-950 inline-flex items-center gap-2">
                <BarChart3 size={16} className="text-accent-gold" /> Leitura operacional
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-ruah-600">
                <li className="flex items-center justify-between"><span>Total de campanhas</span><strong className="text-ruah-950">{totals.total}</strong></li>
                <li className="flex items-center justify-between"><span>Em revisao</span><strong className="text-ruah-950">{totals.byStatus.pending_review ?? 0}</strong></li>
                <li className="flex items-center justify-between"><span>Ativas</span><strong className="text-ruah-950">{totals.byStatus.active ?? 0}</strong></li>
                <li className="flex items-center justify-between"><span>Itens em vitrines</span><strong className="text-ruah-950">{totals.totalLinkedProducts}</strong></li>
                <li className="flex items-center justify-between"><span>Budget agregado</span><strong className="text-ruah-950">{formatCurrency(totals.totalBudget)}</strong></li>
              </ul>
            </article>

            <article className="bg-white border border-ruah-100 rounded-3xl p-6">
              <h2 className="text-base font-semibold text-ruah-950 inline-flex items-center gap-2">
                <CalendarClock size={16} className="text-accent-gold" /> Nova campanha
              </h2>
              <form className="mt-4 space-y-3" onSubmit={handleCreateCampaign}>
                <input
                  value={form.organizationId}
                  onChange={(event) => setForm((current) => ({ ...current, organizationId: event.target.value }))}
                  placeholder="organizationId"
                  className="w-full rounded-2xl border border-ruah-100 px-4 py-3 text-sm outline-none focus:border-accent-gold"
                />
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Nome da campanha"
                  className="w-full rounded-2xl border border-ruah-100 px-4 py-3 text-sm outline-none focus:border-accent-gold"
                />
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Objetivo e mensagem"
                  rows={4}
                  className="w-full rounded-2xl border border-ruah-100 px-4 py-3 text-sm outline-none focus:border-accent-gold"
                />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    value={form.budget}
                    onChange={(event) => setForm((current) => ({ ...current, budget: Number(event.target.value) }))}
                    type="number"
                    min={0}
                    placeholder="Budget"
                    className="w-full rounded-2xl border border-ruah-100 px-4 py-3 text-sm outline-none focus:border-accent-gold"
                  />
                  <input
                    value={form.progressivePriceRule}
                    onChange={(event) => setForm((current) => ({ ...current, progressivePriceRule: event.target.value }))}
                    placeholder="Regra progressiva"
                    className="w-full rounded-2xl border border-ruah-100 px-4 py-3 text-sm outline-none focus:border-accent-gold"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    value={form.startsAt}
                    onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))}
                    type="date"
                    className="w-full rounded-2xl border border-ruah-100 px-4 py-3 text-sm outline-none focus:border-accent-gold"
                  />
                  <input
                    value={form.endsAt}
                    onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))}
                    type="date"
                    className="w-full rounded-2xl border border-ruah-100 px-4 py-3 text-sm outline-none focus:border-accent-gold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-ruah-950 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                >
                  {submitting ? 'Criando...' : 'Criar rascunho'}
                </button>
              </form>
            </article>

            <article className="bg-white border border-ruah-100 rounded-3xl p-6 space-y-3">
              <h2 className="text-base font-semibold text-ruah-950 inline-flex items-center gap-2">
                <ShieldAlert size={16} className="text-accent-gold" /> Governanca
              </h2>
              <p className="text-sm text-ruah-500">
                Campanha sai daqui em rascunho, pode ganhar vitrine vinculada com `CatalogItem` publicado e depois segue para `pending_review`. A ativacao final continua condicionada a moderacao e impacto sensivel.
              </p>
              {selectedCampaign ? (
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500">
                  {selectedCampaign.status === 'active'
                    ? 'Campanha ativa fica com vitrine congelada para evitar mudanca silenciosa de oferta.'
                    : 'Vitrine so e editavel em rascunho, rejeicao ou pausa.'}
                </p>
              ) : null}
              <Link href="/admin/impact-reviews" className="text-xs font-bold uppercase tracking-[0.1em] text-accent-gold inline-flex items-center gap-2">
                Abrir mesa de impacto <ArrowRight size={12} />
              </Link>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}
