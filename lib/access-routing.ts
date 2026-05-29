import type { UserRole } from '@/lib/auth-session';

export function isAdminRole(
  role: UserRole
): role is 'platform_admin' | 'support_agent' | 'production_operator' | 'finance_admin' | 'curator' {
  return (
    role === 'platform_admin' ||
    role === 'support_agent' ||
    role === 'production_operator' ||
    role === 'finance_admin' ||
    role === 'curator'
  );
}

export function resolveHomeByRole(role: UserRole): string {
  if (role === 'production_operator') return '/admin';
  if (role === 'support_agent') return '/admin';
  if (role === 'finance_admin') return '/admin';
  if (role === 'curator') return '/admin/impact-reviews';
  if (role === 'affiliate') return '/account';
  if (role === 'platform_admin') return '/admin';
  return '/account';
}

export function isAllowedAdminPath(role: UserRole, pathname: string): boolean {
  if (pathname === '/admin') return true;
  if (role === 'platform_admin') return true;
  if (role === 'finance_admin') {
    return (
      pathname.startsWith('/admin/finance') ||
      pathname.startsWith('/admin/payments/connectors') ||
      pathname.startsWith('/admin/ops-alerts')
    );
  }
  if (role === 'production_operator') return pathname.startsWith('/admin/production');
  if (role === 'support_agent') return pathname.startsWith('/admin/support');
  if (role === 'curator') return pathname.startsWith('/admin/impact-reviews');
  return false;
}
