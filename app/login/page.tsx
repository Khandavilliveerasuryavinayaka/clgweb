'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import {
  GraduationCap,
  Shield,
  UserCheck,
  Ban,
  ArrowRight,
  Lock,
  KeyRound,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  const { success, error: toastError } = useToast();

  const [registerNumber, setRegisterNumber] = useState('');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) {
      // Invisible honeypot was populated by an automated bot
      setErrorMsg('Automated bot interaction detected and prevented.');
      return;
    }

    if (!registerNumber.trim()) {
      setErrorMsg('Please enter your Register Number or Username.');
      return;
    }

    setIsLoggingIn(true);
    setErrorMsg('');

    try {
      const res = await login(registerNumber, password, honeypot);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid credentials.');
        return;
      }

      const user = res.user!;
      success(`Welcome back, ${user.name}!`, 'Authentication Verified');

      // Strict account status check
      if (user.role === 'STUDENT' && user.accountStatus === 'BLOCKED') {
        router.push('/blocked');
        return;
      }

      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'FACULTY') {
        router.push('/faculty');
      } else {
        router.push('/student');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during authentication.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fillQuickAccount = (reg: string, pass: string) => {
    setRegisterNumber(reg);
    setPassword(pass);
    setErrorMsg('');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetSent(true);
    setTimeout(() => {
      setForgotModalOpen(false);
      setResetSent(false);
      setForgotEmail('');
      success('Password reset instructions have been dispatched to your institutional email.', 'Email Dispatched');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.25),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-7 h-7" />
          </div>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          SV College
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Sign in to access Student, Faculty, or Administrative academic services.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-200">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Authentication Failed:</span> {errorMsg}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Anti-Bot Invisible Honeypot Trap */}
            <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
              <label htmlFor="website_hp_code">Leave this verification field empty</label>
              <input
                id="website_hp_code"
                type="text"
                name="website_hp_code"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <Input
              label="Register Number / Username"
              required
              placeholder="e.g. REG2024001 or FAC101 or admin"
              value={registerNumber}
              onChange={(e) => setRegisterNumber(e.target.value)}
              autoFocus
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Password <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-800"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                type="password"
                required
                placeholder="Enter your secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              variant="primary"
              className="w-full font-semibold shadow-md shadow-brand-500/20"
              isLoading={isLoggingIn}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Pre-seed Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Demo Accounts for Testing
              </span>
              <span className="text-[11px] text-brand-600 font-medium">1-Click Fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillQuickAccount('admin', 'Admin@123')}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 text-left transition-colors flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-purple-600 shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-slate-900">Administrator</div>
                  <div className="text-[10px] text-slate-500 font-mono">admin</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillQuickAccount('FAC101', 'staff')}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-colors flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-slate-900">Faculty (HOD)</div>
                  <div className="text-[10px] text-slate-500 font-mono">FAC101 (staff)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillQuickAccount('REG2024001', 'welcome')}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-colors flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-slate-900">Active Student</div>
                  <div className="text-[10px] text-slate-500 font-mono">REG2024001 (welcome)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillQuickAccount('REG2024002', 'welcome')}
                className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-left transition-colors flex items-center gap-2"
              >
                <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-rose-900">Blocked Student</div>
                  <div className="text-[10px] text-rose-600 font-mono">REG2024002</div>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Need public website access?{' '}
            <Link href="/" className="font-bold text-brand-600 hover:text-brand-800">
              Return to SV College Home
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Institutional Password Recovery"
        maxWidth="md"
      >
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Enter your official SV College institutional email or registered Register Number. A secure password reset link will be dispatched.
          </p>

          <Input
            label="Institutional Email / Register Number"
            required
            placeholder="e.g. rahul.verma@svcollege.edu or REG2024001"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForgotModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={resetSent}>
              Send Recovery Instructions
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
