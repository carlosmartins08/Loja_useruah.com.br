import type { UserRole } from '@/lib/auth-session';

export const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  customer: '/account',
  artist: '/artist',
  community_manager: '/community',
  affiliate: '/affiliate',
  supplier: '/supplier',
  curator: '/curation',
  support_agent: '/support',
  production_operator: '/production',
  finance_admin: '/finance',
  platform_admin: '/admin',
};

export const LEGACY_ROUTE_REDIRECTS: Array<{ from: string; to: string }> = [
  { from: '/account/artist', to: '/artist' },
  { from: '/account/community', to: '/community' },
  { from: '/account/affiliate', to: '/affiliate' },
  { from: '/account/supplier', to: '/supplier' },
  { from: '/admin/support', to: '/support' },
  { from: '/admin/production', to: '/production' },
  { from: '/admin/finance', to: '/finance' },
  { from: '/admin/curation', to: '/curation' },
];

