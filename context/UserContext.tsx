'use client';

import React from 'react';

interface UserContextType {
  profilePhoto: string | null;
  setProfilePhoto: (url: string | null) => void;
  userName: string;
}

const UserContext = React.createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profilePhoto, setProfilePhoto] = React.useState<string | null>(null);

  // Load from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('ruah_profile_photo');
    if (saved) {
      setTimeout(() => setProfilePhoto(saved), 0);
    }
  }, []);

  const handleSetProfilePhoto = (url: string | null) => {
    setProfilePhoto(url);
    if (url) {
      localStorage.setItem('ruah_profile_photo', url);
    } else {
      localStorage.removeItem('ruah_profile_photo');
    }
  };

  return (
    <UserContext.Provider value={{ profilePhoto, setProfilePhoto: handleSetProfilePhoto, userName: 'Carlos' }}>
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
