'use client';

import React from 'react';

type PayoutStatus = 'requested' | 'under_review' | 'approved' | 'paid' | 'rejected';

interface PayoutRow {
  payoutId: string;
  ownerId: string;
  ownerRole: 'artist' | 'community_manager';
  amount: number;
  currency: 'BRL';
  status: PayoutStatus;
  createdAt: string;
}

interface ReconciliationResponse {
  ok: boolean;
  payout?: PayoutRow;
  detail?: string;
  error?: string;
  reconciliation?: Record<string, unknown>;
}

interface BatchHistoryLog {
  id: string;
  action: string;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
  responsePayload?: {
    successCount?: number;
    failCount?: number;
    results?: Array<{ payoutId: string; ok: boolean; detail: string }>;
  };
}

interface BatchMetricsResponse {
  ok: true;
  summary: {
    logs: number;
    totalItems: number;
    totalSuccess: number;
    totalFailed: number;
    failureRate: number;
    atRiskCodes: number;
    alertStatus: 'OK' | 'AT_RISK';
  };
  failureCodes: Array<{
    failureCode: string;
    count: number;
    high: number;
    medium: number;
    low: number;
    threshold: number;
    atRisk: boolean;
  }>;
}

function payoutPriority(row: PayoutRow) {
  if (row.status === 'approved') return 1;
  if (row.status === 'under_review') return 2;
  if (row.status === 'requested') return 3;
  if (row.status === 'rejected') return 4;
  return 5;
}

export default function AdminFinancePayoutsPage() {
  const [rows, setRows] = React.useState<PayoutRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<'all' | PayoutStatus>('approved');
  const [selectedPayoutId, setSelectedPayoutId] = React.useState('');
  const [precheck, setPrecheck] = React.useState<ReconciliationResponse | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [running, setRunning] = React.useState<Record<string, boolean>>({});
  const [quickReadiness, setQuickReadiness] = React.useState<Record<string, { ready: boolean; detail?: string }>>({});
  const [selectedBatch, setSelectedBatch] = React.useState<Record<string, boolean>>({});
  const [batchRunning, setBatchRunning] = React.useState(false);
  const [batchReport, setBatchReport] = React.useState<
    Array<{
      payoutId: string;
      ok: boolean;
      detail: string;
      failureCode?: string;
      playbookAction?: string;
      playbookOwner?: string;
      playbookSeverity?: string;
      reconciliation?: Record<string, unknown>;
    }>
  >([]);
  const [batchHistory, setBatchHistory] = React.useState<BatchHistoryLog[]>([]);
  const [historyStatusFilter, setHistoryStatusFilter] = React.useState<'all' | 'success' | 'failed'>('all');
  const [historyDateFrom, setHistoryDateFrom] = React.useState('');
  const [historyDateTo, setHistoryDateTo] = React.useState('');
  const [metrics, setMetrics] = React.useState<BatchMetricsResponse | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const query = statusFilter === 'all' ? '/api/admin/payouts' : `/api/admin/payouts?status=${encodeURIComponent(statusFilter)}`;
    const res = await fetch(query, { cache: 'no-store' });
    if (!res.ok) {
      setRows([]);
      setMessage('Falha ao carregar payouts.');
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { ok: true; payouts: PayoutRow[] };
    const sorted = data.payouts
      .slice()
      .sort((a, b) => {
        const p = payoutPriority(a) - payoutPriority(b);
        if (p !== 0) return p;
        if (a.status === 'approved' && b.status === 'approved') return b.amount - a.amount;
        return b.createdAt.localeCompare(a.createdAt);
      });
    setRows(sorted);
    setLoading(false);
  }, [statusFilter]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function runPrecheck() {
    const id = selectedPayoutId.trim();
    if (!id) return;
    setPrecheck(null);
    setMessage(null);
    const res = await fetch(`/api/payouts/${encodeURIComponent(id)}/reconciliation`, { cache: 'no-store' });
    if (!res.ok) {
      setMessage('Nao foi possivel validar a pre-liquidacao.');
      return;
    }
    const data = (await res.json()) as ReconciliationResponse;
    setPrecheck(data);
  }

  React.useEffect(() => {
    let active = true;
    async function loadQuickReadiness() {
      const approved = rows.filter((row) => row.status === 'approved').slice(0, 8);
      if (approved.length === 0) {
        if (active) setQuickReadiness({});
        return;
      }
      const pairs = await Promise.all(
        approved.map(async (row) => {
          const res = await fetch(`/api/payouts/${encodeURIComponent(row.payoutId)}/reconciliation`, { cache: 'no-store' });
          if (!res.ok) return [row.payoutId, { ready: false, detail: 'precheck_unavailable' }] as const;
          const data = (await res.json()) as ReconciliationResponse;
          return [row.payoutId, { ready: data.ok, detail: data.detail }] as const;
        })
      );
      if (!active) return;
      setQuickReadiness(Object.fromEntries(pairs));
    }
    void loadQuickReadiness();
    return () => {
      active = false;
    };
  }, [rows]);

  const loadBatchHistory = React.useCallback(async () => {
    const params = new URLSearchParams({ limit: '20' });
    if (historyStatusFilter === 'success') params.set('success', 'true');
    if (historyStatusFilter === 'failed') params.set('success', 'false');
    if (historyDateFrom) params.set('dateFrom', new Date(`${historyDateFrom}T00:00:00`).toISOString());
    if (historyDateTo) params.set('dateTo', new Date(`${historyDateTo}T23:59:59`).toISOString());
    const res = await fetch(`/api/admin/payouts/batch-settlement/history?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as { ok: true; logs: BatchHistoryLog[] };
    setBatchHistory(data.logs);
  }, [historyDateFrom, historyDateTo, historyStatusFilter]);

  const loadMetrics = React.useCallback(async () => {
    const params = new URLSearchParams();
    if (historyDateFrom) params.set('dateFrom', new Date(`${historyDateFrom}T00:00:00`).toISOString());
    if (historyDateTo) params.set('dateTo', new Date(`${historyDateTo}T23:59:59`).toISOString());
    const res = await fetch(`/api/admin/payouts/batch-settlement/metrics?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as BatchMetricsResponse;
    setMetrics(data);
  }, [historyDateFrom, historyDateTo]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBatchHistory();
  }, [loadBatchHistory]);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMetrics();
  }, [loadMetrics]);

  async function executePayoutAction(payoutId: string, action: 'start-review' | 'approve' | 'mark-paid') {
    setMessage(null);
    setRunning((prev) => ({ ...prev, [`${payoutId}:${action}`]: true }));
    const response = await fetch(`/api/payouts/${encodeURIComponent(payoutId)}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    setRunning((prev) => ({ ...prev, [`${payoutId}:${action}`]: false }));

    if (!response.ok) {
      const detail = typeof data?.detail === 'string' ? ` (${data.detail})` : '';
      setMessage(`Acao ${action} falhou${detail}.`);
      if (selectedPayoutId === payoutId) {
        await runPrecheck();
      }
      await load();
      return;
    }

    setMessage(`Acao ${action} aplicada em ${payoutId}.`);
    if (selectedPayoutId === payoutId || action === 'mark-paid') {
      await runPrecheck();
    }
    await load();
  }

  async function runBatchSettlement() {
    if (batchRunning) return;
    const candidates = rows.filter((row) => selectedBatch[row.payoutId]);
    if (candidates.length === 0) {
      setMessage('Selecione ao menos um payout para lote.');
      return;
    }
    setBatchRunning(true);
    setBatchReport([]);
    setMessage(null);

    const prefiltered = candidates.filter((row) => row.status === 'approved' && quickReadiness[row.payoutId]?.ready);
    const skipped = candidates
      .filter((row) => !(row.status === 'approved' && quickReadiness[row.payoutId]?.ready))
      .map((row) => ({
        payoutId: row.payoutId,
        ok: false,
        detail: row.status !== 'approved' ? 'status_not_approved' : quickReadiness[row.payoutId]?.detail ?? 'not_ready',
        failureCode: row.status !== 'approved' ? 'status_not_approved' : quickReadiness[row.payoutId]?.detail ?? 'not_ready',
        playbookAction: row.status !== 'approved' ? 'Concluir aprovacao financeira antes de liquidar.' : 'Executar precheck e resolver bloqueios antes de liquidar.',
        playbookOwner: 'finance_admin',
        playbookSeverity: row.status !== 'approved' ? 'low' : 'medium',
        reconciliation: undefined,
      }));

    if (prefiltered.length === 0) {
      setBatchRunning(false);
      setBatchReport(skipped);
      setMessage('Nenhum payout elegivel para liquidacao em lote.');
      return;
    }

    const response = await fetch('/api/admin/payouts/batch-settlement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payoutIds: prefiltered.map((row) => row.payoutId) }),
    });
    const data = (await response.json().catch(() => null)) as
      | {
          ok: true;
          results: Array<{
            payoutId: string;
            ok: boolean;
            detail: string;
            failureCode?: string;
            playbookAction?: string;
            playbookOwner?: string;
            playbookSeverity?: string;
            reconciliation?: Record<string, unknown>;
          }>;
          summary: { total: number; successCount: number; failCount: number };
        }
      | null;

    setBatchRunning(false);
    setSelectedBatch({});
    if (!response.ok || !data) {
      setBatchReport(skipped);
      setMessage('Falha ao executar lote no backend.');
      await load();
      return;
    }

    setBatchReport([...data.results, ...skipped]);
    setMessage(`Lote concluido: ${data.summary.successCount} sucesso(s), ${data.summary.failCount + skipped.length} falha(s).`);
    await load();
    await loadBatchHistory();
    await loadMetrics();
  }

  return (
    <main className='min-h-screen bg-ruah-25 p-6 md:p-10'>
      <div className='max-w-6xl mx-auto flex flex-col gap-6'>
        <header className='bg-white rounded-3xl border border-ruah-100 p-8'>
          <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>Finance / Payout</p>
          <h1 className='text-3xl font-serif italic uppercase text-ruah-950'>Pre-liquidacao de Saques</h1>
          <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500 mt-3'>
            Validacao de ledger antes do mark-paid, com causa operacional e acao sugerida.
          </p>
        </header>

        <section className='bg-white rounded-3xl border border-ruah-100 p-6 flex flex-col gap-4'>
          <div className='flex items-center justify-between gap-3 flex-wrap'>
            <p className='text-xs font-bold uppercase tracking-[0.1em] text-ruah-500'>Fila e Acoes</p>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => {
                  const approvedReady = rows.filter((row) => row.status === 'approved' && quickReadiness[row.payoutId]?.ready);
                  const next: Record<string, boolean> = {};
                  for (const row of approvedReady) next[row.payoutId] = true;
                  setSelectedBatch(next);
                }}
                className='px-3 py-2 rounded-xl bg-ruah-50 text-ruah-700 text-[10px] font-bold uppercase tracking-[0.08em]'
              >
                Selecionar Prontos
              </button>
              <button
                type='button'
                onClick={() => void runBatchSettlement()}
                disabled={batchRunning}
                className='px-3 py-2 rounded-xl bg-amber-600 text-white text-[10px] font-bold uppercase tracking-[0.08em] disabled:opacity-50'
              >
                {batchRunning ? 'Processando lote...' : 'Liquidar Lote'}
              </button>
            </div>
          </div>
          <div className='flex items-center gap-2 flex-wrap'>
            {(['approved', 'requested', 'under_review', 'paid', 'rejected', 'all'] as const).map((item) => (
              <button
                key={item}
                type='button'
                onClick={() => setStatusFilter(item)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-[0.1em] ${
                  statusFilter === item ? 'bg-ruah-950 text-white' : 'bg-ruah-50 text-ruah-600'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-left text-ruah-500 uppercase text-xs'>
                  <th className='py-2'>Payout</th>
                  <th className='py-2'>Lote</th>
                  <th className='py-2'>Owner</th>
                  <th className='py-2'>Valor</th>
                  <th className='py-2'>Status</th>
                  <th className='py-2'>Readiness</th>
                  <th className='py-2'>Criado em</th>
                  <th className='py-2'>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.payoutId} className='border-t border-ruah-100'>
                    <td className='py-2 font-mono text-xs'>{row.payoutId}</td>
                    <td className='py-2'>
                      <input
                        type='checkbox'
                        checked={Boolean(selectedBatch[row.payoutId])}
                        onChange={(e) => setSelectedBatch((prev) => ({ ...prev, [row.payoutId]: e.target.checked }))}
                      />
                    </td>
                    <td className='py-2'>{row.ownerId} ({row.ownerRole})</td>
                    <td className='py-2'>R$ {row.amount.toFixed(2)}</td>
                    <td className='py-2'>{row.status}</td>
                    <td className='py-2'>
                      {row.status === 'approved' ? (
                        quickReadiness[row.payoutId]?.ready ? (
                          <span className='px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-[0.08em]'>
                            pronto para liquidacao
                          </span>
                        ) : (
                          <span className='px-2 py-1 rounded-lg bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-[0.08em]'>
                            bloqueado ({quickReadiness[row.payoutId]?.detail ?? 'precheck'})
                          </span>
                        )
                      ) : (
                        <span className='px-2 py-1 rounded-lg bg-ruah-100 text-ruah-600 text-[10px] font-bold uppercase tracking-[0.08em]'>
                          n/a
                        </span>
                      )}
                    </td>
                    <td className='py-2'>{new Date(row.createdAt).toLocaleString('pt-BR', { hour12: false })}</td>
                    <td className='py-2'>
                      <div className='flex gap-2 flex-wrap'>
                        {(row.status === 'requested' || row.status === 'under_review') && (
                          <button
                            type='button'
                            onClick={() => void executePayoutAction(row.payoutId, 'start-review')}
                            disabled={Boolean(running[`${row.payoutId}:start-review`])}
                            className='px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-[0.08em] disabled:opacity-50'
                          >
                            start-review
                          </button>
                        )}
                        {(row.status === 'requested' || row.status === 'under_review') && (
                          <button
                            type='button'
                            onClick={() => void executePayoutAction(row.payoutId, 'approve')}
                            disabled={Boolean(running[`${row.payoutId}:approve`])}
                            className='px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-[0.08em] disabled:opacity-50'
                          >
                            approve
                          </button>
                        )}
                        {row.status === 'approved' && (
                          <button
                            type='button'
                            onClick={() => void executePayoutAction(row.payoutId, 'mark-paid')}
                            disabled={Boolean(running[`${row.payoutId}:mark-paid`])}
                            className='px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-[0.08em] disabled:opacity-50'
                          >
                            mark-paid
                          </button>
                        )}
                        <button
                          type='button'
                          onClick={() => {
                            setSelectedPayoutId(row.payoutId);
                            setPrecheck(null);
                            void runPrecheck();
                          }}
                          className='px-2 py-1 rounded-lg bg-ruah-50 text-ruah-700 text-[10px] font-bold uppercase tracking-[0.08em]'
                        >
                          precheck
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td className='py-4 text-ruah-500' colSpan={8}>Sem payouts para o filtro atual.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {batchReport.length > 0 && (
            <div className='rounded-2xl border border-ruah-200 p-3'>
              <p className='text-xs font-bold uppercase tracking-[0.08em] text-ruah-600 mb-2'>Resultado do Lote</p>
              <div className='max-h-48 overflow-auto'>
                <table className='w-full text-xs'>
                  <thead>
                    <tr className='text-left text-ruah-500 uppercase'>
                      <th className='py-1'>Payout</th>
                      <th className='py-1'>Status</th>
                      <th className='py-1'>Detalhe</th>
                      <th className='py-1'>Codigo</th>
                      <th className='py-1'>Playbook</th>
                      <th className='py-1'>Reconciliacao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchReport.map((item) => (
                      <tr key={item.payoutId} className='border-t border-ruah-100'>
                        <td className='py-1 font-mono'>{item.payoutId}</td>
                        <td className='py-1'>{item.ok ? 'OK' : 'FAIL'}</td>
                        <td className='py-1'>{item.detail}</td>
                        <td className='py-1 font-mono'>{item.failureCode ?? '-'}</td>
                        <td className='py-1 max-w-[320px]'>
                          {item.playbookAction ? (
                            <div className='text-[10px]'>
                              <p>{item.playbookAction}</p>
                              <p className='font-mono mt-1'>owner:{item.playbookOwner ?? '-'} severity:{item.playbookSeverity ?? '-'}</p>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className='py-1 max-w-[360px]'>
                          {item.reconciliation ? (
                            <pre className='whitespace-pre-wrap text-[10px]'>{JSON.stringify(item.reconciliation, null, 2)}</pre>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className='bg-white rounded-3xl border border-ruah-100 p-6 flex flex-col gap-4'>
          <p className='text-xs font-bold uppercase tracking-[0.1em] text-ruah-500'>Validador de Pre-liquidacao</p>
          <div className='flex gap-2'>
            <input
              value={selectedPayoutId}
              onChange={(e) => setSelectedPayoutId(e.target.value)}
              className='flex-1 rounded-xl border border-ruah-200 px-3 py-2 text-sm'
              placeholder='PAYOUT-...'
            />
            <button type='button' onClick={runPrecheck} className='rounded-xl bg-ruah-950 text-white px-4 py-2 text-xs font-bold uppercase tracking-[0.1em]'>
              Validar
            </button>
          </div>
          {message && <p className='text-xs text-red-600'>{message}</p>}
          {precheck && (
            <div className={`rounded-2xl border p-4 ${precheck.ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
              <p className='text-xs font-bold uppercase tracking-[0.1em]'>
                {precheck.ok ? 'Pronto para liquidacao' : `Bloqueado: ${precheck.detail}`}
              </p>
              <pre className='mt-2 text-xs whitespace-pre-wrap'>{JSON.stringify(precheck.reconciliation ?? {}, null, 2)}</pre>
            </div>
          )}
        </section>

        <section className='bg-white rounded-3xl border border-ruah-100 p-6 flex flex-col gap-4'>
          <div className='flex items-center justify-between gap-3'>
            <p className='text-xs font-bold uppercase tracking-[0.1em] text-ruah-500'>Historico de Lotes</p>
            <button
              type='button'
              onClick={() => void loadBatchHistory()}
              className='px-3 py-2 rounded-xl border border-ruah-200 text-[10px] font-bold uppercase tracking-[0.08em]'
            >
              Atualizar
            </button>
          </div>
          {batchHistory.length === 0 ? (
            <p className='text-xs text-ruah-500'>Sem execucoes de lote registradas.</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-xs'>
                <thead>
                  <tr className='text-left text-ruah-500 uppercase'>
                    <th className='py-1'>Data</th>
                    <th className='py-1'>Status</th>
                    <th className='py-1'>Sucesso</th>
                    <th className='py-1'>Falha</th>
                    <th className='py-1'>Log</th>
                  </tr>
                </thead>
                <tbody>
                  {batchHistory.map((row) => (
                    <tr key={row.id} className='border-t border-ruah-100'>
                      <td className='py-1'>{new Date(row.createdAt).toLocaleString('pt-BR', { hour12: false })}</td>
                      <td className='py-1'>{row.success ? 'OK' : `PARCIAL/FAIL (${row.errorMessage ?? 'n/a'})`}</td>
                      <td className='py-1'>{row.responsePayload?.successCount ?? 0}</td>
                      <td className='py-1'>{row.responsePayload?.failCount ?? 0}</td>
                      <td className='py-1 font-mono'>{row.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className='flex items-end gap-2 flex-wrap border-t border-ruah-100 pt-3'>
            <div className='flex flex-col gap-1'>
              <label className='text-[10px] uppercase tracking-[0.08em] text-ruah-500'>Status</label>
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value as 'all' | 'success' | 'failed')}
                className='rounded-lg border border-ruah-200 px-2 py-1 text-xs'
              >
                <option value='all'>Todos</option>
                <option value='success'>Sucesso</option>
                <option value='failed'>Falha/Parcial</option>
              </select>
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-[10px] uppercase tracking-[0.08em] text-ruah-500'>De</label>
              <input type='date' value={historyDateFrom} onChange={(e) => setHistoryDateFrom(e.target.value)} className='rounded-lg border border-ruah-200 px-2 py-1 text-xs' />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-[10px] uppercase tracking-[0.08em] text-ruah-500'>Até</label>
              <input type='date' value={historyDateTo} onChange={(e) => setHistoryDateTo(e.target.value)} className='rounded-lg border border-ruah-200 px-2 py-1 text-xs' />
            </div>
            <button
              type='button'
              onClick={() => {
                void loadBatchHistory();
                void loadMetrics();
              }}
              className='px-3 py-2 rounded-xl bg-ruah-950 text-white text-[10px] font-bold uppercase tracking-[0.08em]'
            >
              Aplicar Filtros
            </button>
            <button
              type='button'
              onClick={() => {
                const params = new URLSearchParams();
                if (historyStatusFilter === 'success') params.set('success', 'true');
                if (historyStatusFilter === 'failed') params.set('success', 'false');
                if (historyDateFrom) params.set('dateFrom', new Date(`${historyDateFrom}T00:00:00`).toISOString());
                if (historyDateTo) params.set('dateTo', new Date(`${historyDateTo}T23:59:59`).toISOString());
                window.open(`/api/admin/payouts/batch-settlement/history/export?${params.toString()}`, '_blank');
              }}
              className='px-3 py-2 rounded-xl bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-[0.08em]'
            >
              Exportar CSV (Resumo)
            </button>
            <button
              type='button'
              onClick={() => {
                const params = new URLSearchParams({ format: 'long' });
                if (historyStatusFilter === 'success') params.set('success', 'true');
                if (historyStatusFilter === 'failed') params.set('success', 'false');
                if (historyDateFrom) params.set('dateFrom', new Date(`${historyDateFrom}T00:00:00`).toISOString());
                if (historyDateTo) params.set('dateTo', new Date(`${historyDateTo}T23:59:59`).toISOString());
                window.open(`/api/admin/payouts/batch-settlement/history/export?${params.toString()}`, '_blank');
              }}
              className='px-3 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-[0.08em]'
            >
              Exportar CSV (Detalhado)
            </button>
          </div>
        </section>

        <section className='bg-white rounded-3xl border border-ruah-100 p-6 flex flex-col gap-4'>
          <div className='flex items-center justify-between gap-3'>
            <p className='text-xs font-bold uppercase tracking-[0.1em] text-ruah-500'>Priorizacao Semanal (Failure Codes)</p>
            <button
              type='button'
              onClick={() => void loadMetrics()}
              className='px-3 py-2 rounded-xl border border-ruah-200 text-[10px] font-bold uppercase tracking-[0.08em]'
            >
              Atualizar
            </button>
          </div>
          {metrics ? (
            <>
              <div className='grid grid-cols-2 md:grid-cols-5 gap-2'>
                <div className='rounded-xl border border-ruah-100 p-3 text-xs'>Logs: <b>{metrics.summary.logs}</b></div>
                <div className='rounded-xl border border-ruah-100 p-3 text-xs'>Itens: <b>{metrics.summary.totalItems}</b></div>
                <div className='rounded-xl border border-ruah-100 p-3 text-xs'>Sucesso: <b>{metrics.summary.totalSuccess}</b></div>
                <div className='rounded-xl border border-ruah-100 p-3 text-xs'>Falha: <b>{metrics.summary.totalFailed}</b></div>
                <div className='rounded-xl border border-red-200 bg-red-50 p-3 text-xs'>Taxa falha: <b>{metrics.summary.failureRate}%</b></div>
              </div>
              <div className={`rounded-xl border p-3 text-xs ${metrics.summary.alertStatus === 'AT_RISK' ? 'border-red-300 bg-red-50' : 'border-emerald-300 bg-emerald-50'}`}>
                Status semanal: <b>{metrics.summary.alertStatus}</b> | Códigos em risco: <b>{metrics.summary.atRiskCodes}</b>
              </div>
              <div className='overflow-x-auto'>
                <table className='w-full text-xs'>
                  <thead>
                    <tr className='text-left text-ruah-500 uppercase'>
                      <th className='py-1'>Failure Code</th>
                      <th className='py-1'>Total</th>
                      <th className='py-1'>Threshold</th>
                      <th className='py-1'>Risco</th>
                      <th className='py-1'>High</th>
                      <th className='py-1'>Medium</th>
                      <th className='py-1'>Low</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.failureCodes.map((row) => (
                      <tr key={row.failureCode} className='border-t border-ruah-100'>
                        <td className='py-1 font-mono'>{row.failureCode}</td>
                        <td className='py-1'>{row.count}</td>
                        <td className='py-1'>{row.threshold}</td>
                        <td className='py-1'>{row.atRisk ? 'AT_RISK' : 'OK'}</td>
                        <td className='py-1'>{row.high}</td>
                        <td className='py-1'>{row.medium}</td>
                        <td className='py-1'>{row.low}</td>
                      </tr>
                    ))}
                    {metrics.failureCodes.length === 0 && (
                      <tr>
                        <td className='py-2 text-ruah-500' colSpan={7}>Sem falhas no período selecionado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className='text-xs text-ruah-500'>Carregando métricas...</p>
          )}
        </section>
      </div>
    </main>
  );
}
