import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #334155 100%)',
          color: '#f8fafc',
        }}
      >
        <div style={{ fontSize: 36, opacity: 0.85 }}>UseRuah</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 78, fontWeight: 700, color: '#f59e0b' }}>
            Moda Cristã
          </div>
          <div style={{ fontSize: 46, fontWeight: 500 }}>
            com propósito e identidade autoral
          </div>
        </div>
        <div style={{ fontSize: 28, opacity: 0.9 }}>useruah.com.br</div>
      </div>
    ),
    size
  );
}
