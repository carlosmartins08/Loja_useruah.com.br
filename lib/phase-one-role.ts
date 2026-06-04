import type { UserRole } from '@/lib/auth-session';

export function isPhaseOneAdminMaster(role: UserRole) {
  return role === 'platform_admin';
}

export function getPhaseOneRoleLabel(role: UserRole) {
  if (isPhaseOneAdminMaster(role)) return 'admin_master';
  return role;
}
