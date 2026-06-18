'use client';

import React from 'react';
import { createPortal } from 'react-dom';

export function OverlayPortal({ children }: { children: React.ReactNode }) {
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) return null;

  return createPortal(children, document.body);
}
