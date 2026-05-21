'use client';

import React from 'react';
import { MessageCircle, ThumbsUp } from 'lucide-react';

interface QAItem {
  id: string;
  question: string;
  answer: string;
  author: string;
  likes: number;
}

const QA_LIST: QAItem[] = [
  {
    id: 'q1',
    question: 'A modelagem é justa ou padrão?',
    answer: 'A Camiseta Respiro segue modelagem regular. Se preferir visual mais solto, recomendamos um tamanho acima.',
    author: 'Equipe UseRuah',
    likes: 32
  },
  {
    id: 'q2',
    question: 'A cor desbota nas primeiras lavagens?',
    answer: 'Com lavagem do avesso e secagem à sombra, a durabilidade da estampa e da cor tende a se manter bem.',
    author: 'Equipe UseRuah',
    likes: 21
  },
  {
    id: 'q3',
    question: 'Posso trocar por outro tamanho?',
    answer: 'Sim. Dentro do prazo de política de troca, você pode solicitar ajuste de tamanho.',
    author: 'Equipe UseRuah',
    likes: 18
  }
];

export function ProductQA() {
  const [query, setQuery] = React.useState('');
  const filtered = React.useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return QA_LIST;
    return QA_LIST.filter((item) => item.question.toLowerCase().includes(value) || item.answer.toLowerCase().includes(value));
  }, [query]);

  return (
    <section className="py-24 bg-ruah-50/40 border-y border-ruah-100">
      <div className="section-container flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-accent-gold">Perguntas e respostas</span>
          <h2 className="text-4xl font-serif italic uppercase text-ruah-950">Dúvidas públicas</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ruah-400">Respostas visíveis para acelerar decisão de compra</p>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar dúvida sobre tamanho, tecido, troca..."
          className="w-full rounded-2xl border border-ruah-100 bg-white px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-ruah-500 outline-none focus:border-accent-gold"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <article key={item.id} className="p-6 rounded-3xl border border-ruah-100 bg-white flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-ruah-950">{item.question}</p>
                <MessageCircle size={16} className="text-accent-gold shrink-0" />
              </div>
              <p className="text-[10px] font-medium uppercase tracking-widest leading-loose text-ruah-500">{item.answer}</p>
              <div className="flex items-center justify-between pt-2 border-t border-ruah-50">
                <span className="text-[8px] font-bold uppercase tracking-widest text-ruah-300">{item.author}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-ruah-400 flex items-center gap-1"><ThumbsUp size={12} /> {item.likes} úteis</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
