'use client';

import React, { useState } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  BookOpen, 
  User, 
  Award, 
  Calendar, 
  FileText, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  Layers
} from 'lucide-react';
import Link from 'next/link';

export default function MyCoursesPage() {
  const { user } = useAuth();
  const studentId = user?.id || 'usr-stu-1';
  const [activeTab, setActiveTab] = useState<'accepted' | 'pending' | 'rejected'>('accepted');

  const registrations = user ? mockDb.getCourseRegistrations(studentId) : [];
  const acceptedCourses = registrations.filter(
    (r) =>
      (r.status === 'ACCEPTED' || r.status === 'Approved') &&
      !mockDb.isCourseResultsPublished(r.courseId || r.courseCode)
  );
  const pendingCourses = registrations.filter(
    (r) =>
      (r.status === 'PENDING' || r.status === 'Submitted') &&
      !mockDb.isCourseResultsPublished(r.courseId || r.courseCode)
  );
  const rejectedCourses = registrations.filter(
    (r) =>
      r.status === 'REJECTED' &&
      !mockDb.isCourseResultsPublished(r.courseId || r.courseCode)
  );

  const allCourses = mockDb.getCourses();
  const totalCredits = acceptedCourses.reduce((sum, c) => sum + c.credits, 0);

  return (
    <PortalLayout role="STUDENT">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              My Academic Courses
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Curriculum enrollment dashboard with strict status tracking: Accepted, Pending, and Rejected.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-sm">
              Enrolled Credits: <strong className="text-emerald-600">{totalCredits}</strong>
            </span>
            <Link href="/student/course-registration">
              <Button size="sm" variant="primary" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                <span>Course Registration</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Categorized Tabs fulfilling Requirement 10 */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('accepted')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'accepted'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Accepted Courses ({acceptedCourses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Requests ({pendingCourses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'rejected'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>Rejected Requests ({rejectedCourses.length})</span>
          </button>

          <Link
            href="/student/course-registration"
            className="px-4 py-2 rounded-xl text-xs font-bold text-brand-600 hover:text-brand-800 hover:bg-brand-50 transition-all flex items-center gap-1.5 shrink-0 ml-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Register for Courses →</span>
          </Link>
        </div>

        {/* TAB 1: ACCEPTED COURSES */}
        {activeTab === 'accepted' && (
          <div>
            {acceptedCourses.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="p-12 text-center text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <h3 className="text-base font-bold text-slate-700">No accepted courses yet.</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Once the course instructor approves your pending enrollment request, the course will appear here with active academic privileges.
                  </p>
                  <div className="mt-4">
                    <Link href="/student/course-registration">
                      <Button size="sm" variant="primary">
                        Go to Course Registration
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {acceptedCourses.map((reg) => {
                  const courseDetails = allCourses.find((c) => c.id === reg.courseId);
                  return (
                    <Card
                      key={reg.id}
                      className="border-slate-200 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between"
                    >
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-brand-50 text-brand-700 border border-brand-200">
                                {reg.courseCode}
                              </span>
                              <Badge variant={courseDetails?.type === 'LAB' ? 'info' : 'purple'}>
                                {courseDetails?.type || 'CORE'}
                              </Badge>
                              <span className="text-xs text-slate-500 font-semibold">
                                Sem {reg.semester} • {reg.credits} Credits
                              </span>
                            </div>
                            <h3 className="font-bold text-base text-navy-900 leading-snug">
                              {reg.courseName}
                            </h3>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            ACCEPTED
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {courseDetails?.description || 'Curriculum focusing on practical and theoretical concepts.'}
                        </p>

                        <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>Course Instructor:</span>
                            </span>
                            <span className="font-semibold text-slate-800">
                              {courseDetails?.facultyName || reg.reviewedBy || 'Faculty Assigned'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-slate-400" />
                              <span>Credits:</span>
                            </span>
                            <span className="font-bold text-emerald-700">{reg.credits} Credits</span>
                          </div>
                        </div>
                      </CardContent>

                      <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-between text-xs">
                        <Link href="/student/attendance" className="text-brand-600 font-semibold hover:underline">
                          View Attendance →
                        </Link>
                        <Link href="/student/assignments" className="text-slate-600 font-medium hover:text-slate-900">
                          Assignments →
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PENDING REQUESTS */}
        {activeTab === 'pending' && (
          <div>
            {pendingCourses.length === 0 ? (
              <Card className="border-slate-200 p-8 text-center text-slate-400">
                <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <div className="text-sm font-semibold text-slate-700">No pending enrollment requests.</div>
                <div className="text-xs text-slate-400 mt-1">
                  When you submit an enrollment application for an available course, it will appear here while awaiting faculty review.
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingCourses.map((reg) => (
                  <Card key={reg.id} className="border-amber-200 bg-amber-50/20 shadow-sm">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-mono font-bold text-xs text-amber-800">{reg.courseCode}</div>
                          <h4 className="font-bold text-sm text-navy-900">{reg.courseName}</h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                          PENDING
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Requested on {new Date(reg.requestedAt).toLocaleDateString()} • {reg.credits} Credits
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-amber-200 text-[11px] text-amber-900">
                        Awaiting acceptance by course instructor. Attendance and marks access will become available once accepted.
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REJECTED REQUESTS */}
        {activeTab === 'rejected' && (
          <div>
            {rejectedCourses.length === 0 ? (
              <Card className="border-slate-200 p-8 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                <div className="text-sm font-semibold text-slate-700">No rejected enrollment requests.</div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rejectedCourses.map((reg) => (
                  <Card key={reg.id} className="border-rose-200 bg-rose-50/20 shadow-sm">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-mono font-bold text-xs text-rose-800">{reg.courseCode}</div>
                          <h4 className="font-bold text-sm text-navy-900">{reg.courseName}</h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                          REJECTED
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Reviewed by {reg.reviewedBy || 'Course Faculty'}
                      </div>
                      {reg.remarks && (
                        <div className="p-2.5 rounded-lg bg-white border border-rose-200 text-[11px] text-rose-900">
                          Remarks: {reg.remarks}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
