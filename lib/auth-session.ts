export type UserRole =
  | 'customer'
  | 'supplier'
  | 'platform_admin'
  | 'support_agent'
  | 'production_operator'
  | 'finance_admin'
  | 'artist'
  | 'community_manager';

export interface AuthSession {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  roles: UserRole[];
  activeRole: UserRole;
}

const VALID_ROLES: UserRole[] = [
  'customer',
  'supplier',
  'platform_admin',
  'support_agent',
  'production_operator',
  'finance_admin',
  'artist',
  'community_manager',
];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && VALID_ROLES.includes(value as UserRole);
}

export function normalizeAuthSession(payload: unknown): AuthSession | null {
  if (!payload || typeof payload !== 'object') return null;
  const row = payload as Record<string, unknown>;
  if (typeof row.userId !== 'string' || typeof row.userName !== 'string' || typeof row.userEmail !== 'string') {
    return null;
  }

  const legacyRole = isUserRole(row.userRole) ? row.userRole : null;
  const parsedRoles = Array.isArray(row.roles) ? row.roles.filter((value): value is UserRole => isUserRole(value)) : [];
  const uniqueRoles = Array.from(new Set(parsedRoles));
  const roles = uniqueRoles.length > 0 ? uniqueRoles : legacyRole ? [legacyRole] : [];
  if (roles.length === 0) return null;

  const activeRole = isUserRole(row.activeRole) && roles.includes(row.activeRole) ? row.activeRole : roles[0];

  return {
    userId: row.userId,
    userName: row.userName,
    userEmail: row.userEmail,
    userRole: legacyRole ?? activeRole,
    roles,
    activeRole,
  };
}
