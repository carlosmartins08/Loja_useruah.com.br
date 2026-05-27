import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const artistName = slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return {
    title: `${artistName} | Artista Ruah`,
    description: `Conheça o trabalho de ${artistName} no ecossistema UseRuah.`,
  };
}

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artistName = slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return (
    <main className="min-h-screen bg-white page-header-offset">
      <Header />
      <section className="section-container py-24 flex flex-col gap-8">
        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold">Artista em Destaque</span>
        <h1 className="text-5xl md:text-7xl font-serif italic uppercase text-ruah-950">{artistName}</h1>
        <p className="text-sm font-medium text-ruah-500 max-w-2xl">
          Página editorial do artista preparada para o ciclo de curadoria. Em breve, portfólio completo, narrativas e coleção publicada.
        </p>
        <div className="flex gap-4">
          <Link href="/shop" className="px-6 py-3 bg-ruah-950 text-white rounded-xl text-xs font-semibold uppercase tracking-[0.1em]">
            Ver Coleção
          </Link>
          <Link href="/category/autoral" className="px-6 py-3 border border-ruah-200 rounded-xl text-xs font-semibold uppercase tracking-[0.1em] text-ruah-700">
            Voltar para Autoral
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
