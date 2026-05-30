import type { UserRole } from '@/lib/auth-session';

export const ROLE_LABEL: Record<UserRole, string> = {
  customer: 'Cliente',
  supplier: 'Fornecedor',
  curator: 'Curadoria',
  platform_admin: 'Admin',
  support_agent: 'Suporte',
  production_operator: 'Producao',
  finance_admin: 'Financeiro',
  artist: 'Artista',
  community_manager: 'Comunidade',
  affiliate: 'Affiliate',
};

export const ROLE_ORDER: UserRole[] = [
  'customer',
  'supplier',
  'curator',
  'platform_admin',
  'support_agent',
  'production_operator',
  'finance_admin',
  'artist',
  'community_manager',
  'affiliate',
];

const ADMIN_OPERATIONAL_SCOPE: UserRole[] = [
  'platform_admin',
  'curator',
  'support_agent',
  'production_operator',
  'finance_admin',
];

export function getSessionRoleScope(primaryRole: UserRole): UserRole[] {
  if (primaryRole !== 'platform_admin') return [primaryRole];

  if (process.env.NODE_ENV === 'production') {
    return [primaryRole];
  }

  // Optional full-scope mode for QA/debug only.
  if (process.env.AUTH_ADMIN_FULL_SCOPE === 'true') {
    return [...ROLE_ORDER];
  }
  return ADMIN_OPERATIONAL_SCOPE;
}

export function assertRoleScopePolicy() {
  if (process.env.NODE_ENV === 'production' && process.env.AUTH_ADMIN_FULL_SCOPE === 'true') {
    throw new Error('AUTH_ADMIN_FULL_SCOPE must be false in production.');
  }
}

export function sortRolesForUi(roles: UserRole[]) {
  const unique = Array.from(new Set(roles));
  return unique.sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b));
}
