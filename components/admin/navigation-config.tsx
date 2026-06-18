import type { LucideIcon } from 'lucide-react';
import { FileClock, Headset, LayoutDashboard, Package, ShoppingBag, Truck, Users } from 'lucide-react';

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  section: 'visao' | 'operacao';
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin', label: 'Cockpit', icon: LayoutDashboard, section: 'visao' },
  { href: '/admin/catalog', label: 'Catalogo', icon: ShoppingBag, section: 'visao' },
  { href: '/admin/registrations', label: 'Cadastros', icon: Users, section: 'visao' },
  { href: '/admin/orders', label: 'Pedidos', icon: FileClock, section: 'operacao' },
  { href: '/production/jobs', label: 'Envios', icon: Truck, section: 'operacao' },
  { href: '/support', label: 'Suporte', icon: Headset, section: 'operacao' },
  { href: '/production', label: 'Producao', icon: Package, section: 'operacao' },
];

export const ADMIN_QUICK_ACTIONS = [
  { href: '/admin/catalog', label: 'Catalogo publicado' },
  { href: '/admin/registrations', label: 'Cadastros da base' },
  { href: '/admin/orders', label: 'Pedidos em andamento' },
  { href: '/support', label: 'Tickets em aberto' },
  { href: '/production/jobs', label: 'Fila de envio' },
] as const;

export const ADMIN_SHORTCUTS = [
  { href: '/admin/catalog', label: 'Publicar catalogo', icon: ShoppingBag },
  { href: '/admin/registrations', label: 'Cadastros e matriz', icon: FileClock },
  { href: '/admin/orders', label: 'Acompanhar pedidos', icon: FileClock },
  { href: '/production/jobs', label: 'Producao e envio', icon: Truck },
] as const;

export function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
