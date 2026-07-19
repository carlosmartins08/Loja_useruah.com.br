'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Search } from 'lucide-react';
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

function displayValue(value: number | undefined) {
  return value === undefined ? '—' : String(value);
}

function KpiCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="rounded-2xl border border-[#ececf6] bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7d8197]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#1d2033]">{value}</p>
      <p className="mt-2 text-xs font-semibold text-[#7d8197]">{delta}</p>
    </div>
  );
}

function TrendChart() {
  return (
    <div className="rounded-2xl border border-[#ececf6] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#1d2033]">Histórico operacional</p>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7d8197]">indisponível</span>
      </div>
      <div className="mt-4 flex min-h-44 items-center justify-center rounded-xl border border-dashed border-[#dfe2f0] bg-[#fafbff] p-6 text-center">
        <p className="max-w-md text-xs font-semibold leading-relaxed text-[#6d7289]">
          A série histórica ainda não está conectada a uma fonte persistida. Os indicadores abaixo representam somente o resumo atual recebido da operação.
        </p>
      </div>
    </div>
  );
}

function ActionQueue({
  summary,
}: {
  summary: CockpitSummary | null;
}) {
  if (!summary) {
    return (
      <div className="rounded-2xl border border-dashed border-[#dfe2f0] bg-white p-4 text-xs font-semibold text-[#7d8197]">
        Carregando dados da fila de decisao...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#ececf6] bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-[#1d2033]">Fila de decisao</p>
      <div className="mt-3 space-y-2">
        <Link href="/admin/impact-reviews?scope=campaigns" className="flex items-center justify-between rounded-xl border border-[#eef0fb] p-3 hover:bg-[#f8f9ff]">
          <div>
            <p className="text-xs font-bold text-[#1d2033]">Moderar campanhas em revisao</p>
            <p className="text-[11px] text-[#6d7289]">{displayValue(summary?.campaignsAtRisk)} campanhas exigem decisao ou acompanhamento</p>
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
            <p className="text-[11px] text-[#6d7289]">{displayValue(summary?.criticalTickets)} tickets sem resolucao</p>
          </div>
          <span className="text-xs font-bold text-[#4f57e8]">abrir</span>
        </Link>
        <Link href="/production/jobs" className="flex items-center justify-between rounded-xl border border-[#eef0fb] p-3 hover:bg-[#f8f9ff]">
          <div>
            <p className="text-xs font-bold text-[#1d2033]">Fechar ciclo de envio</p>
            <p className="text-[11px] text-[#6d7289]">{displayValue(summary?.shippedOrders)} pedidos enviados no ciclo atual</p>
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
            <KpiCard label="Receita bruta" value={summary ? formatCurrency(summary.gmv) : '—'} delta="ciclo atual" />
            <KpiCard label="Pedidos pagos" value={displayValue(summary?.paidOrders)} delta="sem comparação histórica" />
            <KpiCard label="Pagamentos com falha" value={displayValue(summary?.refunds)} delta="leitura atual" />
            <KpiCard label="Pedidos enviados" value={displayValue(summary?.shippedOrders)} delta="sem comparação histórica" />
          </div>

          <TrendChart />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[#ececf6] bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-[#1d2033]">Saude da operacao Fase 1</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-[#eef0fb] p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#7d8197]">Pedidos atrasados</p>
                  <p className="mt-1 text-xl font-black text-[#1d2033]">{displayValue(summary?.delayedOrders)}</p>
                </div>
                <div className="rounded-xl border border-[#eef0fb] p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#7d8197]">Fornecedores em alerta</p>
                  <p className="mt-1 text-xl font-black text-[#1d2033]">{displayValue(summary?.supplierAlerts)}</p>
                </div>
                <div className="rounded-xl border border-[#eef0fb] p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#7d8197]">Tickets criticos</p>
                  <p className="mt-1 text-xl font-black text-[#1d2033]">{displayValue(summary?.criticalTickets)}</p>
                </div>
                <div className="rounded-xl border border-[#eef0fb] p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#7d8197]">Checkout</p>
                  <p className="mt-1 text-xl font-black text-[#1d2033]">{summary ? `${summary.checkoutConversionPct}%` : '—'}</p>
                </div>
              </div>
            </div>
            <ActionQueue summary={summary} />
          </div>
        </div>

        <aside className="xl:col-span-3 space-y-3">
          <div className="rounded-2xl border border-[#ececf6] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#1d2033]">Agenda operacional</p>
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7d8197]">não conectada</span>
            </div>
            <div className="mt-3 rounded-xl border border-dashed border-[#dfe2f0] bg-[#fafbff] p-4">
              <p className="text-xs font-semibold leading-relaxed text-[#6d7289]">
                Não há agenda sincronizada nesta área. As rotinas devem ser acompanhadas pelos módulos operacionais correspondentes.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#ececf6] bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-[#1d2033]">Alertas imediatos</p>
            <div className="mt-3 space-y-2">
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                {displayValue(summary?.criticalTickets)} tickets exigem resposta
              </p>
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                {displayValue(summary?.delayedOrders)} pedidos atrasados no ciclo
              </p>
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                {displayValue(summary?.pendingImpactAlerts)} itens aguardando publicacao ou ajuste
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
