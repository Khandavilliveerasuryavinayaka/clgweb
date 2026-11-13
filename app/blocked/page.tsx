'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ShieldAlert, LogOut, Phone, Mail, HelpCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BlockedAccountPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(225,29,72,0.2),transparent_60%)] pointer-events-none" />

      <div className="max-w-lg w-full bg-white rounded-2xl shadow-modal border border-rose-200 overflow-hidden relative z-10 p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <Badge status="Blocked" className="text-xs">Account Status: BLOCKED</Badge>
          <h2 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            Academic Portal Access Suspended
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Your SV College Student account has been administratively restricted. Protected academic operations, course registration, attendance, mark viewing, and fee submissions are temporarily unavailable.
          </p>
        </div>

        {user && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Student Name:</span>
              <span className="font-bold text-slate-800">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Register Number:</span>
              <span className="font-mono font-bold text-slate-800">{user.registerNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <span className="font-semibold text-slate-800">{user.department}</span>
            </div>
          </div>
        )}

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Resolution Instructions</span>
          </div>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            To resolve this restriction, you must meet with the Academic Administration Deanery or submit a formal redressal appeal. Only the Institutional Administration Office has the authority to revoke this block.
          </p>
          <div className="pt-2 border-t border-amber-200/60 flex flex-wrap justify-between text-[11px] text-amber-900 font-medium">
            <span>Dean Office: Room 102, Admin Block</span>
            <span>Tel: +91 98765 43210</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={logout}
            leftIcon={<LogOut className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Sign Out of Account
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />} className="w-full">
              Back to Public Website
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
