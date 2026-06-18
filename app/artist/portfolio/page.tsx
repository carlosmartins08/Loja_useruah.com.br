'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, BrushCleaning, GalleryVerticalEnd, Send, ShieldCheck } from 'lucide-react';
import { Header } from '@/components/navigation/Header';
import { getJson, HttpRequestError, postJson } from '@/lib/http-client';

type ArtworkStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';

interface ArtworkRecord {
  artworkId: string;
  authorId: string;
  status: ArtworkStatus;
  sourceAsset: string;
  metadata: {
    theme: string;
    category: string;
    tags: string[];
  };
  submittedAt: string;
  reviewedAt?: string;
  reviewReason?: string;
}

interface SessionResponse {
  ok: true;
  authenticated: boolean;
  session: {
    userId: string;
    activeRole: string;
  } | null;
}

const INITIAL_FORM = {
  sourceAsset: 'qa://artist/runtime-artwork',
  theme: '',
  category: '',
  tags: '',
};

function statusLabel(status: ArtworkStatus) {
  switch (status) {
    case 'submitted':
      return 'Submetida';
    case 'under_review':
      return 'Em revisao';
    case 'approved':
      return 'Aprovada';
    case 'rejected':
      return 'Rejeitada';
    default:
      return status;
  }
}

export default function ArtistPortfolioPage() {
  const [artworks, setArtworks] = React.useState<ArtworkRecord[]>([]);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [termsSubmitting, setTermsSubmitting] = React.useState(false);
  const [artworkSubmitting, setArtworkSubmitting] = React.useState(false);
  const [form, setForm] = React.useState(INITIAL_FORM);

  async function fetchPortfolio() {
    const [session, artworkResponse] = await Promise.all([
      getJson<SessionResponse>('/api/auth/session'),
      getJson<{ ok: true; artworks: ArtworkRecord[] }>('/api/artworks'),
    ]);
    return { session, artworks: artworkResponse.artworks };
  }

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetchPortfolio();
        if (!active) return;
        setUserId(response.session.session?.userId ?? null);
        setArtworks(response.artworks.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)));
      } catch (err) {
        if (!active) return;
        if (err instanceof HttpRequestError && err.status === 401) {
          setError('Sessao obrigatoria para abrir o portfolio autoral.');
          return;
        }
        if (err instanceof HttpRequestError && err.status === 403) {
          setError('Seu papel atual nao pode operar o portfolio de artista.');
          return;
        }
        setError('Nao foi possivel carregar o portfolio agora.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const summary = artworks.reduce(
    (acc, artwork) => {
      acc.total += 1;
      acc[artwork.status] += 1;
      return acc;
    },
    { total: 0, submitted: 0, under_review: 0, approved: 0, rejected: 0 }
  );

  const portfolioSignals = [
    {
      title: 'Obras submetidas',
      value: String(summary.total),
      detail: 'Fila autoral real do seu proprio runtime.',
      icon: BrushCleaning,
    },
    {
      title: 'Obras aprovadas',
      value: String(summary.approved),
      detail: 'Itens ja liberados para curadoria/catalogo.',
      icon: GalleryVerticalEnd,
    },
    {
      title: 'Em revisao',
      value: String(summary.under_review),
      detail: 'Pecas aguardando decisao editorial.',
      icon: ShieldCheck,
    },
  ] as const;

  const acceptTerms = async () => {
    if (!userId) {
      setError('Nao foi possivel resolver sua sessao para aceitar o termo base.');
      return;
    }
    setTermsSubmitting(true);
    setError(null);
    try {
      await postJson('/api/terms/accept', {
        userId,
        entityType: 'artist',
        entityId: userId,
        termType: 'artist_base',
        termVersion: 'v1',
      });
    } catch (err) {
      if (err instanceof HttpRequestError && err.status === 403) {
        setError('Seu papel atual nao pode aceitar o termo base de artista.');
      } else {
        setError('Nao foi possivel registrar o termo base agora.');
      }
    } finally {
      setTermsSubmitting(false);
    }
  };

  const submitArtwork = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setArtworkSubmitting(true);
    setError(null);
    try {
      await postJson('/api/artworks', {
        sourceAsset: form.sourceAsset.trim(),
        metadata: {
          theme: form.theme.trim(),
          category: form.category.trim(),
          tags: form.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        },
      });
      const response = await fetchPortfolio();
      setUserId(response.session.session?.userId ?? null);
      setArtworks(response.artworks.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)));
      setForm(INITIAL_FORM);
    } catch (err) {
      if (err instanceof HttpRequestError && err.status === 403) {
        setError('Aceite o termo base antes de submeter nova obra.');
      } else if (err instanceof HttpRequestError && err.status === 422) {
        setError('Revise asset, tema, categoria e tags.');
      } else {
        setError('Nao foi possivel submeter a obra agora.');
      }
    } finally {
      setArtworkSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-ruah-25 page-header-offset">
      <Header />
      <section className="section-space bg-white border-b border-ruah-100">
        <div className="section-container flex flex-col gap-4">
          <span className="tech-label text-accent-gold">Ambiente artista</span>
          <h1 className="ur-type-display-md italic uppercase text-ruah-950">Portfolio e curadoria</h1>
          <p className="max-w-3xl text-sm text-ruah-500">
            O portfolio deixou de ser painel cenografico. Agora voce aceita o termo base, submete obra real e acompanha a fila
            editorial do proprio autor.
          </p>
        </div>
      </section>

      <section className="section-space">
        <div className="section-container grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {portfolioSignals.map((item) => (
                <article key={item.title} className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 text-accent-gold">
                    <item.icon size={18} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em]">{item.title}</span>
                  </div>
                  <p className="mt-4 text-3xl font-black text-ruah-950">{item.value}</p>
                  <p className="mt-2 text-sm text-ruah-500">{item.detail}</p>
                </article>
              ))}
            </div>

            <section className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ruah-950">Fila autoral</h2>
                <button
                  type="button"
                  onClick={() => void acceptTerms()}
                  disabled={termsSubmitting || !userId}
                  className="rounded-2xl border border-ruah-100 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-700 disabled:opacity-50"
                >
                  {termsSubmitting ? 'Registrando...' : 'Aceitar termo base'}
                </button>
              </div>

              {loading ? <p className="mt-4 text-sm text-ruah-500">Carregando portfolio...</p> : null}
              {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

              {!loading && !error ? (
                artworks.length === 0 ? (
                  <p className="mt-4 text-sm text-ruah-500">Nenhuma obra submetida ainda para este perfil.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {artworks.map((artwork) => (
                      <article key={artwork.artworkId} className="rounded-2xl border border-ruah-100 bg-ruah-50 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-gold">{artwork.artworkId}</p>
                            <h3 className="mt-2 text-base font-semibold text-ruah-950">{artwork.metadata.theme}</h3>
                            <p className="mt-1 text-sm text-ruah-500">
                              Categoria {artwork.metadata.category} · Tags {artwork.metadata.tags.join(', ')}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-ruah-100 bg-white px-4 py-3 text-right">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Status</p>
                            <p className="mt-2 text-sm font-semibold uppercase text-ruah-950">{statusLabel(artwork.status)}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-ruah-600">
                          <span>Asset: <strong className="text-ruah-950">{artwork.sourceAsset}</strong></span>
                          <span>Submetida em <strong className="text-ruah-950">{new Date(artwork.submittedAt).toLocaleString('pt-BR')}</strong></span>
                          {artwork.reviewReason ? (
                            <span className="inline-flex items-center gap-1">
                              <AlertTriangle size={12} className="text-accent-gold" />
                              Motivo: <strong className="text-ruah-950">{artwork.reviewReason}</strong>
                            </span>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                )
              ) : null}
            </section>
          </article>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ruah-950">Nova obra</h2>
              <form className="mt-4 space-y-3" onSubmit={submitArtwork}>
                <input
                  value={form.sourceAsset}
                  onChange={(event) => setForm((current) => ({ ...current, sourceAsset: event.target.value }))}
                  placeholder="qa://artist/runtime-artwork"
                  className="w-full rounded-2xl border border-ruah-100 px-4 py-3 text-sm outline-none focus:border-accent-gold"
                />
                <input
                  value={form.theme}
                  onChange={(event) => setForm((current) => ({ ...current, theme: event.target.value }))}
                  placeholder="Tema"
                  className="w-full rounded-2xl border border-ruah-100 px-4 py-3 text-sm outline-none focus:border-accent-gold"
                />
                <input
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  placeholder="Categoria"
                  className="w-full rounded-2xl border border-ruah-100 px-4 py-3 text-sm outline-none focus:border-accent-gold"
                />
                <input
                  value={form.tags}
                  onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                  placeholder="tags, separadas, por, virgula"
                  className="w-full rounded-2xl border border-ruah-100 px-4 py-3 text-sm outline-none focus:border-accent-gold"
                />
                <button
                  type="submit"
                  disabled={artworkSubmitting}
                  className="w-full rounded-2xl bg-ruah-950 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <Send size={14} />
                    {artworkSubmitting ? 'Submetendo...' : 'Submeter obra'}
                  </span>
                </button>
              </form>
            </section>

            <section className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ruah-950">Proximos movimentos</h2>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <Link href="/artist/commissions" className="rounded-2xl border border-ruah-100 px-4 py-3 text-ruah-700 hover:bg-ruah-50">
                  Abrir saldo e payouts
                </Link>
                <Link href="/artist/orders" className="rounded-2xl border border-ruah-100 px-4 py-3 text-ruah-700 hover:bg-ruah-50">
                  Ver pedidos vinculados
                </Link>
                <Link href="/policies" className="rounded-2xl border border-ruah-100 px-4 py-3 text-ruah-700 hover:bg-ruah-50">
                  Consultar criterios editoriais
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
