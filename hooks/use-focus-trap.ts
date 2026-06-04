'use client';

import React from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface UseFocusTrapParams {
  active: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
  onEscape?: () => void;
}

export function useFocusTrap({ active, containerRef, onEscape }: UseFocusTrapParams) {
  React.useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previousActive = document.activeElement as HTMLElement | null;
    const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    const first = focusable[0] ?? container;
    const last = focusable[focusable.length - 1] ?? container;

    first.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape?.();
        return;
      }

      if (event.key !== 'Tab') return;
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const activeEl = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (!activeEl || activeEl === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!activeEl || activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActive?.focus();
    };
  }, [active, containerRef, onEscape]);
}

