'use client';

import React from 'react';

import type { UserRole } from '@/lib/auth-session';
import type { RegistrationStatus } from '@/lib/role-matrix/registration-matrix';

interface UserContextType {
  profilePhoto: string | null;
  setProfilePhoto: (url: string | null) => void;
  userName: string;
  userRole: UserRole;
  userRoles: UserRole[];
  setUserRole: (role: UserRole) => void;
  userEmail: string;
  userId: string;
  isAuthenticated: boolean;
  isSessionReady: boolean;
  registrationStatus: RegistrationStatus | null;
  refreshSession: () => Promise<void>;
  refreshRegistration: () => Promise<void>;
  switchActiveRole: (role: UserRole) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const UserContext = React.createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profilePhoto, setProfilePhoto] = React.useState<string | null>(null);
  const [userRole, setUserRole] = React.useState<UserRole>('customer');
  const [userRoles, setUserRoles] = React.useState<UserRole[]>(['customer']);
  const [userName, setUserName] = React.useState('');
  const [userEmail, setUserEmail] = React.useState('');
  const [userId, setUserId] = React.useState('');
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isSessionReady, setIsSessionReady] = React.useState(false);
  const [registrationStatus, setRegistrationStatus] = React.useState<RegistrationStatus | null>(null);

  const resetToGuestSession = React.useCallback(() => {
    setIsAuthenticated(false);
    setUserRole('customer');
    setUserRoles(['customer']);
    setProfilePhoto(null);
    setUserName('');
    setUserEmail('');
    setUserId('');
    setRegistrationStatus(null);
    localStorage.removeItem('ruah_profile_photo');
    localStorage.removeItem('ruah_user_role');
  }, []);

  const refreshRegistration = React.useCallback(async () => {
    try {
      const response = await fetch('/api/auth/registration/me', { cache: 'no-store' });
      if (!response.ok) {
        setRegistrationStatus(null);
        return;
      }
      const payload = (await response.json()) as {
        authenticated: boolean;
        registration: null | { status: RegistrationStatus };
      };
      if (!payload.authenticated || !payload.registration) {
        setRegistrationStatus(null);
        return;
      }
      setRegistrationStatus(payload.registration.status);
    } catch {
      setRegistrationStatus(null);
    }
  }, []);

  const refreshSession = React.useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      if (!response.ok) {
        resetToGuestSession();
        setIsSessionReady(true);
        return;
      }
      const payload = (await response.json()) as {
        authenticated: boolean;
        session: null | { userId: string; userName: string; userEmail: string; userRole: UserRole; roles?: UserRole[]; activeRole?: UserRole };
      };

      if (!payload.authenticated || !payload.session) {
        resetToGuestSession();
        setIsSessionReady(true);
        return;
      }

      setIsAuthenticated(true);
      const sessionRole = payload.session.activeRole ?? payload.session.userRole;
      setUserRole(sessionRole);
      setUserRoles(
        Array.isArray(payload.session.roles) && payload.session.roles.length > 0 ? payload.session.roles : [sessionRole]
      );
      setUserName(payload.session.userName);
      setUserEmail(payload.session.userEmail);
      setUserId(payload.session.userId);
      localStorage.setItem('ruah_user_role', sessionRole);
      await refreshRegistration();
    } catch {
      // On network/session parse failures, fallback to guest to avoid stale privileged state.
      resetToGuestSession();
    } finally {
      setIsSessionReady(true);
    }
  }, [refreshRegistration, resetToGuestSession]);

  const logout = React.useCallback(async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch {}
    resetToGuestSession();
    setIsSessionReady(true);
  }, [resetToGuestSession]);

  const switchActiveRole = React.useCallback(
    async (role: UserRole) => {
      if (!isAuthenticated) return { ok: false as const, error: 'not_authenticated' };
      if (!userRoles.includes(role)) return { ok: false as const, error: 'role_not_in_scope' };
      const response = await fetch('/api/auth/session/active-role', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ activeRole: role }),
      }).catch(() => null);
      if (!response || !response.ok) {
        return { ok: false as const, error: 'switch_failed' };
      }
      await refreshSession();
      return { ok: true as const };
    },
    [isAuthenticated, refreshSession, userRoles]
  );

  // A foto é uma preferência visual temporária, não um atributo persistido da conta.
  React.useEffect(() => {
    localStorage.removeItem('ruah_profile_photo');
    setTimeout(() => {
      void refreshSession();
    }, 0);
  }, [refreshSession]);

  const handleSetProfilePhoto = (url: string | null) => {
    setProfilePhoto(url);
  };

  const handleSetUserRole = (role: UserRole) => {
    setUserRole(role);
    localStorage.setItem('ruah_user_role', role);
  };

  return (
    <UserContext.Provider
      value={{
        profilePhoto,
        setProfilePhoto: handleSetProfilePhoto,
        userName,
        userRole,
        userRoles,
        setUserRole: handleSetUserRole,
        userEmail,
        userId,
        isAuthenticated,
        isSessionReady,
        registrationStatus,
        refreshSession,
        refreshRegistration,
        switchActiveRole,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
