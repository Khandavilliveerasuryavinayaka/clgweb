'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PortalSidebar } from './PortalSidebar';
import { PortalTopbar } from './PortalTopbar';
import { UserRole } from '@/types';
import { Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface PortalLayoutProps {
  role: UserRole;
  children: React.ReactNode;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ role, children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isBlocked, switchUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Strict Security: Unauthenticated users are redirected to login.
        router.replace('/login');
        return;
      }

      // Check if blocked student trying to access student portal
      if (user.role === 'STUDENT' && user.accountStatus === 'BLOCKED' && pathname.startsWith('/student')) {
        router.replace('/blocked');
        return;
      }

      // Prevent Admin from accessing retired management routes directly via manual URL:
      // /admin/semesters, /admin/courses, /admin/fees, /admin/payments, /admin/receipts
      const restrictedAdminRoutes = [
        '/admin/semesters',
        '/admin/courses',
        '/admin/fees',
        '/admin/payments',
        '/admin/receipts',
      ];
      if (user.role === 'ADMIN' && restrictedAdminRoutes.some(r => pathname === r || pathname.startsWith(`${r}/`))) {
        router.replace('/admin');
        return;
      }

      // Role boundary protection: Prevent cross-portal unauthorized access
      if (user.role !== role) {
        if (user.role === 'ADMIN') router.replace('/admin');
        else if (user.role === 'FACULTY') router.replace('/faculty');
        else if (user.role === 'STUDENT') router.replace(user.accountStatus === 'BLOCKED' ? '/blocked' : '/student');
      }
    }
  }, [user, isLoading, role, pathname, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Loading Academic Portal...
          </div>
        </div>
      </div>
    );
  }

  // Cross-role warning if testing different portal with mismatched role
  const isRoleMismatch = user.role !== role;

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* Desktop Sidebar */}
      <PortalSidebar role={role} />

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 flex h-full max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-200">
            <PortalSidebar
              role={role}
              isOpen={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <PortalTopbar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {isRoleMismatch && (
          <div className="bg-amber-500 text-white px-4 py-2 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                You are currently signed in as <strong>{user.name} ({user.role})</strong> while viewing the <strong>{role} Portal</strong>.
              </span>
            </div>
            <button
              onClick={() => {
                if (role === 'STUDENT') switchUser('REG2024001');
                else if (role === 'FACULTY') switchUser('FAC101');
                else switchUser('admin');
              }}
              className="underline font-bold text-amber-950 ml-4 hover:text-black"
            >
              Switch to {role} Persona
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
