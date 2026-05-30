'use client';

import React from 'react';
import { RoleNamespaceGuard } from '@/components/routing/RoleNamespaceGuard';

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <RoleNamespaceGuard allowedRoles={['community_manager', 'platform_admin']}>{children}</RoleNamespaceGuard>;
}

