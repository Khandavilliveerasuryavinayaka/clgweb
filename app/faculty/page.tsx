'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { 
  BookOpen, 
  CalendarCheck, 
  Clock, 
  Award, 
  Users, 
  FileEdit, 
  CheckSquare, 
  ArrowRight,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';

export default function FacultyDashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    async function loadCourses() {
      try {
        const myFacultyId = user?.id;
        const myFacultyReg = user?.registerNumber;
        const facultyParam = myFacultyId || myFacultyReg || '';

        const res = await fetch(`/api/courses?facultyId=${encodeURIComponent(facultyParam)}&createdByOnly=true`, { cache: 'no-store' });
        const json = await res.json();

        let apiCourses: any[] = [];
        if (json.success && Array.isArray(json.data)) {
          apiCourses = json.data;
        }

        // Check mockDb for any non-catalog courses created by this faculty
        const mockList = mockDb.getCourses().filter((m) => {
          if (m.isCatalog) return false;
          return (
            (myFacultyId && (m.createdBy === myFacultyId || m.facultyId === myFacultyId)) ||
            (myFacultyReg && (m.createdBy === myFacultyReg || m.facultyId === myFacultyReg))
          );
        });

        const codeSet = new Set(apiCourses.map((c) => c.code?.toUpperCase()));
        const combined = [
          ...apiCourses,
          ...mockList.filter((m) => !codeSet.has(m.code?.toUpperCase())),
        ];

        setCourses(combined);
      } catch (e) {
        console.error('Failed to load courses on faculty dashboard:', e);
        const myFacultyId = user?.id;
        const myFacultyReg = user?.registerNumber;
        setCourses(
          mockDb.getCourses().filter(
            (c) =>
              !c.isCatalog &&
              ((myFacultyId && (c.createdBy === myFacultyId || c.facultyId === myFacultyId)) ||
                (myFacultyReg && (c.createdBy === myFacultyReg || c.facultyId === myFacultyReg)))
          )
        );
      }
    }
    loadCourses();
  }, [user]);

  const assignedCourseKeys = new Set(
    courses.flatMap(c => [c.id, c.code, c.code?.toUpperCase()].filter(Boolean))
  );

  const allRegistrations = mockDb.getCourseRegistrations();
  const acceptedRegistrations = allRegistrations.filter(
    r => (assignedCourseKeys.has(r.courseId) || assignedCourseKeys.has(r.courseCode)) &&
      (r.status === 'ACCEPTED' || r.status === 'Approved')
  );
  const totalStudents = acceptedRegistrations.length > 0
    ? new Set(acceptedRegistrations.map(r => r.studentId || r.registerNumber)).size
    : courses.reduce((sum, c) => sum + (c.enrolledStudents || 0), 0);

  const odRequests = mockDb.getODRequests().filter(o => o.status === 'Pending');
  const internalMarks = mockDb.getInternalMarks().filter(
    m => (assignedCourseKeys.has(m.courseId) || assignedCourseKeys.has(m.courseCode)) && m.status === 'Draft'
  );
  const registrations = allRegistrations.filter(
    r => (assignedCourseKeys.has(r.courseId) || assignedCourseKeys.has(r.courseCode)) &&
      (r.status === 'PENDING' || r.status === 'Submitted')
  );
  const blockedCount = mockDb.getBlockRecords().filter(b => !b.unblockedAt).length;

  return (
    <PortalLayout role="FACULTY">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-brand-900 via-navy-900 to-slate-900 text-white p-6 sm:p-8 shadow-card relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-400/30">
                  Faculty Suite • {user?.department || 'Computer Science & Engg'}
                </span>
                <Badge status="Active">Academic Session Active</Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome, {user?.name || 'Faculty Member'}
              </h2>
              <div className="text-xs sm:text-sm text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                <span><strong>Faculty ID:</strong> {user?.registerNumber || 'FAC101'}</span>
                <span>•</span>
                <span><strong>Courses Instructing:</strong> {courses.length} Assigned Sections</span>
                <span>•</span>
                <span><strong>Enrolled Scholars:</strong> {totalStudents} Enrolled Students</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Link href="/faculty/attendance">
                <Button size="sm" variant="primary" className="bg-brand-500 hover:bg-brand-600 text-white">
                  Mark Today&apos;s Attendance
                </Button>
              </Link>
              <Link href="/faculty/courses">
                <Button size="sm" variant="outline" className="bg-transparent border-slate-500 text-slate-200 hover:bg-white/10 hover:text-white">
                  Teaching Modules
                </Button>
              </Link>
              <Link href="/faculty/student-360">
                <Button size="sm" variant="outline" className="bg-transparent border-slate-500 text-slate-200 hover:bg-white/10 hover:text-white">
                  Student 360 &amp; Discipline
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Assigned Courses</div>
                <div className="text-2xl font-extrabold text-slate-900">{courses.length}</div>
                <div className="text-[11px] text-slate-500">
                  {courses.length > 0 ? 'Active Teaching Modules' : 'No courses assigned'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pending OD Reviews</div>
                <div className="text-2xl font-extrabold text-amber-600">{odRequests.length}</div>
                <div className="text-[11px] text-slate-400">Action Required</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Marks Drafts</div>
                <div className="text-2xl font-extrabold text-slate-900">{internalMarks.length}</div>
                <div className="text-[11px] text-emerald-600">
                  {internalMarks.length > 0 ? 'Pending submission' : 'All clear'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Restricted Students</div>
                <div className="text-2xl font-extrabold text-rose-600">{blockedCount}</div>
                <div className="text-[11px] text-slate-400">Academic operations locked</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Courses Roster */}
        <Card className="border-slate-200 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">My Authorized Teaching Modules</CardTitle>
              <div className="text-xs text-slate-500">Curricular modules assigned to your faculty profile</div>
            </div>
            <Link href="/faculty/courses" className="text-xs font-semibold text-brand-600 hover:underline">
              Course Details &rarr;
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4">Course Code</th>
                    <th className="p-4">Course Title</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Credits</th>
                    <th className="p-4">Enrolled Students</th>
                    <th className="p-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No teaching modules currently assigned to your faculty profile.
                      </td>
                    </tr>
                  ) : (
                    courses.map((crs) => (
                      <tr key={crs.id} className="hover:bg-slate-50/60">
                        <td className="p-4 font-mono font-bold text-slate-900">{crs.code}</td>
                        <td className="p-4 font-semibold text-slate-900">{crs.name}</td>
                        <td className="p-4">
                          <Badge variant={crs.type === 'LAB' ? 'info' : 'purple'}>{crs.type}</Badge>
                        </td>
                        <td className="p-4 font-bold text-slate-800">{crs.credits} Credits</td>
                        <td className="p-4 font-semibold text-brand-700">{crs.enrolledStudents} Students</td>
                        <td className="p-4 text-right space-x-2">
                          <Link href={`/faculty/attendance?courseId=${crs.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                              Today&apos;s Attendance
                            </Button>
                          </Link>
                          <Link href={`/faculty/internal-marks?courseId=${crs.id}`}>
                            <Button size="sm" variant="secondary" className="h-7 text-xs px-2.5">
                              Marks
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Action Task Lists: Pending ODs & Registration Approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending OD Requests */}
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold">Pending On-Duty (OD) Approvals</CardTitle>
              <Link href="/faculty/od" className="text-xs font-semibold text-brand-600 hover:underline">
                Review All &rarr;
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {odRequests.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">All OD requests reviewed.</div>
              ) : (
                odRequests.map((od) => (
                  <div key={od.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{od.studentName} ({od.registerNumber})</span>
                      <Badge status="Pending">Pending</Badge>
                    </div>
                    <div className="text-xs text-slate-600">{od.eventName} ({od.totalDays} Days)</div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                      <span>Dates: {formatDate(od.startDate)} &rarr; {formatDate(od.endDate)}</span>
                      <Link href="/faculty/od" className="font-bold text-brand-600 hover:underline">
                        Take Action &rarr;
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Registration Tasks */}
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold">Course Registration Clearances</CardTitle>
              <Link href="/faculty/enrollment-requests" className="text-xs font-semibold text-brand-600 hover:underline">
                View Queue &rarr;
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {registrations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">All course registrations processed.</div>
              ) : (
                registrations.map((reg) => (
                  <div key={reg.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{reg.studentName} ({reg.registerNumber})</div>
                      <div className="text-[11px] text-slate-500">{reg.courseCode} - {reg.courseName}</div>
                    </div>
                    <Link href="/faculty/enrollment-requests">
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Review
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
