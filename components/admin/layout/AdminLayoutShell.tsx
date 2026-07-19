'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { isAdminRole, isAllowedAdminPath, resolveHomeByRole } from '@/lib/role-routing/access-routing';
import { getPhaseOneRoleLabel, isPhaseOneAdminMaster } from '@/lib/phase-one-role';
import { Header } from '@/components/navigation/Header';
import { Bell, CircleHelp, Settings } from 'lucide-react';
import { ADMIN_NAV_ITEMS, isNavActive } from '@/components/admin/navigation-config';

export default function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSessionReady, isAuthenticated, userRole } = useUser();

  React.useEffect(() => {
    if (!isSessionReady) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!isAdminRole(userRole)) {
      router.replace(resolveHomeByRole(userRole));
      return;
    }

    const adminHome = resolveHomeByRole(userRole);
    if (!isAllowedAdminPath(userRole, pathname)) {
      router.replace(adminHome);
    }
  }, [isAuthenticated, isSessionReady, pathname, router, userRole]);

  if (!isSessionReady || !isAuthenticated) return null;
  if (!isAdminRole(userRole)) return null;
  if (!isAllowedAdminPath(userRole, pathname)) return null;

  const activeRoleLabel = getPhaseOneRoleLabel(userRole);

  return (
    <div className="min-h-screen bg-ruah-50 page-header-offset">
      <Header />
      <div className="border-b border-ruah-100 bg-white/95 backdrop-blur-sm">
        <div className="section-container flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-ruah-950 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
              {isPhaseOneAdminMaster(userRole) ? 'Admin Master' : 'Ambiente Operacional'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-ruah-500">Papel ativo: {activeRoleLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/ops-alerts"
              className="inline-flex items-center gap-2 rounded-full border border-ruah-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ruah-700"
            >
              <Bell size={14} />
              Notificacoes
            </Link>
            <Link
              href="/help-center"
              className="inline-flex items-center gap-2 rounded-full border border-ruah-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ruah-700"
            >
              <CircleHelp size={14} />
              Ajuda
            </Link>
            <Link
              href="/account"
              className="inline-flex items-center gap-2 rounded-full border border-ruah-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ruah-700"
            >
              <Settings size={14} />
              Configuracoes
            </Link>
          </div>
        </div>
      </div>
      <div className="section-container py-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-28 rounded-2xl border border-ruah-100 bg-white p-3 shadow-sm">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ruah-400">Navegacao admin</p>
              <div className="mt-2 space-y-1">
                {ADMIN_NAV_ITEMS.map((item) => {
                  const active = isNavActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-colors ${
                        active ? 'bg-ruah-950 text-white' : 'text-ruah-700 hover:bg-ruah-50'
                      }`}
                    >
                      <item.icon size={14} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
          <main className="lg:col-span-9">{children}</main>
        </div>
      </div>
      <footer className="mt-10 border-t border-ruah-100 bg-white">
        <div className="section-container flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-ruah-400">UseRuah Plataforma - Area administrativa</div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.08em] text-ruah-500">
            <Link href="/policies">Politicas</Link>
            <Link href="/help-center">Suporte</Link>
            <span>Status: interface carregada</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
