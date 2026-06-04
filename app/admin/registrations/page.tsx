'use client';

import React from 'react';
import Link from 'next/link';

type Row = {
  registrationId: string;
  userId: string;
  role: string;
  persona: string;
  status: string;
  fullName: string;
  email: string;
  updatedAt: string;
  createdAt: string;
  metadata?: {
    lastReminderAt?: string;
    lastReminderBy?: string;
    lastActionType?: string;
    lastActionReason?: string;
  };
};

const STATUS_OPTIONS = ['all', 'incomplete', 'pending_review', 'active', 'draft', 'blocked'] as const;
const ROLE_OPTIONS = ['all', 'customer', 'artist', 'community_manager'] as const;

export default function AdminRegistrationsPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [status, setStatus] = React.useState<(typeof STATUS_OPTIONS)[number]>('all');
  const [role, setRole] = React.useState<(typeof ROLE_OPTIONS)[number]>('all');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<Record<string, boolean>>({});
  const [quickFilter, setQuickFilter] = React.useState<'all' | 'critical'>('all');
  const [referenceNow, setReferenceNow] = React.useState<number>(0);
  const [actionModal, setActionModal] = React.useState<null | {
    userId: string;
    action: 'send_reminder' | 'set_status';
    status?: string;
    label: string;
  }>(null);
  const [actionReason, setActionReason] = React.useState('');
  const [offset, setOffset] = React.useState(0);
  const [limit] = React.useState(40);
  const [pagination, setPagination] = React.useState<{ total: number; hasNext: boolean; hasPrev: boolean }>({
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (status !== 'all') params.set('status', status);
    if (role !== 'all') params.set('role', role);
    const res = await fetch(`/api/admin/registrations?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) {
      setLoading(false);
      setError('Nao foi possivel carregar a fila de cadastros.');
      return;
    }
    const payload = (await res.json()) as {
      registrations: Row[];
      pagination: { total: number; hasNext: boolean; hasPrev: boolean };
    };
    setRows(payload.registrations);
    setPagination(payload.pagination);
    setReferenceNow(new Date().getTime());
    setLoading(false);
  }, [limit, offset, role, status]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function runAction() {
    if (!actionModal) return;
    if (actionReason.trim().length < 5) {
      setError('Motivo obrigatorio com pelo menos 5 caracteres.');
      return;
    }
    setActionLoading((prev) => ({ ...prev, [actionModal.userId]: true }));
    setError(null);
    const res = await fetch(`/api/admin/registrations/${encodeURIComponent(actionModal.userId)}/actions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        actionModal.action === 'set_status'
          ? { action: actionModal.action, status: actionModal.status, reason: actionReason.trim() }
          : { action: actionModal.action, reason: actionReason.trim() }
      ),
    });
    setActionLoading((prev) => ({ ...prev, [actionModal.userId]: false }));
    if (!res.ok) {
      setError('Nao foi possivel executar a acao operacional deste cadastro.');
      return;
    }
    setActionModal(null);
    setActionReason('');
    await load();
  }

  const visibleRows = React.useMemo(() => {
    if (quickFilter === 'all') return rows;
    return rows.filter((row) => row.status === 'incomplete' && referenceNow - new Date(row.updatedAt).getTime() >= 24 * 60 * 60 * 1000);
  }, [quickFilter, referenceNow, rows]);

  const summary = React.useMemo(() => {
    const incomplete = rows.filter((row) => row.status === 'incomplete').length;
    const blocked = rows.filter((row) => row.status === 'blocked').length;
    const critical24h = rows.filter((row) => row.status === 'incomplete' && referenceNow - new Date(row.updatedAt).getTime() >= 24 * 60 * 60 * 1000).length;
    return { total: rows.length, incomplete, blocked, critical24h };
  }, [referenceNow, rows]);

  return (
    <main className="min-h-screen bg-ruah-25 p-6 md:p-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-ruah-400">Onboarding</p>
            <h1 className="text-3xl font-serif italic text-ruah-950">Fila de Cadastros</h1>
          </div>
          <Link href="/admin" className="px-4 py-2 rounded-xl border border-ruah-200 text-xs font-semibold uppercase tracking-[0.1em]">
            Voltar ao painel
          </Link>
        </div>

        <div className="bg-white border border-ruah-100 rounded-2xl p-4 flex gap-3 flex-wrap">
          <select value={status} onChange={(e) => { setStatus(e.target.value as (typeof STATUS_OPTIONS)[number]); setOffset(0); }} className="px-3 py-2 rounded-lg border border-ruah-200 text-xs font-semibold uppercase tracking-wider">
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select value={role} onChange={(e) => { setRole(e.target.value as (typeof ROLE_OPTIONS)[number]); setOffset(0); }} className="px-3 py-2 rounded-lg border border-ruah-200 text-xs font-semibold uppercase tracking-wider">
            {ROLE_OPTIONS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <button onClick={() => void load()} className="px-4 py-2 rounded-lg bg-ruah-950 text-white text-xs font-bold uppercase tracking-[0.1em]">
            Atualizar
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams({ limit: '1200' });
              if (status !== 'all') params.set('status', status);
              if (role !== 'all') params.set('role', role);
              if (quickFilter === 'critical') params.set('quick', 'critical');
              params.set('offset', String(offset));
              params.set('limit', String(limit));
              window.open(`/api/admin/registrations/export?${params.toString()}`, '_blank');
            }}
            className="px-4 py-2 rounded-lg border border-ruah-200 text-xs font-bold uppercase tracking-[0.1em]"
          >
            Exportar CSV
          </button>
          <button onClick={() => { setQuickFilter('all'); setOffset(0); }} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-[0.1em] ${quickFilter === 'all' ? 'bg-ruah-950 text-white' : 'bg-ruah-50 text-ruah-700'}`}>
            Todos
          </button>
          <button onClick={() => { setQuickFilter('critical'); setOffset(0); }} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-[0.1em] ${quickFilter === 'critical' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}>
            Criticos 24h+
          </button>
        </div>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-ruah-100 bg-white p-4 text-xs">Total <b>{summary.total}</b></div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs">Incomplete <b>{summary.incomplete}</b></div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs">Criticos 24h+ <b>{summary.critical24h}</b></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">Blocked <b>{summary.blocked}</b></div>
        </section>

        {error && <p className="text-xs font-semibold uppercase tracking-wider text-red-600">{error}</p>}
        {loading ? <p className="text-xs font-semibold uppercase tracking-wider text-ruah-400">Carregando...</p> : null}
        {!loading && (
          <div className="flex items-center justify-between text-xs text-ruah-500">
            <span>
              Exibindo {rows.length} de {pagination.total} registros
            </span>
            <div className="flex gap-2">
              <button
                disabled={!pagination.hasPrev}
                onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                className="px-3 py-1 rounded border border-ruah-200 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                disabled={!pagination.hasNext}
                onClick={() => setOffset((prev) => prev + limit)}
                className="px-3 py-1 rounded border border-ruah-200 disabled:opacity-40"
              >
                Proxima
              </button>
            </div>
          </div>
        )}

        <div className="bg-white border border-ruah-100 rounded-2xl overflow-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-ruah-100 bg-ruah-50 text-left">
                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Nome</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Email</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Papel</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Persona</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Status</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Ultimo lembrete</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Ultima acao</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Ultimo motivo</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Atualizado</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-ruah-400">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.registrationId} className="border-b border-ruah-100">
                  <td className="p-3 text-sm font-semibold text-ruah-900">{row.fullName}</td>
                  <td className="p-3 text-xs text-ruah-500">{row.email}</td>
                  <td className="p-3 text-xs font-semibold uppercase">{row.role}</td>
                  <td className="p-3 text-xs font-semibold uppercase">{row.persona}</td>
                  <td className="p-3 text-xs font-bold uppercase">{row.status}</td>
                  <td className="p-3 text-xs text-ruah-500">
                    {row.metadata?.lastReminderAt ? (
                      <div>
                        <p>{new Date(row.metadata.lastReminderAt).toLocaleString('pt-BR')}</p>
                        <p className="text-[10px] uppercase tracking-wider">{row.metadata.lastReminderBy ?? 'system'}</p>
                      </div>
                    ) : (
                      <span className="text-ruah-300">nunca</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-ruah-500 uppercase">{row.metadata?.lastActionType ?? 'n/a'}</td>
                  <td className="p-3 text-xs text-ruah-500">{row.metadata?.lastActionReason ?? 'n/a'}</td>
                  <td className="p-3 text-xs text-ruah-500">{new Date(row.updatedAt).toLocaleString('pt-BR')}</td>
                  <td className="p-3 text-xs">
                    <div className="flex gap-2">
                      <button
                        disabled={Boolean(actionLoading[row.userId])}
                        onClick={() => {
                          setActionModal({ userId: row.userId, action: 'send_reminder', label: 'Enviar lembrete' });
                          setActionReason('');
                        }}
                        className="px-2 py-1 rounded bg-blue-600 text-white text-[10px] font-bold uppercase disabled:opacity-50"
                      >
                        Lembrar
                      </button>
                      <button
                        disabled={Boolean(actionLoading[row.userId])}
                        onClick={() => {
                          setActionModal({ userId: row.userId, action: 'set_status', status: 'blocked', label: 'Bloquear cadastro' });
                          setActionReason('');
                        }}
                        className="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-bold uppercase disabled:opacity-50"
                      >
                        Bloquear
                      </button>
                      <button
                        disabled={Boolean(actionLoading[row.userId])}
                        onClick={() => {
                          setActionModal({ userId: row.userId, action: 'set_status', status: 'active', label: 'Reativar cadastro' });
                          setActionReason('');
                        }}
                        className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase disabled:opacity-50"
                      >
                        Reativar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleRows.length === 0 && !loading ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-xs font-semibold uppercase tracking-wider text-ruah-400">
                    Nenhum cadastro encontrado para os filtros atuais.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      {actionModal && (
        <div className="fixed inset-0 z-modal bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-ruah-100 p-6 flex flex-col gap-4">
            <h2 className="text-lg font-serif italic text-ruah-950">{actionModal.label}</h2>
            <p className="text-xs text-ruah-500 uppercase tracking-wider">Informe o motivo obrigatorio para auditoria:</p>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="w-full h-28 rounded-xl border border-ruah-200 p-3 text-sm"
              placeholder="Ex: contato ativo sem retorno ha 7 dias."
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setActionModal(null);
                  setActionReason('');
                }}
                className="px-4 py-2 rounded-lg border border-ruah-200 text-xs font-semibold uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button type="button" onClick={() => void runAction()} className="px-4 py-2 rounded-lg bg-ruah-950 text-white text-xs font-bold uppercase tracking-wider">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
