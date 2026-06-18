'use client';

import { Footer } from '@/components/navigation/Footer';
import { Header } from '@/components/navigation/Header';
import { AiCreatorSection } from '@/components/home/sections/AiCreatorSection';
import { BenefitsBar } from '@/components/home/sections/BenefitsBar';
import { BrandStorySections } from '@/components/home/sections/BrandStorySections';
import { CatalogHighlights } from '@/components/home/sections/CatalogHighlights';
import { HomeFaqSection } from '@/components/home/sections/HomeFaqSection';
import { MediaHubSections } from '@/components/home/sections/MediaHubSections';
import { TestimonialsSection } from '@/components/home/sections/TestimonialsSection';
import { HOME_TESTIMONIALS } from '@/components/home/home-data';
import type { HomeCategory } from '@/components/home/home-types';
import { Hero } from '@/components/sections/Hero';
import type { ShopProduct } from '@/components/shop/shop-data';
import React from 'react';

interface HomePageProps {
  featuredCategories: HomeCategory[];
  featuredProducts: ShopProduct[];
}

export function HomePage({ featuredCategories, featuredProducts }: HomePageProps) {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [activeTestimonial, setActiveTestimonial] = React.useState(0);

  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % HOME_TESTIMONIALS.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonial((prev) => (prev - 1 + HOME_TESTIMONIALS.length) % HOME_TESTIMONIALS.length);
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'UseRuah',
    url: 'https://useruah.com.br',
    logo: 'https://useruah.com.br/brand/SVG/logo-wordmark-dark.svg',
    description: 'Moda cristã com catálogo publicado e produção sob demanda.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Brasil',
      addressLocality: 'São Paulo',
      addressRegion: 'SP',
      addressCountry: 'BR',
    },
  };

  return (
    <main className="bg-white page-header-offset">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <Hero />
      <BenefitsBar />
      <AiCreatorSection />
      <CatalogHighlights categories={featuredCategories} products={featuredProducts} />
      <BrandStorySections />
      <MediaHubSections />
      <TestimonialsSection activeTestimonial={activeTestimonial} onNext={nextTestimonial} onPrev={prevTestimonial} />
      <HomeFaqSection openFaq={openFaq} onToggle={(index) => setOpenFaq(openFaq === index ? null : index)} />
      <Footer />
    </main>
  );
}
