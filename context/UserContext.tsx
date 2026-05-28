'use client';

import React from 'react';

import type { UserRole } from '@/lib/auth-session';
import type { RegistrationStatus } from '@/lib/role-matrix/registration-matrix';

interface UserContextType {
  profilePhoto: string | null;
  setProfilePhoto: (url: string | null) => void;
  userName: string;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  userEmail: string;
  userId: string;
  isAuthenticated: boolean;
  isSessionReady: boolean;
  registrationStatus: RegistrationStatus | null;
  refreshSession: () => Promise<void>;
  refreshRegistration: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = React.createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profilePhoto, setProfilePhoto] = React.useState<string | null>(null);
  const [userRole, setUserRole] = React.useState<UserRole>('customer');
  const [userName, setUserName] = React.useState('Carlos');
  const [userEmail, setUserEmail] = React.useState('carlos@useruah.com.br');
  const [userId, setUserId] = React.useState('usr:carlos@useruah.com.br');
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isSessionReady, setIsSessionReady] = React.useState(false);
  const [registrationStatus, setRegistrationStatus] = React.useState<RegistrationStatus | null>(null);

  const resetToGuestSession = React.useCallback(() => {
    setIsAuthenticated(false);
    setUserRole('customer');
    setUserName('Carlos');
    setUserEmail('carlos@useruah.com.br');
    setUserId('usr:carlos@useruah.com.br');
    setRegistrationStatus(null);
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

  // Load from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('ruah_profile_photo');
    if (saved) {
      setTimeout(() => setProfilePhoto(saved), 0);
    }
    setTimeout(() => {
      void refreshSession();
    }, 0);
  }, [refreshSession]);

  const handleSetProfilePhoto = (url: string | null) => {
    setProfilePhoto(url);
    if (url) {
      localStorage.setItem('ruah_profile_photo', url);
    } else {
      localStorage.removeItem('ruah_profile_photo');
    }
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
        setUserRole: handleSetUserRole,
        userEmail,
        userId,
        isAuthenticated,
        isSessionReady,
        registrationStatus,
        refreshSession,
        refreshRegistration,
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
