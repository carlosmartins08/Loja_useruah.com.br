'use client';

import React from 'react';
import Link from 'next/link';

interface OpsAlert {
  id: string;
  action: string;
  success: boolean;
  createdAt: string;
  errorMessage?: string;
  responsePayload?: Record<string, unknown>;
  isOverdue: boolean;
  state: {
    alertId: string;
    workflowStatus: 'new' | 'in_progress' | 'resolved';
    owner: string;
    note?: string;
    updatedAt: string;
    updatedBy: string;
  };
}

interface OpsAlertsResponse {
  ok: true;
  summary: {
    total: number;
    impactAlerts: number;
    payoutRiskAlerts: number;
    overdueOpsAlerts: number;
    critical: number;
    open: number;
    inProgress: number;
    resolved: number;
    overdue: number;
    sla: {
      newHours: number;
      inProgressHours: number;
    };
  };
  alerts: OpsAlert[];
}

function severityFromAction(action: string) {
  if (action === 'ops_alerts.alert.overdue') return 'CRITICAL';
  if (action === 'payout_batch_settlement.alert.at_risk') return 'CRITICAL';
  if (action.endsWith('created_overdue')) return 'HIGH';
  if (action.endsWith('rejected')) return 'HIGH';
  return 'MEDIUM';
}

function severityRank(level: string) {
  if (level === 'CRITICAL') return 1;
  if (level === 'HIGH') return 2;
  return 3;
}

export default function OpsAlertsPage() {
  const [data, setData] = React.useState<OpsAlertsResponse | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [drafts, setDrafts] = React.useState<Record<string, { workflowStatus: 'new' | 'in_progress' | 'resolved'; owner: string; note: string }>>({});
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});
  const [quickFilter, setQuickFilter] = React.useState<'all' | 'critical' | 'overdue' | 'open'>('all');

  const load = React.useCallback(async () => {
    setMessage(null);
    const res = await fetch('/api/admin/ops-alerts?limit=60', { cache: 'no-store' });
    if (!res.ok) {
      setMessage('Falha ao carregar alertas operacionais.');
      return;
    }
    const payload = (await res.json()) as OpsAlertsResponse;
    setData(payload);
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const prioritizedAlerts = React.useMemo(() => {
    const rows = data?.alerts ?? [];
    return rows
      .slice()
      .sort((a, b) => {
        const sa = severityRank(severityFromAction(a.action));
        const sb = severityRank(severityFromAction(b.action));
        if (sa !== sb) return sa - sb;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [data?.alerts]);

  const filteredAlerts = React.useMemo(() => {
    if (quickFilter === 'all') return prioritizedAlerts;
    if (quickFilter === 'critical') return prioritizedAlerts.filter((row) => severityFromAction(row.action) === 'CRITICAL');
    if (quickFilter === 'overdue') return prioritizedAlerts.filter((row) => row.isOverdue);
    return prioritizedAlerts.filter((row) => row.state.workflowStatus !== 'resolved');
  }, [prioritizedAlerts, quickFilter]);

  async function saveRow(row: OpsAlert) {
    const draft = drafts[row.id] ?? {
      workflowStatus: row.state.workflowStatus,
      owner: row.state.owner || 'finance_admin',
      note: row.state.note ?? '',
    };
    setSaving((prev) => ({ ...prev, [row.id]: true }));
    const res = await fetch(`/api/admin/ops-alerts/${encodeURIComponent(row.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    setSaving((prev) => ({ ...prev, [row.id]: false }));
    if (!res.ok) {
      setMessage('Falha ao salvar estado operacional do alerta.');
      return;
    }
    await load();
  }

  return (
    <main className='min-h-screen bg-ruah-25 p-6 md:p-10'>
      <div className='max-w-6xl mx-auto flex flex-col gap-6'>
        <header className='bg-white rounded-3xl border border-ruah-100 p-8 flex items-center justify-between gap-4 flex-wrap'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-400'>Admin / Ops</p>
            <h1 className='text-3xl font-serif italic uppercase text-ruah-950'>Unified Ops Alerts</h1>
            <p className='text-xs font-semibold uppercase tracking-[0.1em] text-ruah-500 mt-3'>
              Fila unica: Impact Review + Payout At Risk
            </p>
          </div>
          <div className='flex gap-2'>
            <button type='button' onClick={() => void load()} className='px-4 py-2 rounded-xl border border-ruah-200 text-xs font-semibold uppercase tracking-[0.1em]'>
              Atualizar
            </button>
            <Link href='/admin' className='px-4 py-2 rounded-xl bg-ruah-950 text-white text-xs font-semibold uppercase tracking-[0.1em]'>
              Voltar
            </Link>
          </div>
        </header>

        {data && (
          <section className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            <div className='rounded-2xl border border-ruah-100 bg-white p-4 text-xs'>Total <b>{data.summary.total}</b></div>
            <div className='rounded-2xl border border-ruah-100 bg-white p-4 text-xs'>Impact <b>{data.summary.impactAlerts}</b></div>
            <div className='rounded-2xl border border-ruah-100 bg-white p-4 text-xs'>Payout Risk <b>{data.summary.payoutRiskAlerts}</b></div>
            <div className='rounded-2xl border border-red-200 bg-red-50 p-4 text-xs'>Critical <b>{data.summary.critical}</b></div>
          </section>
        )}
        {data && (
          <section className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            <div className='rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs'>Overdue Ops Alerts <b>{data.summary.overdueOpsAlerts}</b></div>
          </section>
        )}
        {data && (
          <section className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            <div className='rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs'>Open <b>{data.summary.open}</b></div>
            <div className='rounded-2xl border border-blue-200 bg-blue-50 p-3 text-xs'>In Progress <b>{data.summary.inProgress}</b></div>
            <div className='rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs'>Resolved <b>{data.summary.resolved}</b></div>
            <div className='rounded-2xl border border-red-300 bg-red-50 p-3 text-xs'>Overdue <b>{data.summary.overdue}</b></div>
          </section>
        )}
        {data && (
          <section className='rounded-2xl border border-ruah-100 bg-white p-3 text-xs'>
            SLA ativo: <b>new={data.summary.sla.newHours}h</b> | <b>in_progress={data.summary.sla.inProgressHours}h</b>
          </section>
        )}

        {message && <p className='text-xs text-red-600'>{message}</p>}

        <section className='bg-white rounded-3xl border border-ruah-100 p-6 overflow-x-auto'>
          <div className='flex items-center gap-2 mb-3 flex-wrap'>
            <button
              type='button'
              onClick={() => setQuickFilter('all')}
              className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.08em] ${quickFilter === 'all' ? 'bg-ruah-950 text-white' : 'bg-ruah-50 text-ruah-600'}`}
            >
              Todos
            </button>
            <button
              type='button'
              onClick={() => setQuickFilter('critical')}
              className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.08em] ${quickFilter === 'critical' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'}`}
            >
              Só críticos
            </button>
            <button
              type='button'
              onClick={() => setQuickFilter('overdue')}
              className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.08em] ${quickFilter === 'overdue' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}
            >
              Só overdue
            </button>
            <button
              type='button'
              onClick={() => setQuickFilter('open')}
              className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.08em] ${quickFilter === 'open' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'}`}
            >
              Abertos
            </button>
          </div>
          <table className='w-full text-xs'>
            <thead>
              <tr className='text-left text-ruah-500 uppercase'>
                <th className='py-2'>Data</th>
                <th className='py-2'>Severidade</th>
                <th className='py-2'>Acao</th>
                <th className='py-2'>Status</th>
                <th className='py-2'>SLA</th>
                <th className='py-2'>Workflow</th>
                <th className='py-2'>Owner</th>
                <th className='py-2'>Nota</th>
                <th className='py-2'>Ult. Update</th>
                <th className='py-2'>Payload</th>
                <th className='py-2'>Salvar</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((row) => (
                <tr key={row.id} className='border-t border-ruah-100'>
                  <td className='py-2'>{new Date(row.createdAt).toLocaleString('pt-BR', { hour12: false })}</td>
                  <td className='py-2'>{severityFromAction(row.action)}</td>
                  <td className='py-2 font-mono'>{row.action}</td>
                  <td className='py-2'>{row.success ? 'OK' : `FAIL (${row.errorMessage ?? 'n/a'})`}</td>
                  <td className='py-2'>
                    {row.isOverdue ? (
                      <span className='px-2 py-1 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase'>overdue</span>
                    ) : (
                      <span className='px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase'>on_time</span>
                    )}
                  </td>
                  <td className='py-2'>
                    <select
                      value={drafts[row.id]?.workflowStatus ?? row.state.workflowStatus}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [row.id]: {
                            workflowStatus: e.target.value as 'new' | 'in_progress' | 'resolved',
                            owner: prev[row.id]?.owner ?? row.state.owner ?? 'finance_admin',
                            note: prev[row.id]?.note ?? row.state.note ?? '',
                          },
                        }))
                      }
                      className='rounded border border-ruah-200 px-2 py-1 text-[10px]'
                    >
                      <option value='new'>new</option>
                      <option value='in_progress'>in_progress</option>
                      <option value='resolved'>resolved</option>
                    </select>
                  </td>
                  <td className='py-2'>
                    <input
                      value={drafts[row.id]?.owner ?? row.state.owner ?? ''}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [row.id]: {
                            workflowStatus: prev[row.id]?.workflowStatus ?? row.state.workflowStatus,
                            owner: e.target.value,
                            note: prev[row.id]?.note ?? row.state.note ?? '',
                          },
                        }))
                      }
                      className='rounded border border-ruah-200 px-2 py-1 text-[10px] w-32'
                    />
                  </td>
                  <td className='py-2'>
                    <input
                      value={drafts[row.id]?.note ?? row.state.note ?? ''}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [row.id]: {
                            workflowStatus: prev[row.id]?.workflowStatus ?? row.state.workflowStatus,
                            owner: prev[row.id]?.owner ?? row.state.owner ?? '',
                            note: e.target.value,
                          },
                        }))
                      }
                      className='rounded border border-ruah-200 px-2 py-1 text-[10px] w-48'
                    />
                  </td>
                  <td className='py-2'>
                    <div className='text-[10px]'>
                      <p className='font-mono'>{row.state.updatedBy || 'system'}</p>
                      <p>{new Date(row.state.updatedAt).toLocaleString('pt-BR', { hour12: false })}</p>
                    </div>
                  </td>
                  <td className='py-2 max-w-[420px]'>
                    <pre className='whitespace-pre-wrap text-[10px]'>{JSON.stringify(row.responsePayload ?? {}, null, 2)}</pre>
                  </td>
                  <td className='py-2'>
                    <button
                      type='button'
                      onClick={() => void saveRow(row)}
                      disabled={Boolean(saving[row.id])}
                      className='px-2 py-1 rounded bg-ruah-950 text-white text-[10px] font-bold uppercase disabled:opacity-50'
                    >
                      Salvar
                    </button>
                  </td>
                </tr>
              ))}
              {data && filteredAlerts.length === 0 && (
                <tr>
                  <td className='py-3 text-ruah-500' colSpan={11}>Sem alertas para o filtro selecionado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
