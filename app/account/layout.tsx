'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, Package, MapPin, MessageSquare, LogOut, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Header } from '@/components/navigation/Header';
import { useUser } from '@/context/UserContext';
import { isAdminRole, resolveHomeByRole } from '@/lib/role-routing/access-routing';

const CUSTOMER_NAV_ITEMS = [
  { href: '/account', label: 'Painel Geral', icon: User },
  { href: '/account/orders', label: 'Meus Pedidos', icon: Package },
  { href: '/account/addresses', label: 'Endereços', icon: MapPin },
  { href: '/account/support', label: 'Suporte', icon: MessageSquare },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userName, userRole, logout, isAuthenticated, isSessionReady } = useUser();
  const navItems = CUSTOMER_NAV_ITEMS;

  React.useEffect(() => {
    if (!isSessionReady) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (userRole !== 'customer') {
      router.replace(resolveHomeByRole(userRole));
      return;
    }
    if (isAdminRole(userRole)) {
      router.replace(resolveHomeByRole(userRole));
    }
  }, [isAuthenticated, isSessionReady, router, userRole]);

  if (!isSessionReady || !isAuthenticated) {
    return null;
  }
  if (userRole !== 'customer' || isAdminRole(userRole)) return null;

  return (
    <div className="min-h-screen bg-ruah-50 page-header-offset">
      <Header />
      <div className="pt-8 pb-20">
        <div className="section-container">
          <div className="flex flex-col md:flex-row gap-12">
            <aside className="w-full md:w-64 shrink-0">
              <div className="sticky top-40">
                <div className="mb-12">
                  <span className="text-xs font-semibold text-accent-gold uppercase tracking-[0.12em] block mb-1">Bem-vindo,</span>
                  <h1 className="text-2xl font-serif uppercase italic leading-none text-ruah-950">{userName}</h1>
                </div>

                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between group p-4 rounded-xl transition-all ${
                          isActive ? 'bg-white text-accent-gold shadow-sm' : 'hover:bg-white/50 text-ruah-400 hover:text-ruah-950'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                          <span className="text-xs font-semibold uppercase tracking-[0.08em]">{item.label}</span>
                        </div>
                        <ChevronRight
                          size={14}
                          className={`transition-transform ${isActive ? 'translate-x-0' : '-translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`}
                        />
                      </Link>
                    );
                  })}
                  <button
                    onClick={async () => {
                      await logout();
                      window.location.href = '/login';
                    }}
                    className="flex items-center gap-4 p-4 rounded-xl text-red-500/60 hover:text-red-500 hover:bg-red-50 transition-all mt-8"
                  >
                    <LogOut size={18} />
                    <span className="text-xs font-semibold uppercase tracking-[0.08em]">Sair da Conta</span>
                  </button>
                </nav>
              </div>
            </aside>

            <main className="flex-1 min-w-0">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                {children}
              </motion.div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}


