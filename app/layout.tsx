import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFFFFF',
};

export const metadata: Metadata = {
  title: {
    default: 'UseRuah | Moda Cristã com Propósito',
    template: '%s | UseRuah'
  },
  description: 'Conectando a comunidade cristã através da moda autoral e design com propósito. O sopro da criação em cada detalhe.',
  keywords: ['moda cristã', 'UseRuah', 'lifestyle cristão', 'roupas cristãs', 'design autoral', 'comunidade cristã'],
  authors: [{ name: 'UseRuah' }],
  creator: 'UseRuah',
  publisher: 'UseRuah',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://useruah.com.br',
    title: 'UseRuah | Moda Cristã com Propósito',
    description: 'Conectando a comunidade cristã através da moda autoral e design com propósito.',
    siteName: 'UseRuah',
    images: [
      {
        url: 'https://useruah.com.br/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'UseRuah Moda Cristã',
      },
    ],
  },
  icons: {
    icon: [{ url: '/icon' }],
    shortcut: ['/icon'],
    apple: [{ url: '/apple-icon' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UseRuah | Moda Cristã com Propósito',
    description: 'Conectando a comunidade cristã através da moda autoral e design com propósito.',
    images: ['https://useruah.com.br/opengraph-image'],
  },
};

import { Suspense } from 'react';
import { CartProvider } from '@/context/CartContext';
import { UserProvider } from '@/context/UserContext';
import { CartDrawer } from '@/components/commerce/CartDrawer';
import { WhatsAppSticky } from '@/components/commerce/ProductInteractive';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { ExitIntent } from '@/components/commerce/ExitIntent';

import { PageTransition } from '@/components/navigation/PageTransition';
import { BottomNav } from '@/components/navigation/BottomNav';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
       <body className="font-sans antialiased bg-white text-gray-900 overflow-x-hidden">
        <Suspense fallback={null}>
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
        </Suspense>
        <UserProvider>
          <CartProvider>
            <PageTransition>
              <div className="mobile-app-shell">
                {children}
              </div>
            </PageTransition>
            <CartDrawer />
            <BottomNav />
            <WhatsAppSticky />
            <ExitIntent />
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}

