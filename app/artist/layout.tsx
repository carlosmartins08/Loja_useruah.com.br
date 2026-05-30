'use client';

import React from 'react';
import { RoleNamespaceGuard } from '@/components/routing/RoleNamespaceGuard';

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  return <RoleNamespaceGuard allowedRoles={['artist', 'platform_admin']}>{children}</RoleNamespaceGuard>;
}

