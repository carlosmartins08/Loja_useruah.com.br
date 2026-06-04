'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Percent } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import uxRules from '@/data/ux-rules.json';
import { useFocusTrap } from '@/hooks/use-focus-trap';

type ExitVariant = {
  id: string;
  routeMatch: string;
  badge: string;
  headline: string;
  body: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

function routeMatches(pattern: string, pathname: string) {
  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -1);
    return pathname.startsWith(base);
  }
  return pattern === pathname;
}

function resolveVariant(pathname: string, variants: ExitVariant[]) {
  return variants.find((item) => routeMatches(item.routeMatch, pathname)) ?? null;
}

function interpolate(value: string, values: Record<string, string>) {
  return value.replace(/\{([a-zA-Z0-9_]+)\}/g, (_whole, key: string) => values[key] ?? '');
}

export function ExitIntent() {
  const config = uxRules.exitIntent;
  const pathname = usePathname();
  const { cart } = useCart();
  const { isSessionReady, isAuthenticated, userRole } = useUser();
  const [show, setShow] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const isCommercial = config.allowedRoutes.some((pattern) => routeMatches(pattern, pathname));
  const allowAnonymous = config.allowAnonymous !== false;
  const allowedRoles = (config.allowedUserRoles ?? []) as string[];
  const roleAllowed = !isAuthenticated ? allowAnonymous : allowedRoles.includes(userRole);
  const variant = resolveVariant(pathname, config.variants as ExitVariant[]);
  const values = { couponCode: config.couponCode, discount: config.discount };
  const badge = variant?.badge ?? 'Oferta por Comportamento';
  const headline = interpolate(variant?.headline ?? config.headlineDefault, values);
  const body = interpolate(variant?.body ?? config.bodyDefault, values);
  const ctaPrimary = variant?.ctaPrimary ?? 'Garantir meu desconto';
  const ctaSecondary = variant?.ctaSecondary ?? 'Continuar navegando sem desconto';

  useEffect(() => {
    if (!config.enabled) return;
    if (!isSessionReady) return;
    if (!roleAllowed) return;
    if (!isCommercial) return;
    if (config.onlyWithCartItems && cart.length === 0) return;

    // Exit intent por mouse não faz sentido em touch/mobile.
    const coarsePointer = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    if (config.disableOnTouchDevices && coarsePointer) return;
    const alreadyShownInSession = typeof window !== 'undefined' && window.sessionStorage.getItem(config.sessionKey) === '1';
    const lastShownAt = typeof window !== 'undefined' ? Number(window.localStorage.getItem(config.cooldownStorageKey) ?? '0') : 0;
    const inCooldown = Number.isFinite(lastShownAt) && Date.now() - lastShownAt < Number(config.cooldownMs);
    if (alreadyShownInSession || hasShown || inCooldown) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && e.relatedTarget === null) {
        setShow(true);
        setHasShown(true);
        window.sessionStorage.setItem(config.sessionKey, '1');
        window.localStorage.setItem(config.cooldownStorageKey, String(Date.now()));
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [cart.length, config.cooldownMs, config.cooldownStorageKey, config.disableOnTouchDevices, config.enabled, config.onlyWithCartItems, config.sessionKey, hasShown, isCommercial, isSessionReady, roleAllowed]);

  useEffect(() => {
    if (!show) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShow(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [show]);

  useFocusTrap({
    active: show,
    containerRef: modalRef,
    onEscape: () => setShow(false),
  });

  if (!config.enabled || !isSessionReady || !roleAllowed || !show || !isCommercial) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setShow(false)}
        className="fixed inset-0 z-modal bg-lumina-950/40 backdrop-blur-md flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-intent-title"
          ref={modalRef}
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
          className="bg-white rounded-[3rem] overflow-hidden max-w-xl w-full relative"
        >
           <button aria-label="Fechar oferta" onClick={() => setShow(false)} className="absolute top-8 right-8 text-lumina-300 hover:text-lumina-950 transition-colors">
              <X size={24} />
           </button>

           <div className="p-16 flex flex-col items-center text-center gap-8">
              <div className="w-20 h-20 bg-accent-blue/5 rounded-full flex items-center justify-center text-accent-blue">
                 <Percent size={32} />
              </div>
              
              <div className="flex flex-col gap-4">
                 <span className="tech-label text-accent-blue">{badge}</span>
                 <h2 id="exit-intent-title" className="text-4xl lg:text-5xl font-serif leading-none italic uppercase">{headline}</h2>
                 <p className="text-sm font-medium uppercase tracking-[0.1em] text-lumina-400 leading-relaxed max-w-xs mx-auto">
                    {body.split(config.couponCode)[0]}
                    <span className="text-lumina-950 font-bold">{config.couponCode}</span>
                    {body.split(config.couponCode).slice(1).join(config.couponCode)}
                 </p>
              </div>

              <button 
                onClick={() => setShow(false)}
                className="w-full bg-lumina-950 text-white py-6 rounded-2xl font-bold uppercase text-xs tracking-[0.1em] hover:bg-accent-blue transition-all"
              >
                 {ctaPrimary}
              </button>

              <button 
                 onClick={() => setShow(false)}
                 className="text-xs font-bold text-lumina-300 uppercase tracking-[0.1em] border-b border-lumina-100 pb-1"
              >
                 {ctaSecondary}
              </button>
           </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


