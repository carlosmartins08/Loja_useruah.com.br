'use client';

import React from 'react';

type FitPreference = 'ajustado' | 'regular' | 'solto';

interface Recommendation {
  size: 'P' | 'M' | 'G' | 'GG' | 'XG';
  note: string;
}

function recommendSize(heightCm: number, weightKg: number, preference: FitPreference): Recommendation {
  const bmi = weightKg / Math.pow(heightCm / 100, 2);

  let size: Recommendation['size'] = 'M';

  if (heightCm < 165 || weightKg < 58) size = 'P';
  if (heightCm >= 170 || weightKg >= 68) size = 'M';
  if (heightCm >= 178 || weightKg >= 78) size = 'G';
  if (heightCm >= 185 || weightKg >= 92) size = 'GG';
  if (heightCm >= 192 || weightKg >= 105) size = 'XG';

  const order: Recommendation['size'][] = ['P', 'M', 'G', 'GG', 'XG'];
  const index = order.indexOf(size);

  if (preference === 'ajustado' && index > 0) size = order[index - 1];
  if (preference === 'solto' && index < order.length - 1) size = order[index + 1];

  const note =
    bmi < 21
      ? 'Perfil mais leve. Se quiser visual oversized, considere subir 1 tamanho.'
      : bmi > 27
        ? 'Perfil com maior estrutura corporal. Priorizamos conforto no tórax e comprimento.'
        : 'Perfil equilibrado. Recomendação baseada em caimento regular da peça.';

  return { size, note };
}

export function ProductSizeAdvisor() {
  const [height, setHeight] = React.useState('170');
  const [weight, setWeight] = React.useState('70');
  const [preference, setPreference] = React.useState<FitPreference>('regular');

  const parsedHeight = Number(height);
  const parsedWeight = Number(weight);
  const valid = Number.isFinite(parsedHeight) && Number.isFinite(parsedWeight) && parsedHeight > 130 && parsedHeight < 230 && parsedWeight > 35 && parsedWeight < 220;

  const recommendation = valid ? recommendSize(parsedHeight, parsedWeight, preference) : null;
  const heightId = React.useId();
  const weightId = React.useId();
  const errorId = React.useId();

  return (
    <section className="py-20 bg-white border-y border-ruah-100">
      <div className="section-container grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-gold">Provador virtual</span>
          <h2 className="text-4xl font-serif italic uppercase text-ruah-950">Recomendação de tamanho</h2>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-ruah-400">Informe medidas básicas para reduzir erro de escolha</p>
        </div>

        <div className="bg-ruah-50 rounded-3xl border border-ruah-100 p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-ruah-500">Altura (cm)</span>
              <input
                id={heightId}
                type="number"
                inputMode="numeric"
                min={131}
                max={229}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                aria-invalid={!valid}
                aria-describedby={!valid ? errorId : undefined}
                className="h-11 rounded-xl border border-ruah-100 bg-white px-3 text-sm font-bold text-ruah-950 outline-none focus:border-accent-gold"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-ruah-500">Peso (kg)</span>
              <input
                id={weightId}
                type="number"
                inputMode="numeric"
                min={36}
                max={219}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                aria-invalid={!valid}
                aria-describedby={!valid ? errorId : undefined}
                className="h-11 rounded-xl border border-ruah-100 bg-white px-3 text-sm font-bold text-ruah-950 outline-none focus:border-accent-gold"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['ajustado', 'regular', 'solto'] as FitPreference[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPreference(option)}
                aria-pressed={preference === option}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.1em] border ${preference === option ? 'bg-ruah-950 text-white border-ruah-950' : 'bg-white text-ruah-500 border-ruah-100'}`}
              >
                {option}
              </button>
            ))}
          </div>

          {recommendation ? (
            <div className="rounded-2xl bg-white border border-ruah-100 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-ruah-400">Tamanho recomendado</p>
              <p className="text-4xl font-serif italic text-ruah-950 mt-2">{recommendation.size}</p>
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-ruah-500 leading-loose mt-3">{recommendation.note}</p>
            </div>
          ) : (
            <p id={errorId} className="text-xs font-bold uppercase tracking-[0.1em] text-red-600">
              Preencha valores válidos para calcular a recomendação.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

