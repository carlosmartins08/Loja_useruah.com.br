import type { UserRole } from '@/lib/auth-session';

export function isAdminRole(role: UserRole): role is 'platform_admin' | 'support_agent' | 'production_operator' | 'finance_admin' {
  return role === 'platform_admin' || role === 'support_agent' || role === 'production_operator' || role === 'finance_admin';
}

export function resolveHomeByRole(role: UserRole): string {
  if (role === 'production_operator') return '/admin/production';
  if (role === 'support_agent') return '/admin/support';
  if (role === 'finance_admin') return '/admin';
  if (role === 'platform_admin') return '/admin';
  return '/account';
}

export function isAllowedAdminPath(role: UserRole, pathname: string): boolean {
  if (role === 'platform_admin' || role === 'finance_admin') return true;
  if (role === 'production_operator') return pathname === '/admin/production';
  if (role === 'support_agent') return pathname === '/admin/support';
  return false;
}
