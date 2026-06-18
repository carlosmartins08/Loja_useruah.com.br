'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, MessageSquare, Package, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppImage } from '@/components/shared/AppImage';
import { OverlayPortal } from '@/components/shared/OverlayPortal';
import { useFocusTrap } from '@/hooks/use-focus-trap';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const router = useRouter();
  const [mobileTab, setMobileTab] = React.useState<'category' | 'corporate'>('category');
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);

  const handleNavigate = (href: string) => {
    router.push(href);
    onClose();
  };

  useFocusTrap({
    active: isOpen,
    containerRef: mobileMenuRef,
    onEscape: onClose,
  });

  return (
    <OverlayPortal>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-overlay bg-ruah-950/80 backdrop-blur-sm md:hidden"
            onClick={onClose}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              id="mobile-main-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu principal mobile"
              ref={mobileMenuRef}
              tabIndex={-1}
              className="relative z-drawer flex h-full w-[85%] max-w-md flex-col bg-white"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-ruah-50 p-10">
                <button type="button" onClick={() => handleNavigate('/')} className="text-left">
                  <AppImage
                    context="content-banner"
                    src="/brand/SVG/logo-wordmark-dark.svg"
                    alt="UseRuah"
                    width={180}
                    height={48}
                    className="h-8 w-auto"
                  />
                </button>
                <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-ruah-50">
                  <X size={24} />
                </button>
              </div>

              <div className="mx-8 mt-8 flex rounded-2xl bg-ruah-50 p-2">
                <button
                  type="button"
                  onClick={() => setMobileTab('category')}
                  className={`flex-1 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${mobileTab === 'category' ? 'bg-white text-ruah-950 shadow-sm' : 'text-ruah-400'}`}
                >
                  Shop
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('corporate')}
                  className={`flex-1 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${mobileTab === 'corporate' ? 'bg-white text-ruah-950 shadow-sm' : 'text-ruah-400'}`}
                >
                  Sobre nos
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-10 py-12">
                <AnimatePresence mode="wait">
                  {mobileTab === 'category' ? (
                    <motion.nav
                      key="cats"
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: { staggerChildren: 0.08, delayChildren: 0.1 },
                        },
                      }}
                      className="flex flex-col gap-10"
                    >
                      {[
                        { label: 'Catalogo completo', href: '/shop' },
                        { label: 'Linha autoral', href: '/shop' },
                        { label: 'Campanhas', href: '/shop' },
                        { label: 'Fardamento', href: '/shop' },
                        { label: 'Acessorios', href: '/shop' },
                      ].map((item) => (
                        <motion.div
                          key={item.label}
                          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                        >
                          <button type="button" onClick={() => handleNavigate(item.href)} className="group flex w-full items-center justify-between text-left">
                            <span className="pointer-events-none text-2xl font-serif italic text-ruah-950">{item.label}</span>
                            <ArrowRight size={20} className="pointer-events-none text-accent-gold" />
                          </button>
                        </motion.div>
                      ))}
                    </motion.nav>
                  ) : (
                    <motion.nav
                      key="corp"
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: { staggerChildren: 0.08, delayChildren: 0.1 },
                        },
                      }}
                      className="flex flex-col gap-8"
                    >
                      {[
                        { label: 'Quem somos', href: '/quem-somos' },
                        { label: 'Ajuda e suporte', href: '/help-center' },
                        { label: 'Rastrear pedido', href: '/account/orders' },
                        { label: 'Politicas da loja', href: '/policies' },
                      ].map((item) => (
                        <motion.div
                          key={item.label}
                          variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                        >
                          <button type="button" onClick={() => handleNavigate(item.href)} className="text-left text-xs font-bold uppercase tracking-[0.2em] text-ruah-400">
                            {item.label}
                          </button>
                        </motion.div>
                      ))}
                    </motion.nav>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-auto border-t border-ruah-50 bg-ruah-50/50 p-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col gap-6"
                >
                  <button type="button" onClick={() => handleNavigate('/help-center')} className="group flex w-full items-center gap-4 text-left">
                    <div className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gold text-white">
                      <MessageSquare size={18} />
                    </div>
                    <div className="pointer-events-none">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-ruah-950">Atendimento</span>
                      <span className="text-[9px] font-medium uppercase tracking-widest text-ruah-400">Canal de suporte</span>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleNavigate('/account/orders')} className="group flex w-full items-center gap-4 text-left">
                    <div className="pointer-events-none flex h-10 w-10 items-center justify-center rounded-xl bg-ruah-950 text-white">
                      <Package size={18} />
                    </div>
                    <div className="pointer-events-none">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-ruah-950">Pedidos</span>
                      <span className="text-[9px] font-medium uppercase tracking-widest text-ruah-400">Rastrear pedido</span>
                    </div>
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </OverlayPortal>
  );
}
