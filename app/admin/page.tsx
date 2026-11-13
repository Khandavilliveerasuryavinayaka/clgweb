'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Users, 
  GraduationCap, 
  ShieldAlert, 
  BookOpen, 
  CheckSquare, 
  Clock, 
  CreditCard, 
  History, 
  Send, 
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const [students, setStudents] = useState<any[]>(() =>
    mockDb.getUsers().filter(u => u.role === 'STUDENT')
  );
  const [faculty, setFaculty] = useState<any[]>(() =>
    mockDb.getUsers().filter(u => u.role === 'FACULTY')
  );
  const [pendingCourseSubmissions, setPendingCourseSubmissions] = useState<any[]>(() =>
    mockDb.getCourseSubmissions().filter(s => s.status === 'Submitted' || s.status === 'Pending Approval')
  );

  useEffect(() => {
    async function loadLiveData() {
      try {
        const [stuRes, facRes, subRes] = await Promise.all([
          fetch('/api/students', { cache: 'no-store' }),
          fetch('/api/faculty', { cache: 'no-store' }),
          fetch('/api/results?type=submissions', { cache: 'no-store' }),
        ]);
        const stuJson = await stuRes.json();
        const facJson = await facRes.json();
        const subJson = await subRes.json();

        if (stuJson.success && Array.isArray(stuJson.data)) {
          setStudents(stuJson.data);
        }
        if (facJson.success && Array.isArray(facJson.data)) {
          setFaculty(facJson.data);
        }
        if (subJson.success && Array.isArray(subJson.data)) {
          const courses = mockDb.getCourses();
          const apiPending = subJson.data
            .filter((s: any) => s.status === 'Submitted' || s.status === 'Pending Approval' || s.status === 'SUBMITTED')
            .map((s: any) => {
              const matchedCourse = courses.find((c) => Number(c.id) === Number(s.course_id) || c.code === String(s.course_id));
              return {
                id: String(s.id),
                courseId: String(s.course_id),
                courseCode: matchedCourse?.code || `CRS-${s.course_id}`,
                courseName: matchedCourse?.name || 'Department Course',
                facultyName: 'Course Faculty',
                submittedStudentsCount: s.submitted_count || 0,
                status: 'Submitted',
              };
            });
          const mockPending = mockDb.getCourseSubmissions().filter(
            s => (s.status === 'Submitted' || s.status === 'Pending Approval') &&
                 !apiPending.some((ap: any) => ap.courseId === s.courseId || ap.courseCode === s.courseCode)
          );
          setPendingCourseSubmissions([...apiPending, ...mockPending]);
        }
      } catch (err) {
        console.warn('Admin dashboard live count fallback to mockDb', err);
      }
    }
    loadLiveData();
  }, []);

  const activeStudents = students.filter(s => s.accountStatus === 'ACTIVE');
  const blockedStudents = students.filter(s => s.accountStatus === 'BLOCKED');

  const courses = mockDb.getCourses();
  const regPeriods = mockDb.getRegistrationPeriods();
  const activeRegPeriod = regPeriods.find(p => p.isActive);

  const publishedResults = mockDb.getResults({ status: 'Published' });
  const pendingODs = mockDb.getODRequests().filter(o => o.status === 'Pending');

  const pendingEnrollments = mockDb.getCourseRegistrations().filter(r => r.status === 'PENDING' || r.status === 'Submitted');

  const auditLogs = mockDb.getAuditLogs().slice(0, 5);

  return (
    <PortalLayout role="ADMIN">
      <div className="space-y-6">
        {/* Executive Header */}
        <div className="rounded-2xl bg-gradient-to-r from-purple-950 via-navy-900 to-slate-900 text-white p-6 sm:p-8 shadow-card relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  Central Academic Governance Suite
                </span>
                <Badge status="Active">Institutional Audit Online</Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Executive Control Deck
              </h2>
              <div className="text-xs sm:text-sm text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                <span>Principal Officer: <strong>{user?.name || 'Dr. K. S. Ramanathan'}</strong></span>
                <span>•</span>
                <span>Institution: <strong>SV College of Engineering</strong></span>
                <span>•</span>
                <span>Status: <strong>Session 2024–25 Active</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Link href="/admin/results/approval">
                <Button size="sm" variant="primary" className="bg-purple-600 hover:bg-purple-700 text-white">
                  Approve Results ({pendingCourseSubmissions.length})
                </Button>
              </Link>
              <Link href="/admin/blocked-students">
                <Button size="sm" variant="outline" className="bg-transparent border-slate-500 text-slate-200 hover:bg-white/10 hover:text-white">
                  Blocked Registry ({blockedStudents.length})
                </Button>
              </Link>
              <Link href="/admin/course-registration">
                <Button size="sm" variant="outline" className="bg-transparent border-slate-500 text-slate-200 hover:bg-white/10 hover:text-white">
                  Registration Window
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Primary Metric KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
                <span>Total Scholars</span>
                <GraduationCap className="w-4 h-4 text-brand-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                {students.length}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                {activeStudents.length} Active / <span className="text-rose-600">{blockedStudents.length} Blocked</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
                <span>Teaching Faculty</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                {faculty.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Across Institutional Academic Departments</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
                <span>Result Approvals</span>
                <CheckSquare className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 mt-2">
                {pendingCourseSubmissions.length} Course{pendingCourseSubmissions.length === 1 ? '' : 's'} Pending
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{publishedResults.length} Marks Published across courses</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
                <span>Pending Enrollments</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">
                {pendingEnrollments.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-semibold">
                Course Registration Queue
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operational Queues: Results Workflow & Blocked Students */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Results Moderation Action Queue */}
          <div className="lg:col-span-7">
            <Card className="border-slate-200 h-full flex flex-col justify-between">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Results Moderation & Publishing Pipeline</CardTitle>
                  <div className="text-xs text-slate-500">
                    Student visibility is blocked until Admin approves and publishes
                  </div>
                </div>
                <Link href="/admin/results/approval" className="text-xs font-semibold text-brand-600 hover:underline">
                  Approval Deck →
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingCourseSubmissions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No results currently pending moderation.
                  </div>
                ) : (
                  pendingCourseSubmissions.slice(0, 4).map((sub) => (
                    <div key={sub.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-slate-900">
                          {sub.courseCode} — {sub.courseName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Instructor: {sub.facultyName || 'Faculty'} • Candidates: {sub.submittedStudentsCount ?? sub.totalStudents ?? 'All'}
                        </div>
                      </div>
                      <Badge status="Submitted">Awaiting Approval</Badge>
                    </div>
                  ))
                )}
                {pendingCourseSubmissions.length > 4 && (
                  <div className="text-center text-xs text-slate-400 pt-1">
                    +{pendingCourseSubmissions.length - 4} more course submission(s) in queue
                  </div>
                )}
              </CardContent>
              <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-between text-xs">
                <span className="text-slate-500">Step 2 of 3: Admin Review &rarr; Approve &rarr; Publish</span>
                <Link href="/admin/results/approval">
                  <Button size="sm" variant="primary" className="h-7 text-xs">Review & Approve</Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Blocked Students Watchlist */}
          <div className="lg:col-span-5">
            <Card className="border-slate-200 h-full flex flex-col justify-between">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Disciplinary Blocked Accounts</CardTitle>
                  <div className="text-xs text-slate-500">Only Admin can restore account access</div>
                </div>
                <Link href="/admin/blocked-students" className="text-xs font-semibold text-rose-600 hover:underline">
                  View Registry →
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {blockedStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">Zero blocked students.</div>
                ) : (
                  blockedStudents.map((s) => (
                    <div key={s.id} className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{s.name}</div>
                        <div className="font-mono text-[10px] text-rose-700">{s.registerNumber}</div>
                      </div>
                      <Link href="/admin/blocked-students">
                        <Button size="sm" variant="outline" className="h-7 text-xs border-rose-300 text-rose-700">
                          Inspect & Unblock
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </CardContent>
              <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-xl text-xs text-slate-500">
                Unblocking requires administrative justification and logs an immutable audit event.
              </div>
            </Card>
          </div>
        </div>

        {/* Live Immutable Audit Stream */}
        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <CardTitle className="text-base font-bold">Immutable System Audit Trail</CardTitle>
                <div className="text-xs text-slate-500">Real-time sensitive actions stream</div>
              </div>
            </div>
            <Link href="/admin/audit-logs" className="text-xs font-semibold text-brand-600 hover:underline">
              Full Audit Logs →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-3.5">Action Event</th>
                    <th className="p-3.5">User & Role</th>
                    <th className="p-3.5">Entity</th>
                    <th className="p-3.5">Details</th>
                    <th className="p-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{log.action}</td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-900">{log.userName}</span>
                        <span className="ml-1 text-[10px] text-slate-500 font-mono">({log.role})</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">{log.entity}</td>
                      <td className="p-3.5 text-slate-600 max-w-sm truncate">{log.details}</td>
                      <td className="p-3.5 text-slate-400">{formatDate(log.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
