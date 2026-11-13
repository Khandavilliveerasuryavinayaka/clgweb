'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Menu, 
  Bell, 
  User, 
  LogOut, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink,
  X
} from 'lucide-react';

interface TopbarProps {
  onToggleMobileMenu: () => void;
}

export const PortalTopbar: React.FC<TopbarProps> = ({ onToggleMobileMenu }) => {
  const pathname = usePathname();
  const { user, logout, isBlocked } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);

  const notifications = mockDb.getNotifications(user?.id, user?.role);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = () => {
    notifications.forEach((n) => mockDb.markNotificationRead(n.id));
    setNotifOpen(false);
  };

  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 1) {
      return `${segments[0].toUpperCase()} DASHBOARD`;
    }
    return segments[segments.length - 1]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <header className="sticky top-0 z-20 w-full bg-white border-b border-slate-200 shadow-subtle h-16 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile menu toggle + breadcrumb title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            {user?.role} Portal
          </div>
          <h1 className="text-base sm:text-lg font-bold text-navy-900 leading-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Blocked Status Banner if applicable */}
        {isBlocked && (
          <Link href="/blocked">
            <Badge status="Blocked" className="cursor-pointer animate-pulse">
              <ShieldAlert className="w-3 h-3 mr-1" />
              Account BLOCKED
            </Badge>
          </Link>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-modal border border-slate-200 z-50 overflow-hidden animate-in zoom-in-95">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="font-bold text-sm text-slate-900">Notifications ({unreadCount} unread)</div>
                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No new notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 hover:bg-slate-50 transition-colors ${
                        !n.isRead ? 'bg-brand-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-xs text-slate-900">{n.title}</span>
                        <Badge variant="neutral" className="text-[9px] px-1.5">
                          {n.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => setNotifOpen(false)}
                          className="text-[11px] text-brand-600 font-semibold hover:underline mt-1.5 inline-block"
                        >
                          View Details →
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-800"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Mini Profile & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-none">{user?.name}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user?.registerNumber}</div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
