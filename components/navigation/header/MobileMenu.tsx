'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, MessageSquare, Package, X } from 'lucide-react';
import Link from 'next/link';
import { AppImage } from '@/components/shared/AppImage';
import { useFocusTrap } from '@/hooks/use-focus-trap';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [mobileTab, setMobileTab] = React.useState<'category' | 'corporate'>('category');
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);

  useFocusTrap({
    active: isOpen,
    containerRef: mobileMenuRef,
    onEscape: onClose,
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ruah-950/80 backdrop-blur-sm z-overlay md:hidden"
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
            className="relative z-drawer w-[85%] max-w-md h-full bg-white flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-10 flex justify-between items-center border-b border-ruah-50">
              <Link href="/" onClick={onClose}>
                <AppImage
                  context="content-banner"
                  src="/brand/SVG/logo-wordmark-dark.svg"
                  alt="UseRuah"
                  width={180}
                  height={48}
                  className="h-8 w-auto"
                />
              </Link>
              <button onClick={onClose} className="p-2 hover:bg-ruah-50 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex p-2 bg-ruah-50 mx-8 mt-8 rounded-2xl">
              <button
                onClick={() => setMobileTab('category')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${mobileTab === 'category' ? 'bg-white shadow-sm text-ruah-950' : 'text-ruah-400'}`}
              >
                Shop
              </button>
              <button
                onClick={() => setMobileTab('corporate')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${mobileTab === 'corporate' ? 'bg-white shadow-sm text-ruah-950' : 'text-ruah-400'}`}
              >
                Sobre nós
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
                      { label: 'Catálogo completo', href: '/shop' },
                      { label: 'Linha autoral', href: '/shop' },
                      { label: 'Campanhas', href: '/shop' },
                      { label: 'Fardamento', href: '/shop' },
                      { label: 'Acessórios', href: '/shop' },
                    ].map((item) => (
                      <motion.div
                        key={item.label}
                        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                      >
                        <Link href={item.href} className="flex items-center justify-between group" onClick={onClose}>
                          <span className="text-2xl font-serif italic text-ruah-950">{item.label}</span>
                          <ArrowRight size={20} className="text-accent-gold" />
                        </Link>
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
                      { label: 'Políticas da loja', href: '/policies' },
                    ].map((item) => (
                      <motion.div
                        key={item.label}
                        variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                      >
                        <Link
                          href={item.href}
                          className="text-xs font-bold uppercase tracking-[0.2em] text-ruah-400"
                          onClick={onClose}
                        >
                          {item.label}
                        </Link>
                      </motion.div>
                    ))}
                  </motion.nav>
                )}
              </AnimatePresence>
            </div>

            <div className="p-10 border-t border-ruah-50 mt-auto bg-ruah-50/50">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col gap-6"
              >
                <Link href="/help-center" className="flex items-center gap-4 group" onClick={onClose}>
                  <div className="w-10 h-10 bg-accent-gold rounded-xl flex items-center justify-center text-white">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest block text-ruah-950">Atendimento</span>
                    <span className="text-[9px] font-medium uppercase tracking-widest text-ruah-400">Canal de suporte</span>
                  </div>
                </Link>
                <Link href="/account/orders" className="flex items-center gap-4 group" onClick={onClose}>
                  <div className="w-10 h-10 bg-ruah-950 rounded-xl flex items-center justify-center text-white">
                    <Package size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest block text-ruah-950">Pedidos</span>
                    <span className="text-[9px] font-medium uppercase tracking-widest text-ruah-400">Rastrear pedido</span>
                  </div>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
