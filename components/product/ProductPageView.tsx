'use client';

import React from 'react';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';
import { AppImage } from '@/components/shared/AppImage';
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

interface ProductPageViewProps {
  product: ProductPageModel;
  jsonLd: unknown;
  recommendations: SmartRecommendationItem[];
}

export function ProductPageView({ product, jsonLd, recommendations }: ProductPageViewProps) {
  const [selectedColor, setSelectedColor] = React.useState('Off White');
  const activeImage = product.colorImages[selectedColor] ?? product.image;

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
                <h1 className="ur-type-display-xl uppercase italic">Respiro <br /> <span className="not-italic">Ruah.</span></h1>
                <p className="text-sm font-semibold text-ruah-500 leading-relaxed max-w-[260px] mt-4">Produto publicado para venda simples, com personalização visível ao cliente e compra direta pela loja.</p>
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
                <div className="absolute inset-0 bg-white rounded-full shadow-glass border border-ruah-100 scale-[1.1] pointer-events-none" />
                <div className="relative w-full h-full rounded-full overflow-hidden group">
                  <AppImage context="hero" src={activeImage} alt={`${product.name} - ${selectedColor}`} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-transform motion-slow group-hover:scale-110" referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>

            <ProductInteractive
              {...product}
              image={activeImage}
              onColorChange={setSelectedColor}
              installmentCount={product.installmentCount}
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
              { label: 'Frete Grátis', detail: 'Acima de R$ 200', icon: Truck },
              { label: 'Moda Segura', detail: 'Troca Garantida', icon: Shield },
              { label: 'Logística de Amor', detail: 'Rastreio Fácil', icon: Package },
              { label: 'Selo Ruah', detail: 'Qualidade Cristã', icon: Calendar }
            ]}
            iconSize={18}
          />
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="section-container grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="bg-ruah-50 rounded-3xl p-8 border border-ruah-100 self-start">
            <span className="text-xs font-black text-accent-gold uppercase tracking-[0.18em]">Ficha técnica</span>
            <h2 className="text-3xl font-serif italic uppercase text-ruah-950 mt-4">Detalhes do produto</h2>
            <ul className="mt-6 flex flex-col gap-4 text-sm font-semibold text-ruah-600">
              <li><span className="text-ruah-950">Caimento:</span> {product.fit}</li>
              <li><span className="text-ruah-950">Tecido:</span> {product.fabric}</li>
              <li><span className="text-ruah-950">Estampa:</span> {product.printTypeDescription}</li>
              <li><span className="text-ruah-950">Lavagem:</span> {product.washGuide}</li>
            </ul>
          </div>
          <TechnicalGuide />
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            <div className="lg:col-span-3 flex flex-col gap-10">
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
            <div className="lg:col-span-9">
              <ProductFAQ />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

