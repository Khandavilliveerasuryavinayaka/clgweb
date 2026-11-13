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
import { Course, CourseRegistration } from '@/types';
import { formatDate } from '@/lib/utils';
import { 
  BookOpen, 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  AlertCircle,
  Sparkles,
  Award,
  XCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function StudentCourseRegistrationPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const studentId = user?.id || 'usr-stu-1';

  // Requirement 10: Clearly separate Available Courses, Pending Requests, Accepted Courses, Rejected Requests
  const [activeTab, setActiveTab] = useState<'available' | 'pending' | 'accepted' | 'rejected'>('available');
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const regPeriods = mockDb.getRegistrationPeriods();
  const activePeriod = regPeriods.find((p) => p.isActive);

  const [allCourses, setAllCourses] = useState<Course[]>(mockDb.getCourses());

  useEffect(() => {
    async function loadAllCourses() {
      try {
        const res = await fetch('/api/courses', { cache: 'no-store' });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const apiCourses = json.data;
          const mockList = mockDb.getCourses();
          const codeSet = new Set(apiCourses.map((c: any) => c.code?.toUpperCase()));
          const combined = [
            ...apiCourses,
            ...mockList.filter((m) => !codeSet.has(m.code?.toUpperCase())),
          ];
          setAllCourses(combined);
        }
      } catch (e) {
        console.error('Failed to load courses from API:', e);
      }
    }
    loadAllCourses();
  }, []);

  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);

  useEffect(() => {
    const list = mockDb.getCourseRegistrations().filter(
      (r) =>
        r.studentId === studentId ||
        (user && r.registerNumber?.toLowerCase() === user.registerNumber?.toLowerCase())
    );
    setRegistrations(list);
  }, [studentId, user]);

  const allRegistrations = registrations;

  const pendingRequests = allRegistrations.filter(
    (r) =>
      (r.status === 'PENDING' || r.status === 'Submitted') &&
      !mockDb.isCourseResultsPublished(r.courseId || r.courseCode)
  );
  const acceptedCourses = allRegistrations.filter(
    (r) =>
      (r.status === 'ACCEPTED' || r.status === 'Approved') &&
      !mockDb.isCourseResultsPublished(r.courseId || r.courseCode)
  );
  const rejectedRequests = allRegistrations.filter(
    (r) =>
      r.status === 'REJECTED' &&
      !mockDb.isCourseResultsPublished(r.courseId || r.courseCode)
  );

  // Available courses are those not enrolled, not pending, and not already concluded/published
  const availableCourses = allCourses.filter(
    (c) =>
      !mockDb.isCourseResultsPublished(c.id || c.code) &&
      !allRegistrations.some(
        (r) =>
          (r.courseId === c.id || r.courseCode?.toUpperCase() === c.code?.toUpperCase()) &&
          (r.status === 'ACCEPTED' ||
            r.status === 'Approved' ||
            r.status === 'PENDING' ||
            r.status === 'Submitted')
      )
  );

  const toggleSelectCourse = (course: Course) => {
    if (selectedCourses.some((c) => c.id === course.id)) {
      setSelectedCourses(selectedCourses.filter((c) => c.id !== course.id));
    } else {
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const totalSelectedCredits = selectedCourses.reduce((sum, c) => sum + c.credits, 0);

  const handleConfirmSubmit = () => {
    if (user?.accountStatus === 'BLOCKED') {
      toastError('Account is BLOCKED. Course enrollment is forbidden.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Requirement 3: Student clicks Enroll -> status = PENDING
      for (const course of selectedCourses) {
        mockDb.requestCourseEnrollment(studentId, course.id, user || undefined, course);
      }
      const updatedList = mockDb.getCourseRegistrations().filter(
        (r) =>
          r.studentId === studentId ||
          (user && r.registerNumber?.toLowerCase() === user.registerNumber?.toLowerCase())
      );
      setRegistrations(updatedList);
      success(
        `Successfully submitted enrollment request for ${selectedCourses.length} course(s). Status is PENDING faculty review.`,
        'Enrollment Requests Submitted'
      );
      setSelectedCourses([]);
      setConfirmModalOpen(false);
      setActiveTab('pending');
    } catch (err: any) {
      toastError(err.message || 'Failed to complete course enrollment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PortalLayout role="STUDENT">
      <div className="space-y-6">
        {/* Active Window Banner */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge status={activePeriod ? 'Active' : 'Closed'}>
                {activePeriod ? 'Registration Window Open' : 'Registration Closed'}
              </Badge>
              {activePeriod && (
                <span className="text-xs font-semibold text-slate-500">
                  Academic Term: {activePeriod.academicYear} (Semester {activePeriod.semester})
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-navy-900 tracking-tight">
              {activePeriod ? activePeriod.title : 'Course Registration Window Closed'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select eligible modules $\rightarrow$ Submit enrollment $\rightarrow$ Status becomes PENDING $\rightarrow$ Faculty accepts or rejects.
            </p>
          </div>

          {activePeriod && activeTab === 'available' && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">Selected Credits</div>
                <div className="text-lg font-extrabold text-brand-600">{totalSelectedCredits} Credits</div>
              </div>
              <Button
                variant="primary"
                size="md"
                disabled={selectedCourses.length === 0 || user?.accountStatus === 'BLOCKED'}
                onClick={() => setConfirmModalOpen(true)}
              >
                Submit Enrollment ({selectedCourses.length})
              </Button>
            </div>
          )}
        </div>

        {/* Requirement 10: 4 Clear Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('available')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activeTab === 'available'
                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-[11px] uppercase tracking-wider font-semibold opacity-75">1. Available Courses</div>
            <div className="text-2xl font-extrabold mt-1">{availableCourses.length}</div>
            <div className="text-[10px] mt-0.5 opacity-80">Ready for enrollment</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-[11px] uppercase tracking-wider font-semibold opacity-75">2. Pending Requests</div>
            <div className="text-2xl font-extrabold mt-1">{pendingRequests.length}</div>
            <div className="text-[10px] mt-0.5 opacity-80">Awaiting faculty approval</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('accepted')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activeTab === 'accepted'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-[11px] uppercase tracking-wider font-semibold opacity-75">3. Accepted Courses</div>
            <div className="text-2xl font-extrabold mt-1">{acceptedCourses.length}</div>
            <div className="text-[10px] mt-0.5 opacity-80">Officially enrolled</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activeTab === 'rejected'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-[11px] uppercase tracking-wider font-semibold opacity-75">4. Rejected Requests</div>
            <div className="text-2xl font-extrabold mt-1">{rejectedRequests.length}</div>
            <div className="text-[10px] mt-0.5 opacity-80">Clearance not granted</div>
          </button>
        </div>

        {/* SECTION 1: AVAILABLE COURSES */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                Eligible Teaching Modules for Registration ({availableCourses.length})
              </h3>
              <span className="text-xs text-slate-400">Select course cards to build enrollment basket</span>
            </div>

            {availableCourses.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-white border border-dashed border-slate-300">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800">All Offered Courses Registered</h4>
                <p className="text-xs text-slate-500 mt-1">
                  You have submitted applications for all currently open curriculum courses this semester.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableCourses.map((course) => {
                  const isSelected = selectedCourses.some((c) => c.id === course.id);
                  return (
                    <Card
                      key={course.id}
                      className={`border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/40 shadow-card ring-1 ring-brand-500'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => toggleSelectCourse(course)}
                    >
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-white text-slate-800 border border-slate-200">
                                {course.code}
                              </span>
                              <Badge variant={course.type === 'LAB' ? 'info' : 'purple'}>
                                {course.type}
                              </Badge>
                              <span className="text-xs text-slate-500 font-semibold">
                                Sem {course.semester} • {course.credits} Credits
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 leading-snug">{course.name}</h4>
                          </div>

                          <div className="shrink-0">
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center border text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-brand-600 text-white border-brand-600'
                                  : 'border-slate-300 bg-white text-transparent'
                              }`}
                            >
                              ✓
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2">{course.description}</p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span>Instructor: <strong>{course.facultyName || 'Department Faculty'}</strong></span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            Available
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: PENDING REQUESTS */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                Pending Faculty Acceptance ({pendingRequests.length})
              </h3>
              <span className="text-xs text-slate-400">Awaiting faculty acceptance to activate enrollment</span>
            </div>

            {pendingRequests.length === 0 ? (
              <Card className="border-slate-200 p-8 text-center text-slate-400">
                <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <div className="text-sm font-semibold text-slate-700">No pending enrollment requests.</div>
                <div className="text-xs text-slate-400 mt-1">
                  Courses you select and submit from the Available tab will appear here with PENDING status.
                </div>
              </Card>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th className="p-4">Course Code</th>
                        <th className="p-4">Course Name</th>
                        <th className="p-4">Credits</th>
                        <th className="p-4">Requested On</th>
                        <th className="p-4">Status Badge</th>
                        <th className="p-4">Reviewer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingRequests.map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-50/60">
                          <td className="p-4 font-mono font-bold text-slate-900">{reg.courseCode}</td>
                          <td className="p-4 font-medium text-slate-900">{reg.courseName}</td>
                          <td className="p-4 font-bold text-amber-700">{reg.credits} Credits</td>
                          <td className="p-4 text-slate-500">{formatDate(reg.requestedAt)}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                              PENDING
                            </span>
                          </td>
                          <td className="p-4 text-slate-400 italic">Course Instructor Reviewing</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: ACCEPTED COURSES */}
        {activeTab === 'accepted' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                Officially Accepted Courses ({acceptedCourses.length})
              </h3>
              <span className="text-xs text-slate-400">Eligible for attendance, marks, and assignments</span>
            </div>

            {acceptedCourses.length === 0 ? (
              <Card className="border-slate-200 p-8 text-center text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <div className="text-sm font-semibold text-slate-700">No accepted courses found.</div>
                <div className="text-xs text-slate-400 mt-1">
                  Once your enrollment request is approved by the course owner, it will appear here with ACCEPTED status.
                </div>
              </Card>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th className="p-4">Course Code</th>
                        <th className="p-4">Course Name</th>
                        <th className="p-4">Credits</th>
                        <th className="p-4">Semester</th>
                        <th className="p-4">Status Badge</th>
                        <th className="p-4">Accepted By</th>
                        <th className="p-4 text-right">Quick Links</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {acceptedCourses.map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-50/60">
                          <td className="p-4 font-mono font-bold text-slate-900">{reg.courseCode}</td>
                          <td className="p-4 font-medium text-slate-900">{reg.courseName}</td>
                          <td className="p-4 font-bold text-emerald-700">{reg.credits} Credits</td>
                          <td className="p-4 text-slate-600">Semester {reg.semester}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ACCEPTED
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 font-medium">
                            {reg.reviewedBy || 'Course Instructor'}
                          </td>
                          <td className="p-4 text-right">
                            <Link href="/student/courses" className="text-xs font-semibold text-brand-600 hover:underline">
                              View Course →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: REJECTED REQUESTS */}
        {activeTab === 'rejected' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                Rejected Enrollment Requests ({rejectedRequests.length})
              </h3>
              <span className="text-xs text-slate-400">Applications returned by faculty instructor</span>
            </div>

            {rejectedRequests.length === 0 ? (
              <Card className="border-slate-200 p-8 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                <div className="text-sm font-semibold text-slate-700">Zero rejected requests.</div>
              </Card>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th className="p-4">Course Code</th>
                        <th className="p-4">Course Name</th>
                        <th className="p-4">Credits</th>
                        <th className="p-4">Status Badge</th>
                        <th className="p-4">Reviewed By</th>
                        <th className="p-4">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rejectedRequests.map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-50/60">
                          <td className="p-4 font-mono font-bold text-slate-900">{reg.courseCode}</td>
                          <td className="p-4 font-medium text-slate-900">{reg.courseName}</td>
                          <td className="p-4 font-bold text-slate-500">{reg.credits} Credits</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                              REJECTED
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 font-medium">{reg.reviewedBy || 'Course Instructor'}</td>
                          <td className="p-4 text-slate-500 italic">{reg.remarks || 'Prerequisites or capacity restrictions'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={handleConfirmSubmit}
          title="Confirm Course Enrollment Request"
          message={`You are submitting enrollment requests for ${selectedCourses.length} course(s) totaling ${totalSelectedCredits} credits. Each request will be placed in PENDING status until accepted by the course instructor.`}
          confirmText="Submit Enrollment Requests"
          isLoading={isSubmitting}
        />
      </div>
    </PortalLayout>
  );
}
