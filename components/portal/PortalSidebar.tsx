'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { 
  GraduationCap, 
  LayoutDashboard, 
  User, 
  BookOpen, 
  FileEdit, 
  CalendarCheck, 
  Clock, 
  Award, 
  FileText, 
  CreditCard, 
  Receipt, 
  Bell, 
  Settings, 
  Users, 
  CheckSquare, 
  BarChart3, 
  ShieldAlert, 
  History, 
  Building2, 
  FolderGit2, 
  Layers, 
  Lock, 
  LogOut,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Send,
  Calendar,
  X
} from 'lucide-react';

interface SidebarProps {
  role: 'STUDENT' | 'FACULTY' | 'ADMIN';
  isOpen?: boolean;
  onClose?: () => void;
}

export const PortalSidebar: React.FC<SidebarProps> = ({ role, isOpen, onClose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const studentNav = [
    { label: 'Dashboard', href: '/student', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Profile', href: '/student/profile', icon: <User className="w-4 h-4" /> },
    { label: 'My Courses', href: '/student/courses', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Course Registration', href: '/student/course-registration', icon: <FileEdit className="w-4 h-4" /> },
    { label: 'Attendance', href: '/student/attendance', icon: <CalendarCheck className="w-4 h-4" /> },
    { label: 'OD Requests', href: '/student/od', icon: <Clock className="w-4 h-4" /> },
    { label: 'Internal Marks', href: '/student/internal-marks', icon: <Award className="w-4 h-4" /> },
    { label: 'Assignments', href: '/student/assignments', icon: <FileText className="w-4 h-4" /> },
    { label: 'Results', href: '/student/results', icon: <CheckSquare className="w-4 h-4" /> },
    { label: 'Fees', href: '/student/fees', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Receipts', href: '/student/receipts', icon: <Receipt className="w-4 h-4" /> },
    { label: 'Notifications', href: '/student/notifications', icon: <Bell className="w-4 h-4" /> },
    { label: 'Settings', href: '/student/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const facultyNav = [
    { label: 'Dashboard', href: '/faculty', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Teaching Modules', href: '/faculty/courses', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Create Course', href: '/faculty/create-course', icon: <FileEdit className="w-4 h-4" /> },
    { label: 'Enrollment Requests', href: '/faculty/enrollment-requests', icon: <Users className="w-4 h-4" /> },
    { label: 'Students', href: '/faculty/students', icon: <User className="w-4 h-4" /> },
    { label: 'Attendance', href: '/faculty/attendance', icon: <CalendarCheck className="w-4 h-4" /> },
    { label: 'OD Requests', href: '/faculty/od', icon: <Clock className="w-4 h-4" /> },
    { label: 'Internal Marks', href: '/faculty/internal-marks', icon: <Award className="w-4 h-4" /> },
    { label: 'Assignments', href: '/faculty/assignments', icon: <FileText className="w-4 h-4" /> },
    { label: 'Results', href: '/faculty/results', icon: <CheckSquare className="w-4 h-4" /> },
    { label: 'Student 360', href: '/faculty/student-360', icon: <ShieldAlert className="w-4 h-4" /> },
    { label: 'Notifications', href: '/faculty/notifications', icon: <Bell className="w-4 h-4" /> },
    { label: 'Profile', href: '/faculty/profile', icon: <User className="w-4 h-4" /> },
  ];

  const adminNav = [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Students', href: '/admin/students', icon: <Users className="w-4 h-4" /> },
    { label: 'Faculty', href: '/admin/faculty', icon: <User className="w-4 h-4" /> },
    { label: 'Departments', href: '/admin/departments', icon: <Building2 className="w-4 h-4" /> },
    { label: 'Programs', href: '/admin/programs', icon: <FolderGit2 className="w-4 h-4" /> },
    { label: 'Course Registration', href: '/admin/course-registration', icon: <FileEdit className="w-4 h-4" /> },
    { label: 'Fee Assignment', href: '/admin/fee-assignment', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Results Approval', href: '/admin/results/approval', icon: <CheckSquare className="w-4 h-4" /> },
    { label: 'Results Publishing', href: '/admin/results/publishing', icon: <Send className="w-4 h-4" /> },
    { label: 'Blocked Students', href: '/admin/blocked-students', icon: <ShieldAlert className="w-4 h-4" /> },
    { label: 'Reports', href: '/admin/reports', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Notifications', href: '/admin/notifications', icon: <Bell className="w-4 h-4" /> },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: <ShieldCheck className="w-4 h-4" /> },
    { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const currentNav = role === 'STUDENT' ? studentNav : role === 'FACULTY' ? facultyNav : adminNav;

  const roleColors = {
    STUDENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    FACULTY: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <aside
      className={cn(
        'w-72 sm:w-64 bg-navy-950 text-slate-300 flex flex-col shrink-0 border-r border-navy-900 transition-all z-30 h-screen sticky top-0',
        isOpen ? 'flex h-full' : 'hidden lg:flex'
      )}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-navy-900 flex items-center justify-between">
        <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-white tracking-tight">SV COLLEGE</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase', roleColors[role])}>
            {role}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close menu"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {currentNav.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group',
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              )}
            >
              <span className={cn(isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')}>
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
            </Link>
          );
        })}
      </div>

      {/* User Mini Footer */}
      <div className="p-3 border-t border-navy-900 bg-black/20">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-lg object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="truncate text-left">
              <div className="text-xs font-bold text-white truncate">{user?.name || 'Authorized User'}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">{user?.registerNumber}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
