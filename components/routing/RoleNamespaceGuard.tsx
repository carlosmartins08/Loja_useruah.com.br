'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import type { UserRole } from '@/lib/auth-session';
import { resolveHomeByRole } from '@/lib/role-routing/access-routing';

interface RoleNamespaceGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleNamespaceGuard({ allowedRoles, children }: RoleNamespaceGuardProps) {
  const router = useRouter();
  const { isSessionReady, isAuthenticated, userRole } = useUser();

  React.useEffect(() => {
    if (!isSessionReady) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!allowedRoles.includes(userRole)) {
      router.replace(resolveHomeByRole(userRole));
    }
  }, [allowedRoles, isAuthenticated, isSessionReady, router, userRole]);

  if (!isSessionReady || !isAuthenticated) return null;
  if (!allowedRoles.includes(userRole)) return null;
  return <>{children}</>;
}
