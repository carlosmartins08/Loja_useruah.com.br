'use client';

import Link from 'next/link';
import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#ffffff', padding: 24 }}>
          <section
            style={{
              maxWidth: 680,
              width: '100%',
              border: '1px solid #e5e7eb',
              borderRadius: 24,
              background: '#f8fafc',
              padding: 24,
              textAlign: 'center',
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' }}>
              Erro global
            </p>
            <h1 style={{ fontSize: 28, marginTop: 8, marginBottom: 8, color: '#111827' }}>Falha crítica de renderização</h1>
            <p style={{ color: '#374151', marginBottom: 16 }}>
              O sistema encontrou um erro inesperado. Você pode tentar recuperar sem perder a sessão.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                onClick={reset}
                style={{
                  border: 0,
                  borderRadius: 10,
                  background: '#111827',
                  color: '#fff',
                  padding: '10px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                }}
              >
                Tentar novamente
              </button>
              <Link
                href="/"
                style={{
                  border: '1px solid #d1d5db',
                  borderRadius: 10,
                  background: '#fff',
                  color: '#374151',
                  padding: '10px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  textDecoration: 'none',
                }}
              >
                Ir para início
              </Link>
            </div>
            <pre
              style={{
                marginTop: 16,
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: 12,
                fontSize: 12,
                color: '#6b7280',
              }}
            >
              {error?.message ?? 'unknown_error'}
            </pre>
          </section>
        </main>
      </body>
    </html>
  );
}
