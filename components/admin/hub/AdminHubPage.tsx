'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, CalendarDays, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { useUser } from '@/context/UserContext';

type CockpitSummary = {
  gmv: number;
  paidOrders: number;
  shippedOrders: number;
  delayedOrders: number;
  campaignsAtRisk: number;
  supplierAlerts: number;
  pendingPayouts: number;
  criticalTickets: number;
  pendingImpactAlerts: number;
  overdueImpactAlerts: number;
  checkoutConversionPct: number;
  refunds: number;
  chargebacks: number;
};

const TREND_POINTS = [28, 44, 36, 52, 40, 58, 48, 66, 53, 61, 47, 70];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

function KpiCard({
  label,
  value,
  delta,
  positive = true,
}: {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#ececf6] bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7d8197]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#1d2033]">{value}</p>
      <p className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {delta}
      </p>
    </div>
  );
}

function TrendChart() {
  return (
    <div className="rounded-2xl border border-[#ececf6] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#1d2033]">Tendencia operacional (12 ciclos)</p>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7d8197]">tempo real</span>
      </div>
      <div className="mt-4 h-44 w-full">
        <div className="grid h-full grid-cols-12 items-end gap-2">
          {TREND_POINTS.map((point, index) => (
            <div key={index} className="flex h-full flex-col justify-end">
              <div
                className="rounded-t-md bg-gradient-to-t from-[#5f67f8] to-[#7fa6ff]"
                style={{ height: `${point}%` }}
                aria-label={`ponto-${index + 1}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionQueue({
  summary,
}: {
  summary: CockpitSummary | null;
}) {
  return (
    <div className="rounded-2xl border border-[#ececf6] bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-[#1d2033]">Fila de decisao</p>
      <div className="mt-3 space-y-2">
        <Link href="/admin/impact-reviews?scope=campaigns" className="flex items-center justify-between rounded-xl border border-[#eef0fb] p-3 hover:bg-[#f8f9ff]">
          <div>
            <p className="text-xs font-bold text-[#1d2033]">Moderar campanhas em revisao</p>
            <p className="text-[11px] text-[#6d7289]">{summary?.campaignsAtRisk ?? 0} campanhas exigem decisao ou acompanhamento</p>
          </div>
          <span className="text-xs font-bold text-[#4f57e8]">abrir</span>
        </Link>
        <Link href="/admin/catalog" className="flex items-center justify-between rounded-xl border border-[#eef0fb] p-3 hover:bg-[#f8f9ff]">
          <div>
            <p className="text-xs font-bold text-[#1d2033]">Revisar pendências do catálogo</p>
            <p className="text-[11px] text-[#6d7289]">{summary?.pendingImpactAlerts ?? 0} itens aguardando publicação ou ajuste</p>
          </div>
          <span className="text-xs font-bold text-[#4f57e8]">abrir</span>
        </Link>
        <Link href="/support" className="flex items-center justify-between rounded-xl border border-[#eef0fb] p-3 hover:bg-[#f8f9ff]">
          <div>
            <p className="text-xs font-bold text-[#1d2033]">Priorizar tickets criticos</p>
            <p className="text-[11px] text-[#6d7289]">{summary?.criticalTickets ?? 0} tickets sem resolucao</p>
          </div>
          <span className="text-xs font-bold text-[#4f57e8]">abrir</span>
        </Link>
        <Link href="/production/jobs" className="flex items-center justify-between rounded-xl border border-[#eef0fb] p-3 hover:bg-[#f8f9ff]">
          <div>
            <p className="text-xs font-bold text-[#1d2033]">Fechar ciclo de envio</p>
            <p className="text-[11px] text-[#6d7289]">{summary?.shippedOrders ?? 0} pedidos enviados no ciclo atual</p>
          </div>
          <span className="text-xs font-bold text-[#4f57e8]">abrir</span>
        </Link>
      </div>
    </div>
  );
}

export default function AdminHubPage() {
  const { userName, userRole } = useUser();
  const [summary, setSummary] = React.useState<CockpitSummary | null>(null);

  React.useEffect(() => {
    let active = true;
    const run = async () => {
      const res = await fetch('/api/admin/cockpit/summary', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as { summary: CockpitSummary };
      if (active) setSummary(data.summary);
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen rounded-3xl border border-[#e6e8f5] bg-[#f4f5fb] p-4 md:p-6">
      <header className="rounded-2xl border border-[#ececf6] bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-xl border border-[#ececf6] bg-[#fafbff] px-3 py-2">
            <Search size={15} className="text-[#7d8197]" />
            <input
              className="w-full bg-transparent text-sm text-[#1d2033] outline-none placeholder:text-[#a0a4b8]"
              placeholder="Buscar pedido, cliente, ticket, payout..."
              aria-label="busca-global-admin"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-full border border-[#ececf6] bg-white p-2 text-[#7d8197] hover:bg-[#f8f9ff]" aria-label="notificacoes">
              <Bell size={16} />
            </button>
            <div className="text-right">
              <p className="text-sm font-bold text-[#1d2033]">{userName}</p>
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#7d8197]">{userRole}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-9 space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Receita bruta" value={formatCurrency(summary?.gmv ?? 0)} delta="ciclo atual" />
            <KpiCard label="Pedidos pagos" value={String(summary?.paidOrders ?? 0)} delta="+1.4%" />
            <KpiCard label="Pagamentos com falha" value={String(summary?.refunds ?? 0)} delta="monitorar" positive={false} />
            <KpiCard label="Pedidos enviados" value={String(summary?.shippedOrders ?? 0)} delta="+1.0%" />
          </div>

          <TrendChart />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[#ececf6] bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-[#1d2033]">Saude da operacao Fase 1</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-[#eef0fb] p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#7d8197]">Pedidos atrasados</p>
                  <p className="mt-1 text-xl font-black text-[#1d2033]">{summary?.delayedOrders ?? 0}</p>
                </div>
                <div className="rounded-xl border border-[#eef0fb] p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#7d8197]">Fornecedores em alerta</p>
                  <p className="mt-1 text-xl font-black text-[#1d2033]">{summary?.supplierAlerts ?? 0}</p>
                </div>
                <div className="rounded-xl border border-[#eef0fb] p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#7d8197]">Tickets criticos</p>
                  <p className="mt-1 text-xl font-black text-[#1d2033]">{summary?.criticalTickets ?? 0}</p>
                </div>
                <div className="rounded-xl border border-[#eef0fb] p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#7d8197]">Checkout</p>
                  <p className="mt-1 text-xl font-black text-[#1d2033]">{summary?.checkoutConversionPct ?? 0}%</p>
                </div>
              </div>
            </div>
            <ActionQueue summary={summary} />
          </div>
        </div>

        <aside className="xl:col-span-3 space-y-3">
          <div className="rounded-2xl border border-[#ececf6] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#1d2033]">Agenda de hoje</p>
              <CalendarDays size={16} className="text-[#7d8197]" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="rounded-xl border border-[#eef0fb] p-3">
                <p className="text-xs font-bold text-[#1d2033]">09:00 - Revisao de pedidos</p>
                <p className="text-[11px] text-[#6d7289]">Fila de envio e pendencias logisticas.</p>
              </div>
              <div className="rounded-xl border border-[#eef0fb] p-3">
                <p className="text-xs font-bold text-[#1d2033]">11:30 - Publicacao de catalogo</p>
                <p className="text-[11px] text-[#6d7289]">Revisar itens prontos antes de publicar.</p>
              </div>
              <div className="rounded-xl border border-[#eef0fb] p-3">
                <p className="text-xs font-bold text-[#1d2033]">15:00 - Envio e rastreio</p>
                <p className="text-[11px] text-[#6d7289]">Atualizar producao, transportadora e rastreio.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#ececf6] bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-[#1d2033]">Alertas imediatos</p>
            <div className="mt-3 space-y-2">
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                {summary?.criticalTickets ?? 0} tickets exigem resposta
              </p>
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                {summary?.delayedOrders ?? 0} pedidos atrasados no ciclo
              </p>
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                {summary?.pendingImpactAlerts ?? 0} itens aguardando publicacao ou ajuste
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
