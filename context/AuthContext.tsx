'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, AccountStatus } from '@/types';
import { useRouter, usePathname } from 'next/navigation';
import { mockDb } from '@/lib/data/mockDatabase';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  accountStatus: AccountStatus | null;
  isAuthenticated: boolean;
  isBlocked: boolean;
  isLoading: boolean;
  login: (registerNumber: string, password?: string, honeypot?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  switchUser: (registerNumber: string) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load session from localStorage on initial render
  useEffect(() => {
    try {
      const savedUserJson = localStorage.getItem('sv_college_session');
      if (savedUserJson) {
        const parsed = JSON.parse(savedUserJson);
        setUser(parsed);
        mockDb.upsertUser(parsed);
      }
    } catch (e) {
      console.error('Failed to parse session from storage', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      if (user.role === 'STUDENT') {
        const res = await fetch(`/api/students?id=${encodeURIComponent(user.id)}`);
        const json = await res.json();
        if (json.success && json.data) {
          const updated = { ...user, ...json.data };
          setUser(updated);
          localStorage.setItem('sv_college_session', JSON.stringify(updated));
        }
      } else if (user.role === 'FACULTY') {
        const res = await fetch(`/api/faculty?id=${encodeURIComponent(user.id)}`);
        const json = await res.json();
        if (json.success && json.data) {
          const updated = { ...user, ...json.data };
          setUser(updated);
          localStorage.setItem('sv_college_session', JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  }, [user]);

  const login = async (registerNumber: string, password?: string, honeypot?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registerNumber, password, honeypot }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || data.message || 'Authentication failed.' };
      }

      const authenticatedUser: User = data.data.user;
      setUser(authenticatedUser);
      mockDb.upsertUser(authenticatedUser);
      localStorage.setItem('sv_college_session', JSON.stringify(authenticatedUser));
      return { success: true, user: authenticatedUser };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (e) {
      // Ignore network errors on logout
    }
    setUser(null);
    localStorage.removeItem('sv_college_session');
    sessionStorage.clear();
    router.replace('/login');
  };

  const switchUser = async (registerNumber: string, customPassword?: string) => {
    let pwd = customPassword;
    if (!pwd) {
      const clean = registerNumber.trim().toLowerCase();
      if (clean === 'admin' || clean === 'admin001') {
        pwd = 'Admin@123';
      } else if (clean === 'fac101' || clean === 'fac001') {
        pwd = 'staff';
      } else {
        pwd = 'welcome';
      }
    }

    const res = await login(registerNumber, pwd);
    if (res.success && res.user) {
      if (res.user.role === 'ADMIN') router.push('/admin');
      else if (res.user.role === 'FACULTY') router.push('/faculty');
      else if (res.user.accountStatus === 'BLOCKED') router.push('/blocked');
      else router.push('/student');
    }
  };

  const isBlocked = user?.role === 'STUDENT' && user?.accountStatus === 'BLOCKED';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        accountStatus: user?.accountStatus || null,
        isAuthenticated: !!user,
        isBlocked,
        isLoading,
        login,
        logout,
        switchUser,
        refreshUser,
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
