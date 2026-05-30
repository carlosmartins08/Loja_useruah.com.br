'use client';

import React from 'react';
import { RoleNamespaceGuard } from '@/components/routing/RoleNamespaceGuard';

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return <RoleNamespaceGuard allowedRoles={['supplier', 'platform_admin']}>{children}</RoleNamespaceGuard>;
}

