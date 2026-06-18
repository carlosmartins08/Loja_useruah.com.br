import type { UserRole } from '@/lib/auth-session';
import { ROLE_HOME_ROUTES } from '@/lib/role-routing/role-namespaces';

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
  return ROLE_HOME_ROUTES[role] ?? '/account';
}

export function isAllowedAdminPath(role: UserRole, pathname: string): boolean {
  if (pathname === '/admin') return role === 'platform_admin';
  if (role === 'platform_admin') return true;
  if (pathname.startsWith('/admin/impact-reviews')) {
    return role === 'curator' || role === 'support_agent' || role === 'finance_admin';
  }
  if (role === 'finance_admin') {
    return pathname.startsWith('/admin/payments/connectors') || pathname.startsWith('/admin/ops-alerts');
  }
  return false;
}
