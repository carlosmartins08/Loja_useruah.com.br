'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, BarChart3, Link2, ShieldCheck } from 'lucide-react';
import { Header } from '@/components/navigation/Header';
import { getJson, HttpRequestError } from '@/lib/http-client';

interface ReferralLinkSummary {
  totalLinks: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  revenueAmount: number;
}

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
  summary: ReferralLinkSummary;
  links: ReferralLinkPerformance[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function AffiliateHomePage() {
  const [data, setData] = React.useState<AffiliateLinksResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    getJson<AffiliateLinksResponse>('/api/affiliate/links')
      .then((response) => {
        if (!active) return;
        setData(response);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof HttpRequestError && err.status === 401) {
          setError('Sessao obrigatoria para abrir o ambiente de afiliacao.');
          return;
        }
        if (err instanceof HttpRequestError && err.status === 403) {
          setError('Seu papel atual nao pode operar a leitura de afiliacao.');
          return;
        }
        setError('Nao foi possivel carregar a performance de afiliacao agora.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const topLink = data?.links[0] ?? null;
  const statusCards = [
    {
      title: 'Ativos de divulgacao',
      value: String(data?.summary.totalLinks ?? 0),
      detail: 'Links reais cadastrados neste owner e servidos por `/af/[slug]`.',
      icon: Link2,
    },
    {
      title: 'Tracking de conversao',
      value: `${data?.summary.conversionRate ?? 0}%`,
      detail: 'Cliques e conversoes agora nascem de eventos persistidos do proprio runtime.',
      icon: BarChart3,
    },
    {
      title: 'Rewards e ledger',
      value: 'Fora do escopo',
      detail: 'Receita atribuida existe como metrica operacional. Reward financeiro ainda nao vira saldo ou payout.',
      icon: AlertTriangle,
    },
  ] as const;

  return (
    <main className="min-h-screen bg-ruah-50 page-header-offset">
      <Header />
      <section className="section-space bg-white border-b border-ruah-100">
        <div className="section-container flex flex-col gap-4">
          <span className="tech-label text-accent-gold">Affiliate Workspace</span>
          <h1 className="ur-type-display-md italic uppercase text-ruah-950">Programa de afiliacao</h1>
          <p className="text-sm text-ruah-500 max-w-2xl">
            Este ambiente agora tem fonte de verdade minima para links, cliques e conversoes. Reward financeiro continua fora
            do runtime oficial ate existir backend proprio de recompensas.
          </p>
        </div>
      </section>

      <section className="section-space">
        <div className="section-container grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {statusCards.map((item) => (
              <div key={item.title} className="rounded-3xl border border-ruah-100 bg-white p-6">
                <div className="flex items-center gap-2 text-accent-gold">
                  <item.icon size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em]">{item.title}</span>
                </div>
                <p className="mt-4 text-2xl font-black text-ruah-950">{item.value}</p>
                <p className="mt-2 text-sm text-ruah-500">{item.detail}</p>
              </div>
            ))}
          </article>

          <aside className="rounded-3xl border border-ruah-100 bg-white p-6">
            <h2 className="text-lg font-semibold text-ruah-950 inline-flex items-center gap-2">
              <ShieldCheck size={16} className="text-accent-gold" /> Leitura operacional atual
            </h2>
            {loading ? <p className="mt-4 text-sm text-ruah-500">Carregando sinais do canal...</p> : null}
            {error ? <p className="mt-4 text-sm text-ruah-500">{error}</p> : null}

            {!loading && !error && data ? (
              <div className="mt-4 space-y-4 text-sm text-ruah-600">
                <p>
                  Cliques registrados: <span className="font-semibold text-ruah-950">{data.summary.clicks}</span>
                </p>
                <p>
                  Conversoes registradas: <span className="font-semibold text-ruah-950">{data.summary.conversions}</span>
                </p>
                <p>
                  Receita atribuida: <span className="font-semibold text-ruah-950">{formatCurrency(data.summary.revenueAmount)}</span>
                </p>
                <p>
                  Melhor ativo atual:{' '}
                  <span className="font-semibold text-ruah-950">{topLink ? `${topLink.label} (${topLink.channel})` : 'nenhum link cadastrado ainda'}</span>
                </p>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3">
              <Link href="/affiliate/links" className="rounded-2xl border border-ruah-100 px-4 py-3 text-sm font-semibold text-ruah-700 hover:bg-ruah-50">
                Abrir links e ativos
              </Link>
              <Link href="/policies" className="rounded-2xl border border-ruah-100 px-4 py-3 text-sm font-semibold text-ruah-700 hover:bg-ruah-50">
                Consultar diretrizes
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
