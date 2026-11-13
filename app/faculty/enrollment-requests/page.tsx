'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { Check, X, Users, BookOpen, Clock, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function FacultyEnrollmentRequestsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [facultyCourses, setFacultyCourses] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState(mockDb.getCourseRegistrations());

  const facultyId = user?.id;
  const facultyReg = user?.registerNumber;

  useEffect(() => {
    async function loadCourses() {
      try {
        const facultyParam = facultyId || facultyReg || '';
        const res = await fetch(`/api/courses?facultyId=${encodeURIComponent(facultyParam)}&createdByOnly=true`, { cache: 'no-store' });
        const json = await res.json();
        let apiCourses: any[] = [];
        if (json.success && Array.isArray(json.data)) {
          apiCourses = json.data;
        }

        const mockList = mockDb.getCourses().filter((m) => {
          if (m.isCatalog) return false;
          return (
            (facultyId && (m.createdBy === facultyId || m.facultyId === facultyId)) ||
            (facultyReg && (m.createdBy === facultyReg || m.facultyId === facultyReg))
          );
        });

        const codeSet = new Set(apiCourses.map((c) => c.code?.toUpperCase()));
        const combined = [
          ...apiCourses,
          ...mockList.filter((m) => !codeSet.has(m.code?.toUpperCase())),
        ];
        setFacultyCourses(combined);
      } catch (e) {
        console.error('Failed to load courses on enrollment requests page:', e);
        const fallback = mockDb.getCourses().filter(
          (c) =>
            !c.isCatalog &&
            ((facultyId && (c.facultyId === facultyId || c.createdBy === facultyId)) ||
              (facultyReg && (c.facultyId === facultyReg || c.createdBy === facultyReg)))
        );
        setFacultyCourses(fallback);
      }
    }
    loadCourses();

    async function loadRegistrations() {
      try {
        const res = await fetch('/api/course-registration', { cache: 'no-store' });
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.registrations)) {
          const apiIds = new Set(json.data.registrations.map((r: any) => String(r.id)));
          const mockRemaining = mockDb.getCourseRegistrations().filter((m) => !apiIds.has(String(m.id)));
          setRegistrations([...json.data.registrations, ...mockRemaining]);
        }
      } catch (_) {}
    }
    loadRegistrations();
  }, [user, facultyId, facultyReg]);

  const facultyCourseIds = new Set(facultyCourses.map((c) => c.id));
  const facultyCourseCodes = new Set(facultyCourses.map((c) => c.code?.toUpperCase()));

  // Get all registrations for courses owned by this faculty
  const allRegistrations = registrations.filter((r) =>
    facultyCourseIds.has(r.courseId) ||
    facultyCourseCodes.has(r.courseId?.toUpperCase()) ||
    facultyCourseCodes.has(r.courseCode?.toUpperCase())
  );

  const pendingRequests = allRegistrations.filter((r) => r.status === 'PENDING' || r.status === 'Submitted');
  const acceptedRequests = allRegistrations.filter((r) => r.status === 'ACCEPTED' || r.status === 'Approved');
  const rejectedRequests = allRegistrations.filter((r) => r.status === 'REJECTED');

  const displayedRequests = allRegistrations.filter((r) => {
    if (filterStatus === 'PENDING') return r.status === 'PENDING' || r.status === 'Submitted';
    if (filterStatus === 'ACCEPTED') return r.status === 'ACCEPTED' || r.status === 'Approved';
    if (filterStatus === 'REJECTED') return r.status === 'REJECTED';
    return true;
  });

  const handleAction = async (regId: string, action: 'ACCEPTED' | 'REJECTED') => {
    try {
      mockDb.reviewCourseEnrollment(
        regId,
        action,
        facultyId || 'usr-fac-1',
        user?.name || 'Course Instructor'
      );
      setRegistrations((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, status: action } : r))
      );

      try {
        await fetch('/api/course-registration', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            regId,
            action,
            reviewerId: facultyId,
            remarks: action === 'ACCEPTED' ? 'Approved by course instructor' : 'Declined by faculty',
          }),
        });
      } catch (_) {}

      success(
        `Enrollment request has been ${action === 'ACCEPTED' ? 'Accepted' : 'Rejected'}.`,
        action === 'ACCEPTED' ? 'Scholar Officially Enrolled' : 'Request Rejected'
      );
    } catch (err: any) {
      toastError(err.message || 'Failed to review request.');
    }
  };

  return (
    <PortalLayout role="FACULTY">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Course Enrollment Requests
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Review and approve student course enrollment applications for your authorized teaching modules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/faculty/courses">
              <Button size="sm" variant="outline" leftIcon={<BookOpen className="w-3.5 h-3.5" />}>
                Teaching Modules
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Filter Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              filterStatus === 'ALL'
                ? 'bg-slate-50 border-slate-900 ring-2 ring-slate-900/10 shadow-sm'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Total Requests</div>
            <div className="text-2xl font-extrabold mt-1 text-black">{allRegistrations.length}</div>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('PENDING')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              filterStatus === 'PENDING'
                ? 'bg-slate-50 border-slate-900 ring-2 ring-slate-900/10 shadow-sm'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Pending Review</div>
            <div className="text-2xl font-extrabold mt-1 text-black">
              {pendingRequests.length}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('ACCEPTED')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              filterStatus === 'ACCEPTED'
                ? 'bg-slate-50 border-slate-900 ring-2 ring-slate-900/10 shadow-sm'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Accepted Students</div>
            <div className="text-2xl font-extrabold mt-1 text-black">{acceptedRequests.length}</div>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('REJECTED')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              filterStatus === 'REJECTED'
                ? 'bg-slate-50 border-slate-900 ring-2 ring-slate-900/10 shadow-sm'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Rejected Requests</div>
            <div className="text-2xl font-extrabold mt-1 text-black">{rejectedRequests.length}</div>
          </button>
        </div>

        {/* Requests Table */}
        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Enrollment Applications Queue</CardTitle>
              <div className="text-xs text-slate-500">
                Only accepted students become officially enrolled and appear in academic lists.
              </div>
            </div>
            <Badge variant="purple">
              {displayedRequests.length} Application{displayedRequests.length !== 1 ? 's' : ''}
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            {displayedRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <div className="text-sm font-semibold text-slate-700">No enrollment requests found.</div>
                <div className="text-xs text-slate-400 mt-1">
                  When students apply to your teaching modules, their pending requests will appear here.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                    <tr>
                      <th className="p-4">Student Details</th>
                      <th className="p-4">Register Number</th>
                      <th className="p-4">Program & Dept</th>
                      <th className="p-4">Semester</th>
                      <th className="p-4">Target Course</th>
                      <th className="p-4">Request Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Faculty Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedRequests.map((reg) => {
                      const isPending = reg.status === 'PENDING' || reg.status === 'Submitted';
                      return (
                        <tr key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{reg.studentName}</div>
                            <div className="text-[11px] text-slate-400">Applicant Scholar</div>
                          </td>
                          <td className="p-4 font-mono font-bold text-brand-700">{reg.registerNumber}</td>
                          <td className="p-4">
                            <div className="font-medium text-slate-900">
                              {reg.studentProgram || 'B.Tech Computer Science'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {reg.studentDepartment || 'Computer Science'}
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-700">Sem {reg.studentSemester || reg.semester}</td>
                          <td className="p-4">
                            <div className="font-mono font-bold text-slate-900">{reg.courseCode}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">{reg.courseName}</div>
                          </td>
                          <td className="p-4 text-slate-500">{formatDate(reg.requestedAt)}</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                                reg.status === 'ACCEPTED' || reg.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : reg.status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {reg.status === 'Approved' ? 'ACCEPTED' : reg.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="success"
                                  className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => handleAction(reg.id, 'ACCEPTED')}
                                  leftIcon={<Check className="w-3.5 h-3.5" />}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 text-xs px-2.5"
                                  onClick={() => handleAction(reg.id, 'REJECTED')}
                                  leftIcon={<X className="w-3.5 h-3.5" />}
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 italic">
                                {reg.status === 'ACCEPTED' || reg.status === 'Approved' ? (
                                  <span className="text-emerald-600 font-semibold flex items-center justify-end gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                                  </span>
                                ) : (
                                  <span className="text-rose-500 font-semibold flex items-center justify-end gap-1">
                                    <XCircle className="w-3.5 h-3.5" /> Rejected
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
