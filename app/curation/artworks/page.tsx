'use client';

import React from 'react';
import Link from 'next/link';
import { FileSearch, ShieldAlert, Sparkles } from 'lucide-react';
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

export default function CurationArtworksPage() {
  const [artworks, setArtworks] = React.useState<ArtworkRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rejectByArtwork, setRejectByArtwork] = React.useState<Record<string, string>>({});
  const [actionByArtwork, setActionByArtwork] = React.useState<Record<string, boolean>>({});

  const loadArtworks = React.useCallback(async () => {
    const response = await getJson<{ ok: true; artworks: ArtworkRecord[] }>('/api/artworks');
    setArtworks(response.artworks.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)));
  }, []);

  React.useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      if (!active) return;
      loadArtworks()
        .catch((err) => {
          if (!active) return;
          if (err instanceof HttpRequestError && err.status === 403) {
            setError('Seu papel atual nao pode abrir a fila curatorial completa.');
            return;
          }
          setError('Nao foi possivel carregar a fila editorial agora.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [loadArtworks]);

  const handleApprove = async (artworkId: string) => {
    setActionByArtwork((current) => ({ ...current, [artworkId]: true }));
    setError(null);
    try {
      await postJson(`/api/artworks/${encodeURIComponent(artworkId)}/approve`);
      await loadArtworks();
    } catch (err) {
      if (err instanceof HttpRequestError && err.status === 409) {
        setError('A obra precisa entrar em revisao antes da aprovacao final.');
      } else {
        setError('Falha ao aprovar a obra.');
      }
    } finally {
      setActionByArtwork((current) => ({ ...current, [artworkId]: false }));
    }
  };

  const handleReject = async (artworkId: string) => {
    const reason = (rejectByArtwork[artworkId] ?? '').trim();
    if (!reason) {
      setError('Toda rejeicao precisa registrar motivo.');
      return;
    }

    setActionByArtwork((current) => ({ ...current, [artworkId]: true }));
    setError(null);
    try {
      await postJson(`/api/artworks/${encodeURIComponent(artworkId)}/reject`, { reason });
      setRejectByArtwork((current) => ({ ...current, [artworkId]: '' }));
      await loadArtworks();
    } catch (err) {
      if (err instanceof HttpRequestError && err.status === 409) {
        setError('A obra precisa entrar em revisao antes da rejeicao final.');
      } else if (err instanceof HttpRequestError && err.status === 422) {
        setError('Motivo obrigatorio para rejeitar a obra.');
      } else {
        setError('Falha ao rejeitar a obra.');
      }
    } finally {
      setActionByArtwork((current) => ({ ...current, [artworkId]: false }));
    }
  };

  const handleStartReview = async (artworkId: string) => {
    setActionByArtwork((current) => ({ ...current, [artworkId]: true }));
    setError(null);
    try {
      await postJson(`/api/artworks/${encodeURIComponent(artworkId)}/start-review`);
      await loadArtworks();
    } catch (err) {
      if (err instanceof HttpRequestError && err.status === 409) {
        setError('A obra ja saiu da etapa de submissao e nao pode reiniciar revisao.');
      } else {
        setError('Falha ao iniciar revisao da obra.');
      }
    } finally {
      setActionByArtwork((current) => ({ ...current, [artworkId]: false }));
    }
  };

  const totals = artworks.reduce(
    (acc, artwork) => {
      acc.total += 1;
      acc[artwork.status] += 1;
      return acc;
    },
    { total: 0, submitted: 0, under_review: 0, approved: 0, rejected: 0 }
  );

  return (
    <main className="min-h-screen bg-ruah-25 p-6 md:p-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-ruah-100 bg-white p-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent-gold">Ambiente curadoria</p>
          <h1 className="mt-3 text-3xl font-serif italic text-ruah-950">Fila editorial de obras</h1>
          <p className="mt-3 max-w-3xl text-sm text-ruah-500">
            Agora a curadoria consome a fila real de artworks. O trabalho editorial voltou para o proprio namespace, enquanto a
            governanca cross-role continua em <span className="font-semibold text-ruah-950">/admin/impact-reviews</span>.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <article className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-accent-gold"><FileSearch size={16} /><span className="text-[11px] font-bold uppercase tracking-[0.12em]">Total</span></div>
            <p className="mt-4 text-3xl font-black text-ruah-950">{totals.total}</p>
          </article>
          <article className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-accent-gold"><Sparkles size={16} /><span className="text-[11px] font-bold uppercase tracking-[0.12em]">Pendentes</span></div>
            <p className="mt-4 text-3xl font-black text-ruah-950">{totals.submitted + totals.under_review}</p>
          </article>
          <article className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-accent-gold"><Sparkles size={16} /><span className="text-[11px] font-bold uppercase tracking-[0.12em]">Aprovadas</span></div>
            <p className="mt-4 text-3xl font-black text-ruah-950">{totals.approved}</p>
          </article>
          <article className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-accent-gold"><ShieldAlert size={16} /><span className="text-[11px] font-bold uppercase tracking-[0.12em]">Rejeitadas</span></div>
            <p className="mt-4 text-3xl font-black text-ruah-950">{totals.rejected}</p>
          </article>
        </section>

        {loading ? <p className="text-sm text-ruah-500">Carregando fila editorial...</p> : null}
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

        {!loading ? (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            <article className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ruah-950">Fila real de artworks</h2>
              <div className="mt-4 space-y-4">
                {artworks.length === 0 ? (
                  <p className="text-sm text-ruah-500">Nenhuma obra entrou na fila ainda.</p>
                ) : (
                  artworks.map((artwork) => {
                    const isResolved = artwork.status === 'approved' || artwork.status === 'rejected';
                    const canStartReview = artwork.status === 'submitted';
                    const canDecide = artwork.status === 'under_review';
                    return (
                      <article key={artwork.artworkId} className="rounded-3xl border border-ruah-100 bg-ruah-50/60 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-gold">{artwork.artworkId}</p>
                            <h3 className="mt-2 text-lg font-semibold text-ruah-950">{artwork.metadata.theme}</h3>
                            <p className="mt-1 text-sm text-ruah-500">Categoria {artwork.metadata.category} | Autor {artwork.authorId}</p>
                          </div>
                          <div className="rounded-2xl border border-ruah-100 bg-white px-4 py-3 text-right">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Status</p>
                            <p className="mt-2 text-sm font-semibold uppercase text-ruah-950">{artwork.status}</p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-ruah-100 bg-white p-4">
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ruah-400">Tags</p>
                          <p className="mt-2 text-sm text-ruah-700">{artwork.metadata.tags.join(' | ') || 'sem tags'}</p>
                        </div>

                        {artwork.reviewReason ? (
                          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            Motivo registrado: {artwork.reviewReason}
                          </div>
                        ) : null}

                        {canStartReview ? (
                          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="text-sm text-ruah-600">
                              Esta obra ainda esta em <span className="font-semibold text-ruah-950">submitted</span>. A curadoria precisa assumir a revisao antes de decidir.
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleStartReview(artwork.artworkId)}
                              disabled={Boolean(actionByArtwork[artwork.artworkId])}
                              className="rounded-2xl bg-ruah-950 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                            >
                              Iniciar revisao
                            </button>
                          </div>
                        ) : null}

                        {canDecide ? (
                          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[auto_1fr_auto]">
                            <button
                              type="button"
                              onClick={() => void handleApprove(artwork.artworkId)}
                              disabled={Boolean(actionByArtwork[artwork.artworkId])}
                              className="rounded-2xl bg-ruah-950 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                            >
                              Aprovar
                            </button>
                            <input
                              value={rejectByArtwork[artwork.artworkId] ?? ''}
                              onChange={(event) => setRejectByArtwork((current) => ({ ...current, [artwork.artworkId]: event.target.value }))}
                              placeholder="Motivo da rejeicao"
                              className="rounded-2xl border border-ruah-100 px-4 py-3 text-sm outline-none focus:border-accent-gold"
                            />
                            <button
                              type="button"
                              onClick={() => void handleReject(artwork.artworkId)}
                              disabled={Boolean(actionByArtwork[artwork.artworkId])}
                              className="rounded-2xl border border-ruah-200 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-700 disabled:opacity-50"
                            >
                              Rejeitar
                            </button>
                          </div>
                        ) : null}

                        {isResolved ? null : !canStartReview && !canDecide ? (
                          <div className="mt-4 text-sm text-ruah-600">
                            Esta obra esta fora da janela de decisao atual.
                          </div>
                        ) : null}
                      </article>
                    );
                  })
                )}
              </div>
            </article>

            <aside className="rounded-[2rem] border border-ruah-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ruah-950">Governanca cross-role</h2>
              <p className="mt-4 text-sm text-ruah-500">
                Curadoria resolve fila editorial aqui. Quando a decisao sair do dominio visual e entrar em risco compartilhado,
                a superficie canonica continua sendo a mesa de impact review.
              </p>
              <Link href="/admin/impact-reviews" className="mt-4 inline-flex rounded-2xl border border-ruah-100 px-4 py-3 text-sm font-semibold text-ruah-700 hover:bg-ruah-50">
                Abrir impact reviews
              </Link>
            </aside>
          </section>
        ) : null}
      </div>
    </main>
  );
}
