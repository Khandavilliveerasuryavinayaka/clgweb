'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { BlockRecord } from '@/types';
import { formatDate } from '@/lib/utils';
import { 
  ShieldAlert, 
  Ban, 
  CheckCircle2, 
  Search, 
  History, 
  Unlock, 
  AlertTriangle,
  User
} from 'lucide-react';
import Link from 'next/link';

export default function AdminBlockedStudentsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [unblockDialog, setUnblockDialog] = useState<{
    isOpen: boolean;
    record: BlockRecord | null;
  }>({
    isOpen: false,
    record: null,
  });
  const [isUnblocking, setIsUnblocking] = useState(false);
  const [blockRecords, setBlockRecords] = useState<BlockRecord[]>(() => mockDb.getBlockRecords());

  useEffect(() => {
    fetch('/api/student-blocking')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const merged = [...json.data];
          mockDb.getBlockRecords().forEach((mbr) => {
            if (!merged.some((m) => m.registerNumber === mbr.registerNumber)) {
              merged.push(mbr);
            }
          });
          setBlockRecords(merged);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = blockRecords.filter(
    (b) =>
      b.studentName.toLowerCase().includes(search.toLowerCase()) ||
      b.registerNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.reason.toLowerCase().includes(search.toLowerCase()) ||
      b.blockedBy.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirmUnblock = async (remarks?: string) => {
    if (!unblockDialog.record) return;

    setIsUnblocking(true);
    try {
      // Sync unblock to Supabase backend API
      try {
        await fetch('/api/student-blocking', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registerNumber: unblockDialog.record.registerNumber,
            remarks: remarks || 'Account unblocked by administrative executive.',
            role: 'ADMIN',
            adminId: user?.id || 'usr-admin-1',
          }),
        });
      } catch (backendErr) {
        console.warn('Backend unblock sync skipped', backendErr);
      }

      mockDb.unblockStudent(
        unblockDialog.record.registerNumber,
        remarks || 'Account unblocked by administrative executive.',
        user?.name || 'Dr. K. S. Ramanathan',
        user?.id || 'usr-admin-1',
        'ADMIN'
      );

      setBlockRecords((prev) =>
        prev.map((r) =>
          r.registerNumber === unblockDialog.record?.registerNumber
            ? {
                ...r,
                unblockedAt: new Date().toISOString(),
                unblockedBy: user?.name || 'Dr. K. S. Ramanathan',
                unblockRemarks: remarks || 'Account unblocked by administrative executive.',
              }
            : r
        )
      );

      setIsUnblocking(false);
      setUnblockDialog({ isOpen: false, record: null });
      success(
        `Student ${unblockDialog.record.registerNumber} (${unblockDialog.record.studentName}) has been unblocked. Portal access restored and audited.`,
        'Account Restored'
      );
    } catch (err: any) {
      setIsUnblocking(false);
      toastError(err.message || 'Failed to unblock student.');
    }
  };

  return (
    <PortalLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge status="Blocked">Exclusive Administrator Authority</Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Restricted & Blocked Student Accounts
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Centralized registry of students with blocked portal access. Faculty cannot revoke blocks.
            </p>
          </div>

          <div className="w-full sm:w-80">
            <SearchInput
              placeholder="Search by student, Reg No, or blocker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
            />
          </div>
        </div>

        {/* Blocked Students Table */}
        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">
              Blocked Students Registry ({filtered.length} Records)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Department & Term</th>
                    <th className="p-4">Mandatory Blocking Reason</th>
                    <th className="p-4">Blocked By (Faculty)</th>
                    <th className="p-4">Blocked Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Administrative Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No blocked student records found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((b) => {
                      const isCurrentlyBlocked = !b.unblockedAt;
                      return (
                        <tr
                          key={b.id}
                          className={isCurrentlyBlocked ? 'bg-rose-50/40' : 'hover:bg-slate-50/60'}
                        >
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{b.studentName}</div>
                            <div className="font-mono text-[11px] text-brand-700 font-bold">
                              {b.registerNumber}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-slate-800">{b.department}</div>
                            <div className="text-[11px] text-slate-400">Semester {b.semester}</div>
                          </td>
                          <td className="p-4 max-w-sm">
                            <div className="text-slate-800 font-medium leading-relaxed">{b.reason}</div>
                            {b.unblockRemarks && (
                              <div className="text-[11px] text-emerald-700 mt-1 font-semibold">
                                Unblock Remarks: {b.unblockRemarks} (By {b.unblockedBy})
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-slate-700 font-semibold">{b.blockedBy}</td>
                          <td className="p-4 text-slate-500">{formatDate(b.blockedAt)}</td>
                          <td className="p-4">
                            <Badge status={isCurrentlyBlocked ? 'Blocked' : 'Approved'}>
                              {isCurrentlyBlocked ? 'BLOCKED' : 'RESTORED'}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            {isCurrentlyBlocked ? (
                              <Button
                                size="sm"
                                variant="success"
                                className="h-7 text-xs px-2.5"
                                onClick={() => setUnblockDialog({ isOpen: true, record: b })}
                                leftIcon={<Unlock className="w-3.5 h-3.5" />}
                              >
                                Unblock Student
                              </Button>
                            ) : (
                              <span className="text-[11px] text-slate-400">Restored</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Unblock Confirmation Dialog */}
        <ConfirmDialog
          isOpen={unblockDialog.isOpen}
          onClose={() => setUnblockDialog({ isOpen: false, record: null })}
          onConfirm={handleConfirmUnblock}
          title={`Unblock Student: ${unblockDialog.record?.registerNumber}`}
          message={`Are you sure you want to restore full portal and academic access for ${unblockDialog.record?.studentName} (${unblockDialog.record?.registerNumber})? This will create an immutable audit record and restore their student login.`}
          confirmText="Confirm & Restore Access"
          variant="success"
          isLoading={isUnblocking}
          requireReason={true}
          reasonPlaceholder="Enter mandatory administrative unblock remarks / resolution..."
        />
      </div>
    </PortalLayout>
  );
}
