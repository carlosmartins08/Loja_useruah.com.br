'use client';

import React from 'react';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';
import { AppImage } from '@/components/shared/AppImage';
import { ProductArtworkFallback } from '@/components/shared/ProductArtworkFallback';
import Link from 'next/link';
import { Star, Truck, Shield, Package, Calendar, ArrowRight } from 'lucide-react';
import { ProductInteractive, WhatsAppSticky } from '@/components/commerce/ProductInteractive';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { ProductFAQ } from '@/components/commerce/ProductFAQ';
import { StickyMobileBar } from '@/components/commerce/StickyMobileBar';
import { ProductPageModel } from '@/components/product/product-data';
import { TrustBadgeGrid } from '@/components/shared/TrustBadgeGrid';
import { TechnicalGuide } from '@/components/commerce/TechnicalGuide';
import { SmartRecommender } from '@/components/commerce/SmartRecommender';
import type { SmartRecommendationItem } from '@/components/commerce/SmartRecommender';
import { ProductSocialProof } from '@/components/commerce/ProductSocialProof';
import { ProductQA } from '@/components/commerce/ProductQA';
import { ProductMediaGallery } from '@/components/commerce/ProductMediaGallery';
import { ProductSizeAdvisor } from '@/components/commerce/ProductSizeAdvisor';
import { isProductMockupPlaceholder } from '@/lib/product-artwork';
import { getProductStageTone } from '@/lib/product-stage';

interface ProductPageViewProps {
  product: ProductPageModel;
  jsonLd: unknown;
  recommendations: SmartRecommendationItem[];
}

export function ProductPageView({ product, jsonLd, recommendations }: ProductPageViewProps) {
  const availableColors = React.useMemo(() => Object.keys(product.colorImages), [product.colorImages]);
  const defaultColor = availableColors[0] ?? 'Padrão';
  const [selectedColor, setSelectedColor] = React.useState<string | null>(null);
  const [failedHeroImages, setFailedHeroImages] = React.useState<Record<string, true>>({});
  const segmentLabel = product.segment === 'Base' ? 'Linha essencial' : 'Linha autoral';
  const accentTag = React.useMemo(
    () => product.tags.find((tag) => tag.toLowerCase() !== 'seed'),
    [product.tags]
  );
  const catalogContext = [product.category, segmentLabel, accentTag].filter(Boolean).join(' · ');
  const activeColor = selectedColor && product.colorImages[selectedColor] ? selectedColor : defaultColor;
  const activeImage = product.colorImages[activeColor] ?? product.image;
  const heroStage = getProductStageTone(activeImage);
  const heroFailed = Boolean(failedHeroImages[activeImage]);
  const heroUsesEditorialArtwork = isProductMockupPlaceholder(activeImage);

  return (
    <main className="bg-[#FFFFFF] min-h-screen page-header-offset">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <StickyMobileBar price={product.price} />
      <Header />
      <WhatsAppSticky />

      <section className="relative min-h-[72vh] flex flex-col justify-start overflow-hidden bg-ruah-50 py-10 lg:py-16">
        <div className="section-container relative z-10">
          <Breadcrumbs items={[{ label: 'Coleções', href: '/shop' }, { label: product.name }]} className="mb-12" />
          <div className="layout-grid-product">
            <div className="lg:col-span-3 flex flex-col gap-12">
              <div className="flex flex-col gap-4">
                <span className="font-serif text-3xl italic tracking-tighter uppercase mb-4 text-ruah-950">UseRuah.</span>
                <h1 className="ur-type-display-xl uppercase italic">{product.name}.</h1>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-gold">{catalogContext}</p>
                <p className="text-sm font-semibold text-ruah-500 leading-relaxed max-w-[320px] mt-4">
                  Peça publicada para compra direta, com produção sob demanda e leitura visual alinhada ao catálogo ativo da marca.
                </p>
              </div>

              <div className="flex flex-col gap-6 pt-8 border-t border-ruah-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-subtle">
                    <Star size={16} className="text-accent-gold" fill="currentColor" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-serif italic text-ruah-950">4.9</span>
                    <span className="text-xs font-semibold text-ruah-400">41 avaliações de clientes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 relative flex justify-center items-center py-8 lg:py-0">
              <div className="relative w-full aspect-square max-w-[500px]">
                <div className={`absolute inset-0 rounded-full shadow-glass border scale-[1.1] pointer-events-none ${heroStage.frameClassName}`} />
                <div className={`absolute inset-[10%] rounded-full ${heroStage.glowClassName}`} />
                <div className={`absolute inset-[18%] rounded-full ${heroStage.surfaceClassName}`} />
                <div className="relative w-full h-full rounded-full overflow-hidden group">
                  {heroUsesEditorialArtwork || heroFailed ? <ProductArtworkFallback title={product.name} subtitle={catalogContext} src={activeImage} /> : null}
                  {!heroUsesEditorialArtwork ? (
                    <AppImage
                      context="hero"
                      src={activeImage}
                      alt={`${product.name} - ${activeColor}`}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className={`${heroFailed ? 'hidden ' : ''}${heroStage.imageClassName} transition-transform motion-slow group-hover:scale-110`}
                      onError={() =>
                        setFailedHeroImages((current) => (current[activeImage] ? current : { ...current, [activeImage]: true }))
                      }
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <ProductInteractive
              {...product}
              image={activeImage}
              selectedColor={activeColor}
              colorOptions={availableColors}
              onColorChange={setSelectedColor}
            />
          </div>
        </div>

        <div className="watermark-editorial">
          <span className="text-[15vw] font-serif uppercase whitespace-nowrap text-ruah-950">GERAÇÃO RUAH</span>
        </div>
      </section>

      <ProductMediaGallery
        heroImage={activeImage}
        detailImages={product.detailImages}
        modelMockups={product.modelMockups}
        productName={product.name}
      />

      <section className="bg-white border-y border-ruah-100 py-10 relative z-20">
        <div className="section-container">
          <TrustBadgeGrid
            items={[
              { label: 'Frete nacional', detail: 'Cálculo no checkout', icon: Truck },
              { label: 'Pagamento seguro', detail: 'Pix e cartão', icon: Shield },
              { label: 'Rastreio simples', detail: 'Atualização após postagem', icon: Package },
              { label: 'Produção sob demanda', detail: 'Acabamento revisado', icon: Calendar }
            ]}
            iconSize={18}
          />
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="section-container layout-grid-product">
          <div className="lg:col-span-6 bg-ruah-50 rounded-3xl p-8 border border-ruah-100 self-start">
            <span className="text-xs font-black text-accent-gold uppercase tracking-[0.18em]">Ficha técnica</span>
            <h2 className="text-3xl font-serif italic uppercase text-ruah-950 mt-4">Detalhes do produto</h2>
            <ul className="mt-6 flex flex-col gap-4 text-sm font-semibold text-ruah-600">
              <li><span className="text-ruah-950">Caimento:</span> {product.fit}</li>
              <li><span className="text-ruah-950">Tecido:</span> {product.fabric}</li>
              <li><span className="text-ruah-950">Estampa:</span> {product.printTypeDescription}</li>
              <li><span className="text-ruah-950">Lavagem:</span> {product.washGuide}</li>
            </ul>
          </div>
          <div className="lg:col-span-6 self-start">
            <TechnicalGuide />
          </div>
        </div>
      </section>

      <ProductSizeAdvisor />

      <section className="py-20 bg-white border-y border-ruah-100">
        <div className="section-container">
          <SmartRecommender recommendations={recommendations} />
        </div>
      </section>

      <ProductSocialProof />
      <ProductQA />

      <section className="py-32 bg-white">
        <div className="section-container">
          <div className="layout-grid-product">
            <div className="lg:col-span-4 flex flex-col gap-10 self-start">
              <div className="flex flex-col gap-6">
                <span className="tech-label text-accent-gold font-black">Ajuda ao cliente</span>
                <h2 className="text-4xl font-serif italic uppercase leading-tight font-black text-ruah-950">AJUDA & <br /> SUPORTE.</h2>
                <p className="text-sm font-medium text-ruah-500 leading-relaxed">Encontre respostas rápidas sobre produto, entrega, pagamento e políticas da loja.</p>
              </div>
              <div className="flex flex-col gap-4">
                <Link href="/help-center" className="flex items-center justify-between p-6 bg-ruah-50 rounded-2xl text-sm font-semibold hover:bg-ruah-950 hover:text-white transition-all group">
                  Central de Ajuda <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/policies" className="flex items-center justify-between p-6 bg-ruah-50 rounded-2xl text-sm font-semibold hover:bg-ruah-950 hover:text-white transition-all group">
                  Políticas da loja <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="lg:col-span-8 self-start">
              <ProductFAQ />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

