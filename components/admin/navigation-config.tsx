import type { LucideIcon } from 'lucide-react';
import { FileClock, Headset, LayoutDashboard, Package, ShoppingBag, Siren, Users, Wallet } from 'lucide-react';

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  section: 'visao' | 'operacao' | 'financeiro';
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin', label: 'Cockpit', icon: LayoutDashboard, section: 'visao' },
  { href: '/admin/catalog', label: 'Catalogo', icon: ShoppingBag, section: 'visao' },
  { href: '/admin/registrations', label: 'Cadastros', icon: Users, section: 'visao' },
  { href: '/admin/support', label: 'Suporte', icon: Headset, section: 'operacao' },
  { href: '/admin/production', label: 'Producao', icon: Package, section: 'operacao' },
  { href: '/admin/impact-reviews', label: 'Impacto', icon: Siren, section: 'operacao' },
  { href: '/admin/finance/payouts', label: 'Financeiro', icon: Wallet, section: 'financeiro' },
];

export const ADMIN_QUICK_ACTIONS = [
  { href: '/admin/catalog', label: 'Catalogo publicado' },
  { href: '/admin/impact-reviews', label: 'Impactos atrasados' },
  { href: '/admin/support', label: 'Tickets em aberto' },
  { href: '/admin/finance/payouts', label: 'Payout pendente' },
  { href: '/admin/registrations', label: 'Cadastros com pendencia' },
] as const;

export const ADMIN_SHORTCUTS = [
  { href: '/admin/catalog', label: 'Publicar catalogo', icon: ShoppingBag },
  { href: '/admin/impact-reviews', label: 'Decisao de impacto', icon: Siren },
  { href: '/admin/finance/payouts', label: 'Payout e caixa', icon: Wallet },
  { href: '/admin/registrations', label: 'Cadastros e matriz', icon: FileClock },
] as const;

export function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
