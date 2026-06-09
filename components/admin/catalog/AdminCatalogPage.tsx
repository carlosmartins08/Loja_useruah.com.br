'use client';

import React from 'react';

type CatalogStatus = 'draft' | 'pending_review' | 'ready' | 'published' | 'archived';

type CatalogRow = {
  catalogItemId: string;
  name: string;
  price: number;
  publicationStatus: CatalogStatus;
  productBaseId: string;
  artworkId: string;
  publishedAt?: string;
  updatedAt: string;
};

const STATUS_FILTERS: Array<'all' | CatalogStatus> = ['all', 'draft', 'pending_review', 'ready', 'published', 'archived'];

export default function AdminCatalogPage() {
  const [rows, setRows] = React.useState<CatalogRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<(typeof STATUS_FILTERS)[number]>('all');
  const [actionLoading, setActionLoading] = React.useState<Record<string, boolean>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('publicationStatus', statusFilter);
    const response = await fetch(`/api/catalog-items?${params.toString()}`, { cache: 'no-store' });
    if (!response.ok) {
      setError('Nao foi possivel carregar o catalogo operacional.');
      setLoading(false);
      return;
    }
    const payload = (await response.json()) as { items: CatalogRow[] };
    setRows(payload.items);
    setLoading(false);
  }, [statusFilter]);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [load]);

  async function runCatalogAction(
    catalogItemId: string,
    action: 'ready' | 'publish' | 'unpublish' | 'reopen',
    reason: string
  ) {
    // Catalog transitions stay explicit to avoid silent publication drift.
    setActionLoading((prev) => ({ ...prev, [catalogItemId]: true }));
    setError(null);
    const response = await fetch(`/api/catalog-items/${catalogItemId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    setActionLoading((prev) => ({ ...prev, [catalogItemId]: false }));
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string; detail?: string } | null;
      setError(payload?.detail ?? payload?.error ?? 'Nao foi possivel executar a acao de catalogo.');
      return;
    }
    await load();
  }

  async function seedCatalog() {
    setLoading(true);
    setError(null);
    const response = await fetch('/api/catalog-items/bootstrap', { method: 'POST' });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string; detail?: string } | null;
      setError(payload?.detail ?? payload?.error ?? 'Nao foi possivel preparar o catalogo seed.');
      setLoading(false);
      return;
    }
    await load();
  }

  return (
    <main className="min-h-screen bg-ruah-25 p-6 md:p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-ruah-400">Fase 1</p>
            <h1 className="text-3xl font-serif italic text-ruah-950">Catalogo vendavel</h1>
            <p className="mt-2 max-w-2xl text-sm text-ruah-500">
              Aqui o admin master prepara, revisa e publica os itens que realmente podem entrar na vitrine.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void load()}
              className="rounded-xl border border-ruah-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em]"
            >
              Atualizar
            </button>
            <button
              onClick={() => void seedCatalog()}
              className="rounded-xl bg-ruah-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-white"
            >
              Preparar seed
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-ruah-100 bg-white p-4">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] ${
                statusFilter === filter ? 'bg-ruah-950 text-white' : 'bg-ruah-50 text-ruah-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {error ? <p className="text-xs font-semibold uppercase tracking-wider text-red-600">{error}</p> : null}
        {loading ? <p className="text-xs font-semibold uppercase tracking-wider text-ruah-400">Carregando...</p> : null}

        {!loading && (
          <div className="overflow-auto rounded-2xl border border-ruah-100 bg-white">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-ruah-100 bg-ruah-50 text-left">
                  <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Item</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Status</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Preco</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Base</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Artwork</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Publicado em</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Atualizado</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.catalogItemId} className="border-b border-ruah-100 align-top">
                    <td className="p-3">
                      <p className="text-sm font-semibold text-ruah-900">{row.name}</p>
                      <p className="text-[11px] uppercase tracking-wider text-ruah-400">{row.catalogItemId}</p>
                    </td>
                    <td className="p-3 text-xs font-bold uppercase text-ruah-700">{row.publicationStatus}</td>
                    <td className="p-3 text-xs text-ruah-500">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.price)}
                    </td>
                    <td className="p-3 text-xs text-ruah-500">{row.productBaseId}</td>
                    <td className="p-3 text-xs text-ruah-500">{row.artworkId}</td>
                    <td className="p-3 text-xs text-ruah-500">{row.publishedAt ? new Date(row.publishedAt).toLocaleString('pt-BR') : 'n/a'}</td>
                    <td className="p-3 text-xs text-ruah-500">{new Date(row.updatedAt).toLocaleString('pt-BR')}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={row.publicationStatus !== 'draft' || Boolean(actionLoading[row.catalogItemId])}
                          onClick={() => void runCatalogAction(row.catalogItemId, 'ready', 'admin_master_catalog_ready')}
                          className="rounded-lg border border-ruah-200 px-2 py-1 text-[10px] font-bold uppercase disabled:opacity-40"
                        >
                          Ready
                        </button>
                        <button
                          disabled={row.publicationStatus !== 'ready' || Boolean(actionLoading[row.catalogItemId])}
                          onClick={() => void runCatalogAction(row.catalogItemId, 'publish', 'admin_master_catalog_publish')}
                          className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold uppercase text-white disabled:opacity-40"
                        >
                          Publicar
                        </button>
                        <button
                          disabled={row.publicationStatus !== 'published' || Boolean(actionLoading[row.catalogItemId])}
                          onClick={() => void runCatalogAction(row.catalogItemId, 'unpublish', 'admin_master_catalog_unpublish')}
                          className="rounded-lg bg-amber-600 px-2 py-1 text-[10px] font-bold uppercase text-white disabled:opacity-40"
                        >
                          Arquivar
                        </button>
                        <button
                          disabled={row.publicationStatus !== 'archived' || Boolean(actionLoading[row.catalogItemId])}
                          onClick={() => void runCatalogAction(row.catalogItemId, 'reopen', 'admin_master_catalog_reopen')}
                          className="rounded-lg bg-blue-600 px-2 py-1 text-[10px] font-bold uppercase text-white disabled:opacity-40"
                        >
                          Reabrir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-xs font-semibold uppercase tracking-wider text-ruah-400">
                      Nenhum item encontrado para o filtro atual.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
