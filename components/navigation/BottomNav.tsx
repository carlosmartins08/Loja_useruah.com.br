'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { Home, ShoppingBag, ShoppingCart, User, Compass } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import { resolveHomeByRole } from '@/lib/access-routing';

export function BottomNav() {
  const pathname = usePathname();
  const { setIsCartOpen, cart } = useCart();
  const { userRole } = useUser();
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const accountHref = resolveHomeByRole(userRole);

  const navItems = [
    { label: 'Início', icon: Home, href: '/' },
    { label: 'Shop', icon: ShoppingBag, href: '/shop' },
    { label: 'Guia', icon: Compass, href: '#', isGuide: true },
    { label: 'Carrinho', icon: ShoppingCart, onClick: () => setIsCartOpen(true), badge: cartItemCount },
    { label: 'Conta', icon: User, href: accountHref },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-sticky bg-white/90 backdrop-blur-xl border-t border-ruah-100 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          const content = (
            <div className="flex flex-col items-center justify-center gap-1 relative w-full h-full">
              <div
                className={`p-2 rounded-xl transition-all duration-300 ${
                  isActive || (item.isGuide && pathname === '/guide') ? 'bg-ruah-950 text-white scale-110' : 'text-ruah-300'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors ${isActive ? 'text-ruah-950' : 'text-ruah-400'}`}>
                {item.label}
              </span>

              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1 right-1/2 translate-x-4 bg-accent-gold text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-accent-gold/20">
                  {item.badge}
                </span>
              )}

              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-1 w-1 h-1 bg-accent-gold rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </div>
          );

          if (item.onClick) {
            return (
              <button key={item.label} onClick={item.onClick} className="flex-1 h-full flex items-center justify-center active:scale-90 transition-transform">
                {content}
              </button>
            );
          }

          if (item.isGuide) {
            return (
              <button
                key={item.label}
                onClick={() => {
                  const btn = document.querySelector('[data-guide-trigger="true"]') as HTMLButtonElement;
                  if (btn) btn.click();
                }}
                className="flex-1 h-full flex items-center justify-center active:scale-90 transition-transform"
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={item.label} href={item.href || '#'} className="flex-1 h-full flex items-center justify-center active:scale-90 transition-transform">
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
