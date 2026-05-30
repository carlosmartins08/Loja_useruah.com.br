import Link from 'next/link';
import { Header } from '@/components/navigation/Header';
import { ArrowRight, BarChart3, BadgeDollarSign, Link2, ScanLine } from 'lucide-react';

const AFFILIATE_LINKS = [
  {
    label: 'Colecao Essenciais',
    slug: 'use-ruah.com/af/essenciais',
    channel: 'Instagram',
    clicks: 1280,
    conversion: '3.2%',
  },
  {
    label: 'Drop Artista Convidado',
    slug: 'use-ruah.com/af/drop-artista',
    channel: 'YouTube',
    clicks: 740,
    conversion: '2.1%',
  },
  {
    label: 'Campanha Comunidade',
    slug: 'use-ruah.com/af/comunidade',
    channel: 'WhatsApp',
    clicks: 510,
    conversion: '4.4%',
  },
] as const;

export default function AffiliateLinksPage() {
  return (
    <main className="min-h-screen bg-ruah-50 page-header-offset">
      <Header />
      <section className="section-space bg-white border-b border-ruah-100">
        <div className="section-container flex flex-col gap-4">
          <span className="tech-label text-accent-gold">Affiliate Workspace</span>
          <h1 className="ur-type-display-md italic uppercase text-ruah-950">Links de Divulgacao</h1>
          <p className="text-sm text-ruah-500 max-w-2xl">
            Organize ativos de divulgacao e acompanhe performance por canal para otimizar conversao.
          </p>
        </div>
      </section>

      <section className="section-space">
        <div className="section-container grid grid-cols-1 lg:grid-cols-12 gap-6">
          <article className="lg:col-span-8 bg-white border border-ruah-100 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ruah-950 inline-flex items-center gap-2">
                <Link2 size={18} className="text-accent-gold" /> Inventario de Links
              </h2>
              <Link href="/affiliate" className="text-xs font-bold uppercase tracking-[0.1em] text-accent-gold inline-flex items-center gap-2">
                Voltar <ArrowRight size={12} />
              </Link>
            </div>

            <div className="space-y-3">
              {AFFILIATE_LINKS.map((item) => (
                <div key={item.slug} className="border border-ruah-100 rounded-2xl p-4 bg-ruah-50/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-ruah-950">{item.label}</h3>
                    <span className="text-xs uppercase tracking-[0.1em] text-ruah-500">{item.channel}</span>
                  </div>
                  <p className="mt-2 text-sm text-ruah-600">{item.slug}</p>
                  <div className="mt-3 flex gap-4 text-xs text-ruah-600">
                    <span>Cliques: <strong className="text-ruah-950">{item.clicks}</strong></span>
                    <span>Conversao: <strong className="text-ruah-950">{item.conversion}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className="lg:col-span-4 space-y-6">
            <article className="bg-white border border-ruah-100 rounded-3xl p-6">
              <h3 className="text-base font-semibold text-ruah-950 inline-flex items-center gap-2">
                <BarChart3 size={16} className="text-accent-gold" /> Resumo
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-ruah-600">
                <li className="flex items-center justify-between"><span>Cliques Totais</span><strong className="text-ruah-950">2.530</strong></li>
                <li className="flex items-center justify-between"><span>Conversao Media</span><strong className="text-ruah-950">3.2%</strong></li>
                <li className="flex items-center justify-between"><span>Ticket Medio</span><strong className="text-ruah-950">R$ 186</strong></li>
              </ul>
            </article>

            <article className="bg-white border border-ruah-100 rounded-3xl p-6 space-y-3">
              <h3 className="text-base font-semibold text-ruah-950 inline-flex items-center gap-2">
                <BadgeDollarSign size={16} className="text-accent-gold" /> Receita Estimada
              </h3>
              <p className="text-sm text-ruah-500">Previsao de repasse atual: R$ 4.920 com base no ciclo corrente.</p>
              <Link href="/account/wallet" className="text-xs font-bold uppercase tracking-[0.1em] text-accent-gold inline-flex items-center gap-2">
                Ver Carteira <ArrowRight size={12} />
              </Link>
            </article>

            <article className="bg-white border border-ruah-100 rounded-3xl p-6 space-y-3">
              <h3 className="text-base font-semibold text-ruah-950 inline-flex items-center gap-2">
                <ScanLine size={16} className="text-accent-gold" /> Qualidade de Tracking
              </h3>
              <p className="text-sm text-ruah-500">100% dos links ativos com parametros de atribuicao corretos.</p>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}
