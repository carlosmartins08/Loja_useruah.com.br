'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { isAdminRole, isAllowedAdminPath, resolveHomeByRole } from '@/lib/access-routing';

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

    if (!isAdminRole(userRole)) {
      router.replace(resolveHomeByRole(userRole));
      return;
    }

    const adminHome = resolveHomeByRole(userRole);
    if (!isAllowedAdminPath(userRole, pathname)) {
      router.replace(adminHome);
    }
  }, [isAuthenticated, isSessionReady, pathname, router, userRole]);

  if (!isSessionReady || !isAuthenticated) return null;
  if (!isAdminRole(userRole)) return null;
  if (!isAllowedAdminPath(userRole, pathname)) return null;

  return <>{children}</>;
}
