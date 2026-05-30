import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Header } from '@/components/navigation/Header';
import type { DashboardRole } from '@/lib/role-routing/role-dashboard-config';
import { ROLE_DASHBOARD_CONFIG } from '@/lib/role-routing/role-dashboard-config';

type RoleDashboardPageProps = {
  role: DashboardRole;
};

export function RoleDashboardPage({ role }: RoleDashboardPageProps) {
  const config = ROLE_DASHBOARD_CONFIG[role];

  return (
    <main className="min-h-screen bg-ruah-50 page-header-offset">
      <Header />
      <section className="section-space bg-white border-b border-ruah-100">
        <div className="section-container flex flex-col gap-4">
          <span className="tech-label text-accent-gold">{config.label}</span>
          <h1 className="ur-type-display-md italic uppercase text-ruah-950">{config.title}</h1>
          <p className="text-sm text-ruah-500 max-w-2xl">{config.description}</p>
        </div>
      </section>

      <section className="section-space">
        <div className="section-container grid grid-cols-1 md:grid-cols-3 gap-6">
          {config.cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} href={card.href} className="bg-white border border-ruah-100 rounded-3xl p-6 flex flex-col gap-4 hover:border-accent-gold motion-base">
                <Icon size={20} className="text-accent-gold" />
                <h2 className="text-lg font-semibold text-ruah-950">{card.title}</h2>
                <p className="text-sm text-ruah-500">{card.description}</p>
                <span className="text-xs font-bold uppercase tracking-[0.1em] text-accent-gold inline-flex items-center gap-2">
                  Abrir <ArrowRight size={12} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
