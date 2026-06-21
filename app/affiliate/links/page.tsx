'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, BadgeDollarSign, Link2, ScanLine } from 'lucide-react';
import { Header } from '@/components/navigation/Header';
import { getJson, HttpRequestError, postJson } from '@/lib/http-client';

interface ReferralLinkPerformance {
  referralLinkId: string;
  slug: string;
  label: string;
  channel: string;
  targetPath: string;
  status: 'active' | 'paused';
  clickCount: number;
  conversionCount: number;
  conversionRate: number;
  revenueAmount: number;
}

interface AffiliateLinksResponse {
  ok: true;
  ownerId: string;
  summary: {
    totalLinks: number;
    clicks: number;
    conversions: number;
    conversionRate: number;
    revenueAmount: number;
  };
  links: ReferralLinkPerformance[];
}

const INITIAL_FORM = {
  label: '',
  channel: '',
  targetPath: '/shop',
  slug: '',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function AffiliateLinksPage() {
  const [data, setData] = React.useState<AffiliateLinksResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [runningActionId, setRunningActionId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(INITIAL_FORM);

  async function fetchLinks() {
    return getJson<AffiliateLinksResponse>('/api/affiliate/links');
  }

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetchLinks();
        if (!active) return;
        setData(response);
      } catch (err) {
        if (!active) return;
        if (err instanceof HttpRequestError && err.status === 401) {
          setError('Sessao obrigatoria para abrir os links de afiliacao.');
          return;
        }
        if (err instanceof HttpRequestError && err.status === 403) {
          setError('Seu papel atual nao pode operar links de afiliacao.');
          return;
        }
        setError('Nao foi possivel carregar os links agora.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await postJson('/api/affiliate/links', {
        label: form.label.trim(),
        channel: form.channel.trim(),
        targetPath: form.targetPath.trim(),
        slug: form.slug.trim() || undefined,
      });
      setForm(INITIAL_FORM);
      const response = await fetchLinks();
      setData(response);
    } catch (err) {
      if (err instanceof HttpRequestError && err.status === 422) {
        setError('Revise label, canal e destino do link.');
      } else if (err instanceof HttpRequestError && err.status === 403) {
        setError('Seu papel atual nao pode criar link de afiliacao.');
      } else {
        setError('Nao foi possivel criar o link agora.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const links = data?.links ?? [];
  const activeLinks = links.filter((item) => item.status === 'active').length;
  const pausedLinks = links.filter((item) => item.status === 'paused').length;

  const handleStatusAction = async (item: ReferralLinkPerformance) => {
    const endpoint = item.status === 'active' ? 'pause' : 'activate';
    setRunningActionId(item.referralLinkId);
    setError(null);
    try {
      await postJson(`/api/affiliate/links/${encodeURIComponent(item.referralLinkId)}/${endpoint}`, {});
      const response = await fetchLinks();
      setData(response);
    } catch (err) {
      if (err instanceof HttpRequestError && err.status === 403) {
        setError('Seu papel atual nao pode alterar este link.');
      } else if (err instanceof HttpRequestError && err.status === 409) {
        setError('O link ja estava nesse estado e precisa ser recarregado.');
      } else {
        setError('Nao foi possivel atualizar o status do link agora.');
      }
    } finally {
      setRunningActionId(null);
    }
  };

  return (
    <main className="min-h-screen bg-ruah-50 page-header-offset">
      <Header />
      <section className="section-space bg-white border-b border-ruah-100">
        <div className="section-container flex flex-col gap-4">
          <span className="tech-label text-accent-gold">Affiliate Workspace</span>
          <h1 className="ur-type-display-md italic uppercase text-ruah-950">Links de Divulgacao</h1>
          <p className="text-sm text-ruah-500 max-w-2xl">
            Agora o inventario nasce do runtime. Cada slug publico em <span className="font-semibold text-ruah-950">/af/[slug]</span> registra clique real e alimenta a leitura de conversao.
          </p>
        </div>
      </section>

      <section className="section-space">
        <div className="section-container grid grid-cols-1 lg:grid-cols-12 gap-6">
          <article className="lg:col-span-8 bg-white border border-ruah-100 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ruah-950 inline-flex items-center gap-2">
                <Link2 size={18} className="text-accent-gold" /> Inventario de Links
              </h2>
              <Link href="/affiliate" className="text-xs font-bold uppercase tracking-[0.1em] text-accent-gold inline-flex items-center gap-2">
                Voltar <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? <p className="text-sm text-ruah-500">Carregando links...</p> : null}
            {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

            {!loading ? (
              links.length === 0 ? (
                <p className="text-sm text-ruah-500">Nenhum link cadastrado ainda. Crie o primeiro ativo do canal nesta tela.</p>
              ) : (
                <div className="space-y-3">
                  {links.map((item) => (
                    <div key={item.referralLinkId} className="border border-ruah-100 rounded-2xl p-4 bg-ruah-50/40">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-ruah-950">{item.label}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-[0.1em] text-ruah-500">{item.channel}</span>
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                              item.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {item.status === 'active' ? 'Ativo' : 'Pausado'}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-ruah-600">/af/{item.slug}</p>
                      <p className="mt-1 text-xs text-ruah-500">Destino: {item.targetPath}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-ruah-600">
                        <span>Cliques: <strong className="text-ruah-950">{item.clickCount}</strong></span>
                        <span>Conversoes: <strong className="text-ruah-950">{item.conversionCount}</strong></span>
                        <span>Taxa: <strong className="text-ruah-950">{item.conversionRate}%</strong></span>
                        <span>Receita: <strong className="text-ruah-950">{formatCurrency(item.revenueAmount)}</strong></span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => void handleStatusAction(item)}
                          disabled={runningActionId !== null}
                          className="rounded-2xl border border-ruah-200 bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-950 disabled:opacity-50"
                        >
                          {runningActionId === item.referralLinkId
                            ? item.status === 'active'
                              ? 'Pausando...'
                              : 'Reativando...'
                            : item.status === 'active'
                              ? 'Pausar link'
                              : 'Reativar link'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : null}
          </article>

          <aside className="lg:col-span-4 space-y-6">
            <article className="bg-white border border-ruah-100 rounded-3xl p-6">
              <h3 className="text-base font-semibold text-ruah-950 inline-flex items-center gap-2">
                <BarChart3 size={16} className="text-accent-gold" /> Resumo
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-ruah-600">
                <li className="flex items-center justify-between"><span>Links Ativos</span><strong className="text-ruah-950">{activeLinks}</strong></li>
                <li className="flex items-center justify-between"><span>Links Pausados</span><strong className="text-ruah-950">{pausedLinks}</strong></li>
                <li className="flex items-center justify-between"><span>Cliques Totais</span><strong className="text-ruah-950">{data?.summary.clicks ?? 0}</strong></li>
                <li className="flex items-center justify-between"><span>Conversao Media</span><strong className="text-ruah-950">{data?.summary.conversionRate ?? 0}%</strong></li>
              </ul>
            </article>

            <article className="bg-white border border-ruah-100 rounded-3xl p-6 space-y-3">
              <h3 className="text-base font-semibold text-ruah-950 inline-flex items-center gap-2">
                <BadgeDollarSign size={16} className="text-accent-gold" /> Receita Atribuida
              </h3>
              <p className="text-sm text-ruah-500">
                {formatCurrency(data?.summary.revenueAmount ?? 0)} registrados por conversao validada. Isso ainda nao equivale a saldo sacavel.
              </p>
            </article>

            <article className="bg-white border border-ruah-100 rounded-3xl p-6 space-y-3">
              <h3 className="text-base font-semibold text-ruah-950 inline-flex items-center gap-2">
                <ScanLine size={16} className="text-accent-gold" /> Novo Link
              </h3>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <input
                  value={form.label}
                  onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                  placeholder="Nome do ativo"
                  className="w-full rounded-2xl border border-ruah-100 px-4 py-3 text-sm outline-none focus:border-accent-gold"
                />
                <input
                  value={form.channel}
                  onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value }))}
                  placeholder="Canal"
                  className="w-full rounded-2xl border border-ruah-100 px-4 py-3 text-sm outline-none focus:border-accent-gold"
                />
                <input
                  value={form.targetPath}
                  onChange={(event) => setForm((current) => ({ ...current, targetPath: event.target.value }))}
                  placeholder="/shop"
                  className="w-full rounded-2xl border border-ruah-100 px-4 py-3 text-sm outline-none focus:border-accent-gold"
                />
                <input
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  placeholder="slug opcional"
                  className="w-full rounded-2xl border border-ruah-100 px-4 py-3 text-sm outline-none focus:border-accent-gold"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-ruah-950 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                >
                  {submitting ? 'Criando...' : 'Criar link'}
                </button>
              </form>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}
