'use client';

import React from 'react';
import { RoleNamespaceGuard } from '@/components/routing/RoleNamespaceGuard';

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return <RoleNamespaceGuard allowedRoles={['affiliate', 'platform_admin']}>{children}</RoleNamespaceGuard>;
}

