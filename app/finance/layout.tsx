'use client';

import React from 'react';
import { RoleNamespaceGuard } from '@/components/routing/RoleNamespaceGuard';

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <RoleNamespaceGuard allowedRoles={['finance_admin', 'platform_admin']}>{children}</RoleNamespaceGuard>;
}

