'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  author: string;
  date: string;
  comment: string;
  tags: string[];
  ratings: {
    quality: number;
    delivery: number;
    value: number;
  };
}

const REVIEWS: Review[] = [
  {
    id: 'r1',
    author: 'Mariana S.',
    date: '12/05/2026',
    comment: 'Tecido muito confortável e estampa bem definida. Chegou dentro do prazo.',
    tags: ['tamanho correto', 'tecido macio', 'estampa nítida'],
    ratings: { quality: 5, delivery: 5, value: 4 }
  },
  {
    id: 'r2',
    author: 'Lucas M.',
    date: '08/05/2026',
    comment: 'Modelagem regular funcionou bem. Preço justo pelo acabamento.',
    tags: ['caimento bom', 'acabamento premium'],
    ratings: { quality: 5, delivery: 4, value: 5 }
  },
  {
    id: 'r3',
    author: 'Ana P.',
    date: '03/05/2026',
    comment: 'Gostei da peça, só queria mais fotos de detalhe para decidir mais rápido.',
    tags: ['boa costura', 'faltou detalhe foto'],
    ratings: { quality: 4, delivery: 4, value: 4 }
  }
];

function average(n1: number, n2: number, n3: number) {
  return ((n1 + n2 + n3) / 3).toFixed(1);
}

export function ProductSocialProof() {
  const allTags = React.useMemo(() => Array.from(new Set(REVIEWS.flatMap((review) => review.tags))), []);
  const [selectedTag, setSelectedTag] = React.useState<string>('todas');

  const filtered = React.useMemo(() => {
    if (selectedTag === 'todas') return REVIEWS;
    return REVIEWS.filter((review) => review.tags.includes(selectedTag));
  }, [selectedTag]);

  const summary = React.useMemo(() => {
    const source = filtered.length ? filtered : REVIEWS;
    const quality = source.reduce((acc, item) => acc + item.ratings.quality, 0) / source.length;
    const delivery = source.reduce((acc, item) => acc + item.ratings.delivery, 0) / source.length;
    const value = source.reduce((acc, item) => acc + item.ratings.value, 0) / source.length;
    return { quality, delivery, value, overall: Number(average(quality, delivery, value)) };
  }, [filtered]);

  return (
    <section className="py-24 bg-white border-y border-ruah-100">
      <div className="section-container flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <span className="text-[9px] font-black uppercase tracking-widest text-accent-gold">Prova social</span>
          <h2 className="text-4xl font-serif italic uppercase text-ruah-950">Avaliações reais</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ruah-400">Notas por dimensão e filtro por característica</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl border border-ruah-100 bg-ruah-50">
            <p className="text-[9px] font-bold uppercase tracking-widest text-ruah-400">Média geral</p>
            <p className="text-3xl font-serif italic text-ruah-950 mt-2">{summary.overall}</p>
          </div>
          <div className="p-6 rounded-2xl border border-ruah-100">
            <p className="text-[9px] font-bold uppercase tracking-widest text-ruah-400">Qualidade</p>
            <p className="text-xl font-bold text-ruah-950 mt-2">{summary.quality.toFixed(1)}/5</p>
          </div>
          <div className="p-6 rounded-2xl border border-ruah-100">
            <p className="text-[9px] font-bold uppercase tracking-widest text-ruah-400">Entrega</p>
            <p className="text-xl font-bold text-ruah-950 mt-2">{summary.delivery.toFixed(1)}/5</p>
          </div>
          <div className="p-6 rounded-2xl border border-ruah-100">
            <p className="text-[9px] font-bold uppercase tracking-widest text-ruah-400">Custo-benefício</p>
            <p className="text-xl font-bold text-ruah-950 mt-2">{summary.value.toFixed(1)}/5</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => setSelectedTag('todas')} className={`px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest border ${selectedTag === 'todas' ? 'bg-ruah-950 text-white border-ruah-950' : 'border-ruah-100 text-ruah-500'}`}>
            todas
          </button>
          {allTags.map((tag) => (
            <button key={tag} onClick={() => setSelectedTag(tag)} className={`px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest border ${selectedTag === tag ? 'bg-ruah-950 text-white border-ruah-950' : 'border-ruah-100 text-ruah-500'}`}>
              {tag}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filtered.map((review) => (
            <article key={review.id} className="p-6 rounded-3xl border border-ruah-100 bg-white">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-ruah-950">{review.author}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-ruah-300">{review.date}</p>
              </div>
              <div className="flex items-center gap-1 mt-2 text-accent-gold">
                {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={12} fill="currentColor" className="text-accent-gold" />)}
              </div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-ruah-500 leading-loose mt-4">{review.comment}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {review.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-ruah-50 rounded-full text-[8px] font-bold uppercase tracking-widest text-ruah-500">{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
