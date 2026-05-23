export type UserRole = 'customer' | 'platform_admin' | 'support_agent' | 'production_operator';

export interface AuthSession {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
}

const VALID_ROLES: UserRole[] = ['customer', 'platform_admin', 'support_agent', 'production_operator'];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && VALID_ROLES.includes(value as UserRole);
}
