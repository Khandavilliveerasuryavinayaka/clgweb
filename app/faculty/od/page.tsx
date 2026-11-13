'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ODRequest } from '@/types';
import { formatDate } from '@/lib/utils';
import { Clock, CheckCircle2, XCircle, FileText, Check, X } from 'lucide-react';

export default function FacultyODPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [odRequests, setOdRequests] = useState<ODRequest[]>(() => mockDb.getODRequests());

  useEffect(() => {
    fetch('/api/od', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const apiIds = new Set(json.data.map((d: any) => String(d.id)));
          const mockList = mockDb.getODRequests().filter((m) => !apiIds.has(String(m.id)));
          setOdRequests([...json.data, ...mockList]);
        }
      })
      .catch(() => {});
  }, []);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    odId: string;
    action: 'Approved' | 'Rejected';
    title: string;
    message: string;
  }>({
    isOpen: false,
    odId: '',
    action: 'Approved',
    title: '',
    message: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const openActionDialog = (od: ODRequest, action: 'Approved' | 'Rejected') => {
    setConfirmDialog({
      isOpen: true,
      odId: od.id,
      action,
      title: `${action === 'Approved' ? 'Approve' : 'Reject'} On-Duty Request`,
      message: `Are you sure you want to ${action.toLowerCase()} the OD request for ${od.studentName} (${od.registerNumber}) for "${od.eventName}"? Approved OD will credit classroom attendance.`,
    });
  };

  const handleConfirmAction = async (remarks?: string) => {
    setIsLoading(true);
    try {
      mockDb.reviewODRequest(
        confirmDialog.odId,
        confirmDialog.action,
        user?.name || 'Prof. Anand Kumar',
        remarks || (confirmDialog.action === 'Approved' ? 'Verified event documentation.' : 'Insufficient justification.')
      );

      setOdRequests((prev) =>
        prev.map((o) =>
          o.id === confirmDialog.odId
            ? { ...o, status: confirmDialog.action, facultyRemarks: remarks }
            : o
        )
      );

      try {
        await fetch('/api/od', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: confirmDialog.odId,
            status: confirmDialog.action,
            remarks,
            reviewerId: user?.id,
          }),
        });
      } catch (_) {}

      setIsLoading(false);
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      success(
        `OD Request marked as ${confirmDialog.action}. Student notification dispatched.`,
        'Action Recorded'
      );
    } catch (err: any) {
      setIsLoading(false);
      toastError(err.message || 'Failed to review OD request.');
    }
  };

  return (
    <PortalLayout role="FACULTY">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            On-Duty (OD) Request Authorizations
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review student participation in technical hackathons, paper presentations, and collegiate symposiums.
          </p>
        </div>

        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Applications Queue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Event Details</th>
                    <th className="p-4">Dates</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Document</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Faculty Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {odRequests.map((od) => (
                    <tr key={od.id} className="hover:bg-slate-50/60">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{od.studentName}</div>
                        <div className="font-mono text-slate-400 text-[11px]">{od.registerNumber}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{od.eventName}</div>
                        <div className="text-slate-500 text-[11px] line-clamp-1">{od.reason}</div>
                      </td>
                      <td className="p-4 font-medium text-slate-700">
                        {formatDate(od.startDate)} → {formatDate(od.endDate)}
                      </td>
                      <td className="p-4 font-bold text-brand-700">{od.totalDays} Days</td>
                      <td className="p-4">
                        {od.documentName ? (
                          <span className="inline-flex items-center gap-1 text-brand-600 hover:underline cursor-pointer">
                            <FileText className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[100px]">{od.documentName}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge status={od.status}>{od.status}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        {od.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              className="h-7 text-xs px-2.5"
                              onClick={() => openActionDialog(od, 'Approved')}
                              leftIcon={<Check className="w-3.5 h-3.5" />}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs px-2.5"
                              onClick={() => openActionDialog(od, 'Rejected')}
                              leftIcon={<X className="w-3.5 h-3.5" />}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">
                            Reviewed by {od.reviewedBy}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Modal */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={handleConfirmAction}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.action}
          variant={confirmDialog.action === 'Approved' ? 'success' : 'destructive'}
          isLoading={isLoading}
          requireReason={confirmDialog.action === 'Rejected'}
          reasonPlaceholder="Enter mandatory rejection reason for the student..."
        />
      </div>
    </PortalLayout>
  );
}
