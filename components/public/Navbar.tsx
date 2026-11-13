'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { 
  Menu, 
  X, 
  GraduationCap, 
  ArrowRight, 
  User, 
  Phone, 
  Mail, 
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/departments', label: 'Departments' },
    { href: '/programs', label: 'Programs' },
    { href: '/admissions', label: 'Admissions' },
    { href: '/faculty-dir', label: 'Faculty' },
    { href: '/notices', label: 'Notices' },
    { href: '/campus', label: 'Campus' },
    { href: '/contact', label: 'Contact' },
  ];

  const getPortalLink = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'FACULTY') return '/faculty';
    if (user.accountStatus === 'BLOCKED') return '/blocked';
    return '/student';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-200 shadow-subtle transition-all">
      {/* Top micro-bar */}
      <div className="bg-navy-900 text-slate-300 text-xs py-1.5 px-4 hidden sm:block border-b border-navy-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-400" />
              <span>SV College Academic Campus, Technology Enclave</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-brand-400" />
              <span>info@svcollege.edu</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admissions" className="text-amber-300 hover:text-amber-200 font-semibold">
              Admissions 2025-26 Open
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-navy-900 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-lg sm:text-xl tracking-tight text-navy-900 flex items-center gap-1.5">
                <span>SV COLLEGE</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold border border-brand-200">
                  ESTD 2004
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium tracking-wide -mt-0.5">
                Center for Higher Academic Excellence
              </div>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors',
                    isActive
                      ? 'text-brand-600 bg-brand-50/80 font-bold'
                      : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Portal Button */}
          <div className="hidden sm:flex items-center gap-3">
            <Link href={getPortalLink()}>
              <Button
                variant={user ? 'secondary' : 'primary'}
                size="sm"
                leftIcon={user ? <User className="w-4 h-4" /> : undefined}
              >
                {user ? `${user.role} Portal` : 'Portal Login'}
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2 shadow-elevated animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-2 gap-1 pt-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-700 hover:bg-slate-100'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <Link href={getPortalLink()} onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full">
                {user ? `Go to ${user.role} Portal` : 'Portal Login'}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
