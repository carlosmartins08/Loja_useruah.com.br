'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import type { UserRole } from '@/lib/auth-session';

function resolveAdminHome(userRole: 'platform_admin' | 'support_agent' | 'production_operator') {
  if (userRole === 'production_operator') return '/admin/production';
  if (userRole === 'support_agent') return '/admin/support';
  return '/admin';
}

function isAllowedAdminPath(userRole: UserRole, pathname: string) {
  if (userRole === 'platform_admin') return true;
  if (userRole === 'production_operator') return pathname === '/admin/production';
  if (userRole === 'support_agent') return pathname === '/admin/support';
  return false;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSessionReady, isAuthenticated, userRole } = useUser();

  React.useEffect(() => {
    if (!isSessionReady) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (userRole === 'customer') {
      router.replace('/account');
      return;
    }

    const adminHome = resolveAdminHome(userRole);
    if (!isAllowedAdminPath(userRole, pathname)) {
      router.replace(adminHome);
    }
  }, [isAuthenticated, isSessionReady, pathname, router, userRole]);

  if (!isSessionReady || !isAuthenticated) return null;
  if (userRole === 'customer') return null;
  if (!isAllowedAdminPath(userRole, pathname)) return null;

  return <>{children}</>;
}
