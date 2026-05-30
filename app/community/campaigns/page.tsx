import Link from 'next/link';
import { Header } from '@/components/navigation/Header';
import { ArrowRight, CalendarClock, ChartNoAxesColumn, Megaphone, Target } from 'lucide-react';

const CAMPAIGNS = [
  {
    name: 'Campanha Inverno Essencial',
    status: 'Ativa',
    reach: '42.8k',
    conversion: '3.9%',
    window: '01 Jun - 21 Jun',
  },
  {
    name: 'Colecao Manifesto Urbano',
    status: 'Planejamento',
    reach: '18.2k',
    conversion: '2.4%',
    window: '22 Jun - 10 Jul',
  },
  {
    name: 'Drop Comunidade Artistas',
    status: 'Revisao',
    reach: '9.6k',
    conversion: '1.7%',
    window: '11 Jul - 25 Jul',
  },
] as const;

export default function CommunityCampaignsPage() {
  return (
    <main className="min-h-screen bg-ruah-50 page-header-offset">
      <Header />
      <section className="section-space bg-white border-b border-ruah-100">
        <div className="section-container flex flex-col gap-4">
          <span className="tech-label text-accent-gold">Community Workspace</span>
          <h1 className="ur-type-display-md italic uppercase text-ruah-950">Campanhas</h1>
          <p className="text-sm text-ruah-500 max-w-2xl">
            Priorize iniciativas por impacto, janela de execucao e performance de conversao.
          </p>
        </div>
      </section>

      <section className="section-space">
        <div className="section-container grid grid-cols-1 lg:grid-cols-12 gap-6">
          <article className="lg:col-span-8 bg-white border border-ruah-100 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ruah-950 inline-flex items-center gap-2">
                <Megaphone size={18} className="text-accent-gold" /> Pipeline de Campanhas
              </h2>
              <Link href="/community" className="text-xs font-bold uppercase tracking-[0.1em] text-accent-gold inline-flex items-center gap-2">
                Voltar <ArrowRight size={12} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-ruah-500 border-b border-ruah-100">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Campanha</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Alcance</th>
                    <th className="py-3 pr-4 font-medium">Conversao</th>
                    <th className="py-3 font-medium">Janela</th>
                  </tr>
                </thead>
                <tbody>
                  {CAMPAIGNS.map((campaign) => (
                    <tr key={campaign.name} className="border-b border-ruah-100 last:border-0">
                      <td className="py-3 pr-4 text-ruah-950 font-medium">{campaign.name}</td>
                      <td className="py-3 pr-4 text-ruah-700">{campaign.status}</td>
                      <td className="py-3 pr-4 text-ruah-700">{campaign.reach}</td>
                      <td className="py-3 pr-4 text-ruah-700">{campaign.conversion}</td>
                      <td className="py-3 text-ruah-700">{campaign.window}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <aside className="lg:col-span-4 space-y-6">
            <article className="bg-white border border-ruah-100 rounded-3xl p-6">
              <h3 className="text-base font-semibold text-ruah-950 inline-flex items-center gap-2">
                <ChartNoAxesColumn size={16} className="text-accent-gold" /> KPI da Semana
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-ruah-600">
                <li className="flex items-center justify-between"><span>CTR Medio</span><strong className="text-ruah-950">4.8%</strong></li>
                <li className="flex items-center justify-between"><span>Pedidos Captados</span><strong className="text-ruah-950">312</strong></li>
                <li className="flex items-center justify-between"><span>ROAS Estimado</span><strong className="text-ruah-950">3.1x</strong></li>
              </ul>
            </article>

            <article className="bg-white border border-ruah-100 rounded-3xl p-6 space-y-3">
              <h3 className="text-base font-semibold text-ruah-950 inline-flex items-center gap-2">
                <Target size={16} className="text-accent-gold" /> Proximas Acoes
              </h3>
              <p className="text-sm text-ruah-500">Ajustar criativos de baixo CTR e revisar metas da proxima janela.</p>
              <Link href="/account/orders" className="text-xs font-bold uppercase tracking-[0.1em] text-accent-gold inline-flex items-center gap-2">
                Ver Pedidos <ArrowRight size={12} />
              </Link>
            </article>

            <article className="bg-white border border-ruah-100 rounded-3xl p-6 space-y-3">
              <h3 className="text-base font-semibold text-ruah-950 inline-flex items-center gap-2">
                <CalendarClock size={16} className="text-accent-gold" /> Agenda
              </h3>
              <p className="text-sm text-ruah-500">Reuniao de planejamento: 03/06 as 10:00. Revisao executiva: 05/06 as 16:00.</p>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}
