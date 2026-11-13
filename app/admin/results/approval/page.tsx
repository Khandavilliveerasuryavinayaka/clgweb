'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { CourseResultSubmission } from '@/types';
import { formatDate } from '@/lib/utils';
import { 
  CheckSquare, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Users, 
  Calendar,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

export default function AdminResultsApprovalPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'Pending Approval' | 'Approved' | 'Rejected' | 'Published'>('Pending Approval');
  const [selectedSubmission, setSelectedSubmission] = useState<CourseResultSubmission | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    action: 'approve' | 'reject' | 'publish';
    submission: CourseResultSubmission | null;
  }>({
    isOpen: false,
    action: 'approve',
    submission: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [allSubmissions, setAllSubmissions] = useState<CourseResultSubmission[]>(() => mockDb.getCourseSubmissions());

  useEffect(() => {
    fetch('/api/results?type=submissions')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const courses = mockDb.getCourses();
          const mapped: CourseResultSubmission[] = json.data.map((sub: any) => {
            const matchedCourse = courses.find((c) => Number(c.id) === Number(sub.course_id) || c.code === String(sub.course_id));
            return {
              id: String(sub.id),
              courseId: String(sub.course_id),
              courseCode: matchedCourse?.code || `CRS-${sub.course_id}`,
              courseName: matchedCourse?.name || 'Department Course',
              facultyId: sub.faculty_id || 'usr-fac-1',
              facultyName: matchedCourse?.facultyName || 'Course Instructor',
              department: matchedCourse?.departmentName || 'Computer Science and Engineering',
              semester: sub.semester || 6,
              academicYear: sub.academic_year || '2024-2025',
              totalStudents: sub.total_students || 50,
              submittedStudentsCount: sub.submitted_students_count || 50,
              status: sub.status || 'Submitted',
              submittedAt: sub.submitted_at || new Date().toISOString(),
              reviewedBy: sub.reviewed_by,
              reviewedAt: sub.reviewed_at,
              publishedAt: sub.published_at,
              remarks: sub.remarks,
            };
          });

          const merged = [...mapped];
          mockDb.getCourseSubmissions().forEach((ms) => {
            if (!merged.some((m) => m.courseId === ms.courseId)) {
              merged.push(ms);
            }
          });
          setAllSubmissions(merged);
        }
      })
      .catch(() => {});
  }, []);

  const pendingSubmissions = allSubmissions.filter(
    (s) => s.status === 'Pending Approval' || s.status === 'Submitted'
  );
  const approvedSubmissions = allSubmissions.filter((s) => s.status === 'Approved');
  const rejectedSubmissions = allSubmissions.filter((s) => s.status === 'Rejected');
  const publishedSubmissions = allSubmissions.filter((s) => s.status === 'Published');

  const currentList =
    activeTab === 'Pending Approval'
      ? pendingSubmissions
      : activeTab === 'Approved'
      ? approvedSubmissions
      : activeTab === 'Rejected'
      ? rejectedSubmissions
      : publishedSubmissions;

  const handleOpenAction = (action: 'approve' | 'reject' | 'publish', submission: CourseResultSubmission) => {
    setActionDialog({
      isOpen: true,
      action,
      submission,
    });
  };

  const handleConfirmAction = async (remarks?: string) => {
    if (!actionDialog.submission) return;
    const sub = actionDialog.submission;
    setIsLoading(true);

    try {
      if (actionDialog.action === 'approve') {
        mockDb.approveCourseResult(sub.courseId, user?.name || 'Dr. K. S. Ramanathan');
        await fetch('/api/results', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: sub.courseId, action: 'approve', role: 'ADMIN' }),
        }).catch(() => {});

        success(
          `Approved class results for ${sub.courseCode} (${sub.courseName}). Marks and grades are now official and visible on enrolled students' dashboards.`,
          'Course Result Approved'
        );
      } else if (actionDialog.action === 'reject') {
        mockDb.rejectCourseResult(
          sub.courseId,
          user?.name || 'Dr. K. S. Ramanathan',
          remarks || 'Returned to faculty for grade rectification.'
        );
        await fetch('/api/results', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: sub.courseId, action: 'reject', role: 'ADMIN', remarks }),
        }).catch(() => {});

        success(
          `Class result for ${sub.courseCode} returned to faculty for correction.`,
          'Correction Requested'
        );
      } else if (actionDialog.action === 'publish') {
        mockDb.publishCourseResult(sub.courseId, user?.name || 'Dr. K. S. Ramanathan');
        await fetch('/api/results', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: sub.courseId, action: 'publish', role: 'ADMIN' }),
        }).catch(() => {});

        success(
          `Class result for ${sub.courseCode} officially published. Enrolled students can now view their individual grades.`,
          'Results Published'
        );
      }

      setAllSubmissions((prev) =>
        prev.map((s) =>
          s.courseId === sub.courseId
            ? {
                ...s,
                status:
                  actionDialog.action === 'approve'
                    ? 'Approved'
                    : actionDialog.action === 'reject'
                    ? 'Rejected'
                    : 'Published',
                reviewedAt: new Date().toISOString(),
                remarks: remarks || s.remarks,
              }
            : s
        )
      );

      setIsLoading(false);
      setActionDialog({ isOpen: false, action: 'approve', submission: null });
      if (viewModalOpen) setViewModalOpen(false);
    } catch (err: any) {
      setIsLoading(false);
      toastError(err.message || 'Failed to process course result action.');
    }
  };

  // Student results for viewed submission
  const classResults = selectedSubmission
    ? mockDb.getResults().filter(r => r.courseId === selectedSubmission.courseId)
    : [];

  return (
    <PortalLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge status="Active">Course/Class-Level Moderation</Badge>
              <span className="text-xs text-slate-400 font-mono">Academic Deanery & Controller</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Course Result Approval & Governance
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Review and approve complete course results submitted by faculty. One administrative approval applies to the entire class result.
            </p>
          </div>

          <Link href="/admin/results/publishing">
            <Button variant="primary" size="sm" leftIcon={<Send className="w-4 h-4" />}>
              Go to Results Publishing ({approvedSubmissions.length} Ready)
            </Button>
          </Link>
        </div>

        {/* 4 Tabs */}
        <Tabs
          tabs={[
            { id: 'Pending Approval', label: 'Pending Approval', count: pendingSubmissions.length },
            { id: 'Approved', label: 'Approved (Staged for Publishing)', count: approvedSubmissions.length },
            { id: 'Rejected', label: 'Requires Correction', count: rejectedSubmissions.length },
            { id: 'Published', label: 'Published & Visible', count: publishedSubmissions.length },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as any)}
        />

        {/* Course Results Table */}
        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">
                {activeTab} Course Submissions ({currentList.length})
              </CardTitle>
              <div className="text-xs text-slate-500">
                Course submissions compiled and submitted by instructors.
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4">Course & Code</th>
                    <th className="p-4">Department & Program</th>
                    <th className="p-4 text-center">Semester</th>
                    <th className="p-4">Faculty Instructor</th>
                    <th className="p-4 text-center">Enrolled Students</th>
                    <th className="p-4">Submitted Date</th>
                    <th className="p-4">Result Status</th>
                    <th className="p-4 text-right">Class Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400">
                        No course submissions found under <strong>{activeTab}</strong>.
                      </td>
                    </tr>
                  ) : (
                    currentList.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/60">
                        <td className="p-4">
                          <div className="font-mono font-bold text-brand-700">{sub.courseCode}</div>
                          <div className="font-semibold text-slate-900 mt-0.5">{sub.courseName}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-800">{sub.department}</div>
                          <div className="text-[11px] text-slate-400">{sub.program}</div>
                        </td>
                        <td className="p-4 text-center font-bold text-slate-800">Sem {sub.semester}</td>
                        <td className="p-4 font-semibold text-slate-900">{sub.facultyName}</td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                            {sub.submittedStudentsCount} Candidates
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 font-mono text-[11px]">
                          {sub.submittedAt ? formatDate(sub.submittedAt) : 'Pending'}
                        </td>
                        <td className="p-4">
                          <Badge status={sub.status}>{sub.status}</Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs px-2.5"
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setViewModalOpen(true);
                              }}
                              leftIcon={<Eye className="w-3.5 h-3.5 text-slate-500" />}
                            >
                              View Class
                            </Button>

                            {(sub.status === 'Pending Approval' || sub.status === 'Submitted') && (
                              <>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => handleOpenAction('approve', sub)}
                                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                >
                                  Approve Class
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                                  onClick={() => handleOpenAction('reject', sub)}
                                  leftIcon={<XCircle className="w-3.5 h-3.5" />}
                                >
                                  Reject
                                </Button>
                              </>
                            )}

                            {sub.status === 'Approved' && (
                              <Button
                                size="sm"
                                variant="primary"
                                className="h-8 text-xs"
                                onClick={() => handleOpenAction('publish', sub)}
                                leftIcon={<Send className="w-3.5 h-3.5" />}
                              >
                                Publish Course
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal: View Full Class Results */}
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title={`Class Results — ${selectedSubmission?.courseCode}: ${selectedSubmission?.courseName}`}
          maxWidth="2xl"
        >
          {selectedSubmission && (
            <div className="space-y-4">
              {/* Class Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <div className="text-slate-400 font-medium">Instructor</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedSubmission.facultyName}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Total Enrolled</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedSubmission.totalStudents} Students</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">With Marks</div>
                  <div className="font-bold text-emerald-600 mt-0.5">{classResults.length} / {selectedSubmission.totalStudents}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Approval Status</div>
                  <Badge status={selectedSubmission.status} className="mt-0.5">{selectedSubmission.status}</Badge>
                </div>
              </div>

              {/* Roster Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="p-3">Register No</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3 text-center">Internal (50)</th>
                      <th className="p-3 text-center">External (50)</th>
                      <th className="p-3 text-center">Total (100)</th>
                      <th className="p-3 text-center">Grade</th>
                      <th className="p-3 text-center">Grade Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classResults.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          No student grade records available for this course.
                        </td>
                      </tr>
                    ) : (
                      classResults.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-slate-900">{r.registerNumber}</td>
                          <td className="p-3 font-semibold text-slate-900">{r.studentName}</td>
                          <td className="p-3 text-center">{r.internalMarks}</td>
                          <td className="p-3 text-center">{r.externalMarks}</td>
                          <td className="p-3 text-center font-bold text-slate-900">{r.totalMarks}</td>
                          <td className="p-3 text-center font-extrabold text-brand-700">{r.grade}</td>
                          <td className="p-3 text-center font-bold">{r.gradePoints}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setViewModalOpen(false)}>
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  {(selectedSubmission.status === 'Pending Approval' || selectedSubmission.status === 'Submitted') && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                        onClick={() => handleOpenAction('reject', selectedSubmission)}
                      >
                        Reject Class Result
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleOpenAction('approve', selectedSubmission)}
                      >
                        Approve Entire Class Result
                      </Button>
                    </>
                  )}
                  {selectedSubmission.status === 'Approved' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenAction('publish', selectedSubmission)}
                    >
                      Publish Approved Result
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Confirm Action Dialog */}
        <ConfirmDialog
          isOpen={actionDialog.isOpen}
          onClose={() => setActionDialog({ isOpen: false, action: 'approve', submission: null })}
          onConfirm={(remarks) => handleConfirmAction(remarks)}
          title={
            actionDialog.action === 'approve'
              ? `Approve Complete Class Result — ${actionDialog.submission?.courseCode}`
              : actionDialog.action === 'reject'
              ? `Reject & Request Rectification — ${actionDialog.submission?.courseCode}`
              : `Publish Course Result — ${actionDialog.submission?.courseCode}`
          }
          message={
            actionDialog.action === 'approve'
              ? `You are approving the complete class results for ${actionDialog.submission?.courseCode} (${actionDialog.submission?.courseName}). This applies to all ${actionDialog.submission?.submittedStudentsCount} enrolled candidates in one action. Proceed to stage for publishing?`
              : actionDialog.action === 'reject'
              ? `You are returning the complete class results for ${actionDialog.submission?.courseCode} back to ${actionDialog.submission?.facultyName} for grading correction. Enter mandatory reason below.`
              : `Publishing will make grades for ${actionDialog.submission?.courseCode} instantly visible to all enrolled students in their portal grade cards. Proceed?`
          }
          confirmText={
            actionDialog.action === 'approve'
              ? 'Approve Entire Class Result'
              : actionDialog.action === 'reject'
              ? 'Return for Correction'
              : 'Publish Approved Result'
          }
          variant={actionDialog.action === 'reject' ? 'destructive' : 'primary'}
          requireReason={actionDialog.action === 'reject'}
          reasonPlaceholder="Specify reason for grade correction / rectification..."
          isLoading={isLoading}
        />
      </div>
    </PortalLayout>
  );
}
