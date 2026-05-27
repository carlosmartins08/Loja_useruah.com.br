'use client';

import React from 'react';

import type { UserRole } from '@/lib/auth-session';

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
  refreshSession: () => Promise<void>;
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

  const refreshSession = React.useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      if (!response.ok) {
        setIsSessionReady(true);
        return;
      }
      const payload = (await response.json()) as {
        authenticated: boolean;
        session: null | { userId: string; userName: string; userEmail: string; userRole: UserRole; roles?: UserRole[]; activeRole?: UserRole };
      };

      if (!payload.authenticated || !payload.session) {
        setIsAuthenticated(false);
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
    } catch {
      // best effort hydration from backend session
    } finally {
      setIsSessionReady(true);
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch {}
    setIsAuthenticated(false);
    setUserRole('customer');
    setUserName('Carlos');
    setUserEmail('carlos@useruah.com.br');
    setUserId('usr:carlos@useruah.com.br');
    setIsSessionReady(true);
    localStorage.removeItem('ruah_user_role');
  }, []);

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
        refreshSession,
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
