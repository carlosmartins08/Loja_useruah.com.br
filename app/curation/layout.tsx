'use client';

import React from 'react';
import { RoleNamespaceGuard } from '@/components/routing/RoleNamespaceGuard';

export default function CurationLayout({ children }: { children: React.ReactNode }) {
  return <RoleNamespaceGuard allowedRoles={['curator', 'platform_admin']}>{children}</RoleNamespaceGuard>;
}

