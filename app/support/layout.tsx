'use client';

import React from 'react';
import { RoleNamespaceGuard } from '@/components/routing/RoleNamespaceGuard';

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <RoleNamespaceGuard allowedRoles={['support_agent', 'platform_admin']}>{children}</RoleNamespaceGuard>;
}

