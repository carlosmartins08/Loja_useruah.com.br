'use client';

import React from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('App error boundary:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-3xl border border-ruah-100 bg-ruah-50 p-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ruah-400">Erro de aplicação</p>
        <h1 className="mt-3 text-2xl font-serif italic uppercase text-ruah-950">Algo saiu do fluxo esperado</h1>
        <p className="mt-4 text-sm text-ruah-600">
          Tente recarregar este trecho. Se persistir, siga para a página inicial.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-ruah-950 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="rounded-xl border border-ruah-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-ruah-700"
          >
            Ir para início
          </a>
        </div>
      </div>
    </main>
  );
}

