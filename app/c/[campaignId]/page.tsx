import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { AppImage } from '@/components/shared/AppImage';
import { appendAuditLog } from '@/lib/audit-log-store';
import { getPublicCampaignDetail } from '@/lib/campaign-public';

export default async function PublicCampaignPage(props: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await props.params;
  const detail = await getPublicCampaignDetail(campaignId);

  if (detail.state === 'not_found') {
    notFound();
  }

  appendAuditLog({
    actor_id: 'public-visitor',
    actor_role: 'public',
    action: 'campaign.public_viewed',
    entity_type: 'Campaign',
    entity_id: campaignId,
    reason: `state:${detail.state}|products:${detail.storefront.publishedProductCount}`,
  });

  const previewProducts = detail.products.slice(0, 3);

  return (
    <main className="min-h-screen bg-white page-header-offset">
      <Header />

      <section className="relative overflow-hidden border-b border-ruah-100 bg-ruah-50 py-12 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(197,160,89,0.12),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(23,44,54,0.08),transparent_28%)]" />
        <div className="section-container relative z-10">
          <Breadcrumbs items={[{ label: 'Campanhas' }, { label: detail.campaign?.name ?? campaignId }]} className="mb-10 text-accent-gold" />

          <div className="layout-grid-media items-end gap-10 lg:gap-16">
            <div className="lg:col-span-7">
              <span className="mb-6 block text-xs font-semibold uppercase tracking-[0.14em] text-accent-gold">
                {detail.state === 'active' ? `Campanha ativa ${campaignId}` : `Campanha indisponível ${campaignId}`}
              </span>
              <h1 className="ur-type-display-xl mb-6 uppercase italic leading-[0.9] text-ruah-950">
                {detail.campaign?.name ?? 'Campanha pública'}
              </h1>
              <p className="max-w-2xl text-sm font-medium leading-relaxed text-ruah-500">
                {detail.campaign?.description ?? detail.message}
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <span className="rounded-full border border-ruah-100 bg-white/85 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ruah-500 shadow-sm">
                  Regra ativa {detail.campaign?.progressivePriceRule ?? 'indisponível'}
                </span>
                <span className="rounded-full border border-ruah-100 bg-white/85 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ruah-500 shadow-sm">
                  {detail.storefront.publishedProductCount} itens publicados
                </span>
                <span className="rounded-full border border-ruah-100 bg-white/85 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ruah-500 shadow-sm">
                  {detail.state === 'active' ? 'Vitrine pública disponível' : 'Vitrine pública indisponível'}
                </span>
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href={detail.storefront.isActive ? detail.storefront.href : '/shop'}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-ruah-950 px-7 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-accent-gold"
                >
                  {detail.storefront.isActive ? 'Abrir vitrine da campanha' : 'Ver catálogo geral'}
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-ruah-200 bg-white px-7 text-xs font-bold uppercase tracking-[0.14em] text-ruah-700 transition hover:border-accent-gold hover:text-accent-gold"
                >
                  Explorar coleção geral
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-[2.5rem] border border-ruah-100 bg-white/90 p-8 shadow-fancy backdrop-blur-sm">
                <span className="tech-label text-accent-gold">Leitura pública</span>
                <h2 className="mt-4 text-3xl font-serif italic uppercase text-ruah-950">
                  {detail.state === 'active' ? 'Campanha com recorte real.' : 'Campanha fora do ar.'}
                </h2>
                <p className="mt-4 text-sm font-medium leading-relaxed text-ruah-500">{detail.message}</p>
                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-ruah-100 pt-6">
                  <div className="rounded-2xl border border-ruah-100 bg-ruah-50/70 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ruah-400">Início</p>
                    <p className="mt-2 text-sm font-semibold text-ruah-700">{detail.campaign?.startsAt ? new Date(detail.campaign.startsAt).toLocaleDateString('pt-BR') : 'Sem data'}</p>
                  </div>
                  <div className="rounded-2xl border border-ruah-100 bg-ruah-50/70 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ruah-400">Fim</p>
                    <p className="mt-2 text-sm font-semibold text-ruah-700">{detail.campaign?.endsAt ? new Date(detail.campaign.endsAt).toLocaleDateString('pt-BR') : 'Sem data'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="section-container">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-gold">Preview da vitrine</span>
              <h2 className="mt-3 text-4xl font-serif italic uppercase text-ruah-950">Produtos vinculados</h2>
            </div>
            <p className="max-w-md text-sm font-medium leading-relaxed text-ruah-500">
              {detail.state === 'active'
                ? 'Só entra aqui o que realmente está publicado e ligado a esta campanha.'
                : 'Enquanto a campanha estiver indisponível, a navegação segue pelo catálogo geral.'}
            </p>
          </div>

          {previewProducts.length === 0 ? (
            <div className="rounded-[2rem] border border-ruah-100 bg-ruah-50/60 p-10 text-center">
              <h3 className="text-2xl font-serif italic uppercase text-ruah-950">Nenhum item publicado no recorte.</h3>
              <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-ruah-500">{detail.message}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {previewProducts.map((product) => (
                <Link
                  key={product.catalogItemId}
                  href={product.href}
                  className="group overflow-hidden rounded-[2rem] border border-ruah-100 bg-white shadow-subtle transition hover:-translate-y-1 hover:shadow-fancy"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-ruah-50">
                    <AppImage
                      context="product-thumb"
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent-gold">
                      {product.category} · {product.segment}
                    </p>
                    <h3 className="mt-3 text-xl font-serif italic uppercase text-ruah-950">{product.name}</h3>
                    <p className="mt-4 text-sm font-bold text-ruah-700">
                      R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
