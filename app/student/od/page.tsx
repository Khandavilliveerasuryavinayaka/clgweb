'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { 
  Clock, 
  Plus, 
  Calendar, 
  FileCheck, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';

export default function StudentODPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const studentId = user?.id || '';

  const [odModalOpen, setOdModalOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [docName, setDocName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [odRequests, setOdRequests] = useState(() => (user ? mockDb.getODRequests(studentId) : []));

  useEffect(() => {
    if (!studentId) return;
    fetch(`/api/od?studentId=${encodeURIComponent(studentId)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const apiIds = new Set(json.data.map((d: any) => String(d.id)));
          const mockList = mockDb.getODRequests(studentId).filter((m) => !apiIds.has(String(m.id)));
          setOdRequests([...json.data, ...mockList]);
        }
      })
      .catch(() => {});
  }, [studentId]);

  const handleCreateOD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim() || !eventName.trim()) {
      toastError('Please fill in all mandatory OD request fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
      const totalDays = Math.max(1, isNaN(diffDays) ? 1 : diffDays);

      mockDb.createODRequest({
        studentId,
        registerNumber: user?.registerNumber || 'REG2024001',
        studentName: user?.name || 'Rahul Verma',
        department: user?.department || 'Computer Science and Engineering',
        startDate,
        endDate,
        totalDays,
        reason,
        eventName,
        documentName: docName || 'supporting_invitation_letter.pdf',
      });

      setOdRequests([...mockDb.getODRequests(studentId)]);

      try {
        await fetch('/api/od', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            reason,
            startDate,
            endDate,
            totalDays,
            documentUrl: docName || 'supporting_invitation_letter.pdf',
          }),
        });
      } catch (_) {}

      success('On-Duty request submitted for faculty approval.', 'Request Dispatched');
      setOdModalOpen(false);
      setEventName('');
      setStartDate('');
      setEndDate('');
      setReason('');
      setDocName('');
    } catch (err: any) {
      toastError(err.message || 'Failed to submit OD request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PortalLayout role="STUDENT">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              On-Duty (OD) Applications
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Apply for academic attendance concession for certified hackathons, symposiums, and sports representations.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setOdModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Apply for On-Duty (OD)
          </Button>
        </div>

        {/* Requests Table */}
        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">OD Request History & Status</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4">Event / Activity</th>
                    <th className="p-4">Date Range</th>
                    <th className="p-4">Days</th>
                    <th className="p-4">Reason / Purpose</th>
                    <th className="p-4">Supporting Document</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Faculty Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {odRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No On-Duty applications filed.
                      </td>
                    </tr>
                  ) : (
                    odRequests.map((od) => (
                      <tr key={od.id} className="hover:bg-slate-50/60">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{od.eventName}</div>
                          <div className="text-[11px] text-slate-400">Ref: #{od.appId || od.id}</div>
                        </td>
                        <td className="p-4 font-medium text-slate-700">
                          {formatDate(od.startDate)} → {formatDate(od.endDate)}
                        </td>
                        <td className="p-4 font-bold text-brand-600">{od.totalDays} Days</td>
                        <td className="p-4 text-slate-600 max-w-xs leading-relaxed">{od.reason}</td>
                        <td className="p-4">
                          {od.documentName ? (
                            <span className="inline-flex items-center gap-1 text-brand-600 hover:underline cursor-pointer">
                              <FileText className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[120px]">{od.documentName}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge status={od.status}>{od.status}</Badge>
                        </td>
                        <td className="p-4 text-slate-500 text-[11px]">
                          {od.facultyRemarks ? (
                            <div>
                              <div>{od.facultyRemarks}</div>
                              <div className="text-slate-400 mt-0.5 font-medium">By {od.reviewedBy}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Pending review</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Apply OD Modal */}
        <Modal
          isOpen={odModalOpen}
          onClose={() => setOdModalOpen(false)}
          title="Apply for Academic On-Duty (OD)"
          maxWidth="md"
        >
          <form onSubmit={handleCreateOD} className="space-y-4">
            <Input
              label="Event / Symposium / Competition Name"
              required
              placeholder="e.g. Smart India Hackathon 2025 Grand Finale"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <Textarea
              label="Justification / Role in Event"
              required
              rows={3}
              placeholder="Explain your participation and why academic OD is required..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <Input
              label="Supporting Certificate / Letter File Name"
              placeholder="e.g. selection_invitation_letter.pdf"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              helperText="Upload or mention the authenticated invitation PDF."
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOdModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Submit OD Application
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
