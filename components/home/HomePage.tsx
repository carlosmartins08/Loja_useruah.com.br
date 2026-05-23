'use client';

import { Footer } from '@/components/navigation/Footer';
import { Header } from '@/components/navigation/Header';
import { Hero } from '@/components/sections/Hero';
import React from 'react';
import { HOME_TESTIMONIALS } from '@/components/home/home-data';
import { AiCreatorSection } from '@/components/home/sections/AiCreatorSection';
import { BenefitsBar } from '@/components/home/sections/BenefitsBar';
import { BrandStorySections } from '@/components/home/sections/BrandStorySections';
import { CatalogHighlights } from '@/components/home/sections/CatalogHighlights';
import { HomeFaqSection } from '@/components/home/sections/HomeFaqSection';
import { MediaHubSections } from '@/components/home/sections/MediaHubSections';
import { TestimonialsSection } from '@/components/home/sections/TestimonialsSection';

export function HomePage() {
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
    logo: 'https://useruah.com.br/brand/logo-wordmark-dark.svg',
    description: 'Moda cristã e produtos personalizados sob demanda.',
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
      <CatalogHighlights />
      <BrandStorySections />
      <MediaHubSections />
      <TestimonialsSection activeTestimonial={activeTestimonial} onNext={nextTestimonial} onPrev={prevTestimonial} />
      <HomeFaqSection openFaq={openFaq} onToggle={(i) => setOpenFaq(openFaq === i ? null : i)} />
      <Footer />
    </main>
  );
}

