import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@/types';

interface AuthContextType {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
}

const SUPER_ADMIN: UserProfile = {
  id: 'usr-codeyogi-superadmin',
  email: 'info@thecodeyogi.com',
  full_name: 'CodeYogi Super Admin',
  role: 'admin',
  department: 'Infrastructure & DevOps',
  created_at: '2024-01-01T00:00:00Z',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('renewly_auth_token') === 'authenticated';
  });

  const login = (email: string, pass: string): boolean => {
    if (email.trim().toLowerCase() === 'info@thecodeyogi.com' && pass === 'Admin123@=') {
      localStorage.setItem('renewly_auth_token', 'authenticated');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('renewly_auth_token');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser: SUPER_ADMIN,
        isAuthenticated,
        isAdmin: true, // info@thecodeyogi.com has 100% root rights: edit, delete, create
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
