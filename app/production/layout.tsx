'use client';

import React from 'react';
import { RoleNamespaceGuard } from '@/components/routing/RoleNamespaceGuard';

export default function ProductionLayout({ children }: { children: React.ReactNode }) {
  return <RoleNamespaceGuard allowedRoles={['production_operator', 'platform_admin']}>{children}</RoleNamespaceGuard>;
}

