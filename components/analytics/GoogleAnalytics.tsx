'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (gaId && window.gtag) {
      const url = pathname + searchParams.toString();
      window.gtag('config', gaId, {
        page_path: url,
      });
    }
  }, [pathname, searchParams, gaId]);

  if (!gaId) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

// Global declaration for TypeScript
declare global {
  type GTagCommand = 'config' | 'event' | 'js' | 'set';
  type GTagOptions = Record<string, string | number | boolean | undefined>;

  interface Window {
    gtag: (
      command: GTagCommand,
      targetId: string,
      options?: GTagOptions
    ) => void;
    dataLayer: unknown[];
  }
}

// Utility to track events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
