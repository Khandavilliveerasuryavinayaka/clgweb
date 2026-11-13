'use client';

import React from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/Alert';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  GraduationCap, 
  CalendarCheck, 
  BookOpen, 
  Clock, 
  CreditCard, 
  FileText, 
  Award, 
  Bell, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ClipboardList,
  Receipt,
  Pencil
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const studentId = user?.id || '';
  const registerNumber = user?.registerNumber || '';

  // Active courses enrolled in this ongoing term (excluding courses where results are already published)
  const allRegistrations = user
    ? mockDb.getCourseRegistrations().filter(
        (c) =>
          ((studentId && c.studentId === studentId) || (registerNumber && c.registerNumber === registerNumber)) &&
          (c.status === 'Approved' || c.status === 'ACCEPTED')
      )
    : [];
  const courses = allRegistrations.filter(
    (c) => !mockDb.isCourseResultsPublished(c.courseId || c.courseCode)
  );
  const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0);

  // Attendance lookup with dual ID resolution
  const allAttendance = user
    ? (mockDb.getAttendanceSummaries(studentId).length > 0
        ? mockDb.getAttendanceSummaries(studentId)
        : (registerNumber ? mockDb.getAttendanceSummaries(registerNumber) : []))
    : [];
  const attendanceSummaries = allAttendance.filter(
    (att) => !mockDb.isCourseResultsPublished(att.courseId || att.courseCode)
  );

  const odRequests = user
    ? mockDb.getODRequests().filter(
        (o) => (studentId && o.studentId === studentId) || (registerNumber && o.registerNumber === registerNumber)
      )
    : [];
  const pendingODs = odRequests.filter((o) => o.status === 'Pending');

  const studentFees = user
    ? mockDb.getStudentFees().filter(
        (f) => (studentId && f.studentId === studentId) || (registerNumber && f.registerNumber === registerNumber)
      )
    : [];
  const totalOutstanding = studentFees.reduce((acc, f) => acc + (f.outstandingAmount || 0), 0);

  // Match assignments by either courseId or courseCode
  const enrolledCourseKeys = new Set(
    courses.flatMap((c) => [c.courseId, c.courseCode, c.courseCode?.toUpperCase()].filter(Boolean))
  );
  const assignments = mockDb
    .getAssignments()
    .filter(
      (a) =>
        (enrolledCourseKeys.has(a.courseId) || enrolledCourseKeys.has(a.courseCode)) &&
        !mockDb.isCourseResultsPublished(a.courseId)
    );
  const notifications = user ? mockDb.getNotifications(studentId, 'STUDENT').slice(0, 3) : [];

  // CRITICAL: Fetch Admin-Approved / Published official results for student
  const approvedResults = user
    ? (mockDb.getStudentVisibleResults(studentId).length > 0
        ? mockDb.getStudentVisibleResults(studentId)
        : (registerNumber ? mockDb.getStudentVisibleResults(registerNumber) : []))
    : [];
  const totalEarnedCredits = approvedResults
    .filter(r => r.passStatus === 'PASS')
    .reduce((sum, r) => sum + (r.credits || 0), 0);

  const totalPoints = approvedResults.reduce(
    (sum, r) => sum + (r.credits || 0) * (r.gradePoints || 0),
    0
  );
  const totalGradedCredits = approvedResults.reduce((sum, r) => sum + (r.credits || 0), 0);
  const overallSgpa =
    totalGradedCredits > 0 ? (totalPoints / totalGradedCredits).toFixed(2) : null;

  // Check if any results for this student are still awaiting Admin approval
  const allStudentResults = user
    ? mockDb.getResults().filter(r => r.studentId === studentId || (user.registerNumber && r.registerNumber === user.registerNumber))
    : [];
  const pendingApprovalCount = allStudentResults.filter(
    r => (r.status === 'Submitted' || r.status === 'Draft') && !approvedResults.some(ar => ar.courseId === r.courseId)
  ).length;

  // Overall attendance calculation
  const totalClasses = attendanceSummaries.reduce((a, c) => a + c.totalClasses, 0);
  const totalPresent = attendanceSummaries.reduce((a, c) => a + c.present + c.od, 0);
  const hasAttendanceRecords = totalClasses > 0;
  const overallAttendancePct = hasAttendanceRecords
    ? Math.round((totalPresent / totalClasses) * 1000) / 10
    : null;

  return (
    <PortalLayout role="STUDENT">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-brand-900 via-navy-900 to-slate-900 text-white p-6 sm:p-8 shadow-card relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.18),transparent_60%)]" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-brand-500/10 blur-2xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar with pencil edit */}
              <Link href="/student/profile" className="relative shrink-0 hidden sm:block group">
                <Avatar
                  src={user?.avatarUrl}
                  name={user?.name}
                  registerNumber={user?.registerNumber}
                  size="xl"
                  className="border-2 border-white/20 shadow-lg bg-slate-800"
                />
                <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white/90 shadow-md flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                  <Pencil className="w-3 h-3 text-brand-700" />
                </span>
              </Link>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {user?.name || 'Student'}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-white/90">{user?.registerNumber || 'REG2024001'}</span>
                  <span className="text-white/30">|</span>
                  <span className="text-slate-300">{user?.program || 'B.Tech Computer Science'}</span>
                  <span className="text-white/30">|</span>
                  <span className="text-slate-400">{user?.department || 'Computer Science and Engineering'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-400/30">
                    Semester {user?.semester || 1} • Batch {user?.batch || '2024–2028'}
                  </span>
                  <Badge status="Active">Enrolled</Badge>
                  {approvedResults.length > 0 && (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Results Approved
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Link href="/student/results">
                <Button size="sm" variant="primary" className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  View Results
                </Button>
              </Link>
              <Link href="/student/course-registration">
                <Button size="sm" variant="outline" className="bg-transparent border-slate-500 text-slate-200 hover:bg-white/10 hover:text-white">
                  Course Registration
                </Button>
              </Link>
              <Link href="/student/od">
                <Button size="sm" variant="outline" className="bg-transparent border-slate-500 text-slate-200 hover:bg-white/10 hover:text-white">
                  Apply OD
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 5 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Overall Attendance</div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {overallAttendancePct !== null ? `${overallAttendancePct}%` : 'N/A'}
                </div>
                <div className="text-[11px] font-medium">
                  {overallAttendancePct !== null ? (
                    overallAttendancePct >= 75 ? (
                      <span className="text-emerald-600">Above mandatory 75% threshold</span>
                    ) : (
                      <span className="text-rose-600">Below mandatory 75% threshold</span>
                    )
                  ) : (
                    <span className="text-slate-400">No records available yet</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Academic Results</div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {overallSgpa !== null ? `${overallSgpa} SGPA` : approvedResults.length > 0 ? 'Approved' : pendingApprovalCount > 0 ? 'In Review' : 'Active Term'}
                </div>
                <div className="text-[11px] font-medium">
                  {approvedResults.length > 0 ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 inline" /> Admin Approved ({approvedResults.length} crs)
                    </span>
                  ) : pendingApprovalCount > 0 ? (
                    <span className="text-amber-600">Pending Admin Approval</span>
                  ) : (
                    <span className="text-slate-400">Continuous Assessment</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Enrolled Courses</div>
                <div className="text-2xl font-extrabold text-slate-900">{courses.length}</div>
                <div className="text-[11px] text-slate-500">
                  {totalCredits > 0 ? `${totalCredits} Total Credits` : 'No courses registered'}
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
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pending OD Requests</div>
                <div className="text-2xl font-extrabold text-slate-900">{pendingODs.length}</div>
                <div className="text-[11px] text-amber-600 font-medium">{pendingODs.length > 0 ? 'Under Faculty Review' : 'All Clear'}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Fee Outstanding</div>
                <div className="text-xl font-extrabold text-slate-900">
                  {studentFees.length > 0 ? formatCurrency(totalOutstanding) : 'None'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {studentFees.length > 0 ? 'Current Academic Term' : 'No fee info available'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Official Semester Examination Results (Admin Approved) Section */}
        {approvedResults.length > 0 ? (
          <Card className="border-emerald-200 bg-white shadow-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
              <div>
                <CardTitle className="text-base font-extrabold text-navy-900">
                  Approved Examination Results & Grades
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official semester examination results reviewed, approved, and gazetted by the institutional administration.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Earned Credits / SGPA</div>
                  <div className="text-lg font-extrabold text-emerald-700">
                    {totalEarnedCredits} Credits • {overallSgpa !== null ? `${overallSgpa} SGPA` : 'PASS'}
                  </div>
                </div>
                <Link href="/student/results">
                  <Button size="sm" variant="primary" className="bg-brand-600 hover:bg-brand-700 text-white text-xs h-8">
                    View Grade Transcript &rarr;
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                    <tr>
                      <th className="p-3.5 pl-5">Course Code</th>
                      <th className="p-3.5">Course Name</th>
                      <th className="p-3.5 text-center">Semester</th>
                      <th className="p-3.5 text-center">Credits</th>
                      <th className="p-3.5 text-center">Internal (50)</th>
                      <th className="p-3.5 text-center">External (50)</th>
                      <th className="p-3.5 text-center">Total (100)</th>
                      <th className="p-3.5 text-center">Letter Grade</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 pr-5 text-right">Approval Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {approvedResults.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 pl-5 font-mono font-bold text-slate-900">{r.courseCode}</td>
                        <td className="p-3.5 font-medium text-slate-900">{r.courseName}</td>
                        <td className="p-3.5 text-center text-slate-600 font-medium">Sem {r.semester}</td>
                        <td className="p-3.5 text-center font-bold text-slate-700">{r.credits}</td>
                        <td className="p-3.5 text-center font-semibold text-slate-800">{r.internalMarks}</td>
                        <td className="p-3.5 text-center font-semibold text-slate-800">{r.externalMarks}</td>
                        <td className="p-3.5 text-center font-extrabold text-slate-900">{r.totalMarks}</td>
                        <td className="p-3.5 text-center">
                          <span className="font-extrabold text-sm text-brand-600 px-2 py-0.5 rounded bg-brand-50 border border-brand-200">
                            {r.grade}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                              r.passStatus === 'PASS'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {r.passStatus}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Admin Approved
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Middle Section: Subject Attendance & Upcoming Assignments */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Subject Attendance Breakdown */}
          <div className="lg:col-span-7">
            <Card className="border-slate-200 h-full flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold">Subject-Wise Attendance</CardTitle>
                  <div className="text-xs text-slate-500">Minimum 75% required for exam qualification</div>
                </div>
                <Link href="/student/attendance" className="text-xs font-semibold text-brand-600 hover:text-brand-800">
                  Full Details &rarr;
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {attendanceSummaries.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-medium text-slate-600">No attendance records available.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Faculty has not marked attendance for your profile yet.</p>
                  </div>
                ) : (
                  attendanceSummaries.map((att) => (
                    <div key={att.courseId} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{att.courseCode}</span>
                          <span className="text-slate-500 ml-1.5">• {att.courseName}</span>
                        </div>
                        <span className="font-bold text-slate-800">{att.percentage}%</span>
                      </div>
                      <ProgressBar
                        value={att.percentage}
                        color={att.percentage >= 85 ? 'success' : att.percentage >= 75 ? 'warning' : 'danger'}
                        showPercent={false}
                        size="sm"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Faculty: {att.facultyName}</span>
                        <span>{att.present} Present / {att.totalClasses} Classes ({att.od} OD)</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Assignments & Tasks */}
          <div className="lg:col-span-5">
            <Card className="border-slate-200 h-full flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold">Upcoming Assignments</CardTitle>
                  <div className="text-xs text-slate-500">Continuous Assessment Tasks</div>
                </div>
                <Link href="/student/assignments" className="text-xs font-semibold text-brand-600 hover:text-brand-800">
                  View All &rarr;
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignments.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-medium text-slate-600">No assignments pending.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">You have completed all posted course tasks or none are registered.</p>
                  </div>
                ) : (
                  assignments.map((asg) => (
                    <div key={asg.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-brand-700">{asg.courseCode}</span>
                        <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Due: {formatDate(asg.dueDate)}
                        </span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-900 leading-snug">{asg.title}</h5>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                        <span>Max: {asg.maxMarks} Marks</span>
                        <Link href="/student/assignments" className="font-semibold text-brand-600 hover:underline">
                          Submit File &rarr;
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section: Recent Notifications & Fee Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications */}
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold">Recent Academic Circulars</CardTitle>
              <Link href="/student/notifications" className="text-xs font-semibold text-brand-600 hover:text-brand-800">
                View Feed &rarr;
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-500">No new notifications.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900">{n.title}</span>
                      <Badge variant="neutral" className="text-[10px]">{n.category}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                    <div className="text-[10px] text-slate-400 mt-1">{formatDate(n.createdAt)}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Fee Overview */}
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold">Fee Breakdown & Dues</CardTitle>
              <Link href="/student/fees" className="text-xs font-semibold text-brand-600 hover:text-brand-800">
                Fee Details &rarr;
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {studentFees.length === 0 ? (
                <div className="py-6 text-center text-slate-400">
                  <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-500">No fee information available.</p>
                </div>
              ) : (
                studentFees.map((fee) => (
                  <div key={fee.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-slate-900">{fee.title}</div>
                      <div className="text-[11px] text-slate-500">
                        Paid: {formatCurrency(fee.paidAmount)} / Total: {formatCurrency(fee.totalAmount)}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge status={fee.status}>{fee.status}</Badge>
                      {fee.outstandingAmount > 0 && (
                        <div className="text-xs font-bold text-rose-600 mt-1">
                          {formatCurrency(fee.outstandingAmount)} due
                        </div>
                      )}
                    </div>
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
