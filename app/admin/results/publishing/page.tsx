'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { Send, CheckCircle2, ShieldCheck, Sparkles, Award, Eye, BookOpen, UserCheck } from 'lucide-react';
import { CourseResultSubmission } from '@/types';
import Link from 'next/link';

export default function AdminResultsPublishingPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [viewingCourseId, setViewingCourseId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<CourseResultSubmission[]>(() => mockDb.getCourseSubmissions());

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
          setSubmissions(merged);
        }
      })
      .catch(() => {});
  }, []);

  const approvedSubmissions = submissions.filter((s) => s.status === 'Approved');
  const publishedSubmissions = submissions.filter((s) => s.status === 'Published');

  const selectedSubmission = approvedSubmissions.find((s) => s.courseId === selectedCourseId);
  const viewingSubmission = submissions.find((s) => s.courseId === viewingCourseId);
  const viewingResults = viewingCourseId ? mockDb.getResults().filter((r) => r.courseId === viewingCourseId) : [];

  const handleConfirmPublish = async () => {
    if (!selectedCourseId) return;

    setIsPublishing(true);
    try {
      mockDb.publishCourseResult(selectedCourseId, user?.name || 'Academic Administrator');
      await fetch('/api/results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourseId, action: 'publish', role: 'ADMIN' }),
      }).catch(() => {});

      setSubmissions((prev) =>
        prev.map((s) =>
          s.courseId === selectedCourseId
            ? { ...s, status: 'Published', publishedAt: new Date().toISOString() }
            : s
        )
      );

      setIsPublishing(false);
      setConfirmPublishOpen(false);
      setSelectedCourseId(null);
      success(
        `Results for ${selectedSubmission?.courseCode} successfully published! All enrolled students can now view their individual grade cards.`,
        'Course Results Published'
      );
    } catch (err: any) {
      setIsPublishing(false);
      toastError(err.message || 'Failed to publish course results.');
    }
  };

  const handlePublishAllApproved = async () => {
    try {
      for (const s of approvedSubmissions) {
        mockDb.publishCourseResult(s.courseId, user?.name || 'Academic Administrator');
        await fetch('/api/results', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: s.courseId, action: 'publish', role: 'ADMIN' }),
        }).catch(() => {});
      }

      setSubmissions((prev) =>
        prev.map((s) =>
          s.status === 'Approved'
            ? { ...s, status: 'Published', publishedAt: new Date().toISOString() }
            : s
        )
      );

      success(
        `All ${approvedSubmissions.length} approved course results gazetted and published successfully!`,
        'All Courses Published'
      );
    } catch (err: any) {
      toastError(err.message || 'Failed to publish all courses.');
    }
  };

  return (
    <PortalLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Course-Wise Results Publishing
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/results/approval">
              <Button size="sm" variant="outline">
                Review Moderation Queue
              </Button>
            </Link>
            {approvedSubmissions.length > 0 && (
              <Button
                size="sm"
                variant="primary"
                onClick={handlePublishAllApproved}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Publish All Approved ({approvedSubmissions.length})
              </Button>
            )}
          </div>
        </div>

        {/* Approved Course Batches Ready to Publish */}
        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Approved Course Batches Ready for Publication ({approvedSubmissions.length})
              </CardTitle>
              <div className="text-xs text-slate-500">
                These course results have passed Admin scrutiny and are ready for official student release.
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4">Course</th>
                    <th className="p-4">Department & Sem</th>
                    <th className="p-4">Faculty Instructor</th>
                    <th className="p-4 text-center">Enrolled Students</th>
                    <th className="p-4">Approved By</th>
                    <th className="p-4">Approval Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {approvedSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No approved course results awaiting publication. Approve course results in the Results Approval queue first.
                      </td>
                    </tr>
                  ) : (
                    approvedSubmissions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60">
                        <td className="p-4">
                          <div className="font-bold text-navy-900 font-mono text-sm">{s.courseCode}</div>
                          <div className="text-slate-600 font-medium">{s.courseName}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{s.department}</div>
                          <div className="text-slate-500">Sem {s.semester} • {s.program}</div>
                        </td>
                        <td className="p-4 font-semibold text-slate-900">{s.facultyName}</td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                            {s.totalStudents} Students
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-900">{s.reviewedBy || 'Academic Admin'}</div>
                          <div className="text-[11px] text-slate-400">{s.reviewedAt ? formatDate(s.reviewedAt) : 'Recent'}</div>
                        </td>
                        <td className="p-4">
                          <Badge status="Approved">{s.status}</Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingCourseId(s.courseId)}
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                            >
                              Inspect Class
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setSelectedCourseId(s.courseId);
                                setConfirmPublishOpen(true);
                              }}
                              leftIcon={<Send className="w-3.5 h-3.5" />}
                            >
                              Publish Course
                            </Button>
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

        {/* Live Published Courses */}
        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-600" />
              Officially Published Courses ({publishedSubmissions.length} Courses Live)
            </CardTitle>
            <div className="text-xs text-slate-500">
              Students enrolled in these courses can view their individual grades, GPA, and marks in the Student Portal.
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4">Course</th>
                    <th className="p-4">Department & Sem</th>
                    <th className="p-4">Faculty Instructor</th>
                    <th className="p-4 text-center">Class Size</th>
                    <th className="p-4">Published Date</th>
                    <th className="p-4">Published By</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {publishedSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No courses have been published yet.
                      </td>
                    </tr>
                  ) : (
                    publishedSubmissions.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="p-4">
                          <div className="font-mono font-bold text-slate-900 text-sm">{p.courseCode}</div>
                          <div className="text-slate-600">{p.courseName}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{p.department}</div>
                          <div className="text-slate-500">Sem {p.semester} • {p.program}</div>
                        </td>
                        <td className="p-4 font-semibold text-slate-900">{p.facultyName}</td>
                        <td className="p-4 text-center font-bold text-slate-800">{p.totalStudents} Students</td>
                        <td className="p-4 text-slate-600 font-medium">
                          {p.publishedAt ? formatDate(p.publishedAt) : 'Published'}
                        </td>
                        <td className="p-4 text-slate-600">{p.publishedBy || 'Admin'}</td>
                        <td className="p-4">
                          <Badge status="Published">Live for Students</Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingCourseId(p.courseId)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            View Records
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Modal */}
        <ConfirmDialog
          isOpen={confirmPublishOpen}
          onClose={() => setConfirmPublishOpen(false)}
          onConfirm={handleConfirmPublish}
          title={`Publish Results for ${selectedSubmission?.courseCode}`}
          message={`You are about to officially publish results for ${selectedSubmission?.courseName} (${selectedSubmission?.totalStudents} students). This applies to the entire class and enables students to immediately view their own individual grades on their portal. Proceed?`}
          confirmText="Confirm & Publish Class Result"
          variant="primary"
          isLoading={isPublishing}
        />

        {/* Inspect Class Result Modal */}
        <Modal
          isOpen={!!viewingCourseId}
          onClose={() => setViewingCourseId(null)}
          title={`Class Roster Results: ${viewingSubmission?.courseCode} - ${viewingSubmission?.courseName}`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap gap-4 text-xs">
              <div><span className="text-slate-500">Faculty:</span> <strong>{viewingSubmission?.facultyName}</strong></div>
              <div><span className="text-slate-500">Department:</span> <strong>{viewingSubmission?.department}</strong></div>
              <div><span className="text-slate-500">Semester:</span> <strong>Sem {viewingSubmission?.semester}</strong></div>
              <div><span className="text-slate-500">Status:</span> <strong>{viewingSubmission?.status}</strong></div>
              <div><span className="text-slate-500">Total Enrolled:</span> <strong>{viewingResults.length}</strong></div>
            </div>

            <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-600 uppercase font-semibold sticky top-0">
                  <tr>
                    <th className="p-3">Register Number</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3 text-center">Internal (40)</th>
                    <th className="p-3 text-center">End Sem (60)</th>
                    <th className="p-3 text-center">Total (100)</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingResults.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-navy-900">{r.registerNumber}</td>
                      <td className="p-3 font-semibold text-slate-900">{r.studentName}</td>
                      <td className="p-3 text-center font-mono">{r.internalMarks}</td>
                      <td className="p-3 text-center font-mono">{r.externalMarks}</td>
                      <td className="p-3 text-center font-bold font-mono">{r.totalMarks}</td>
                      <td className="p-3 text-center font-extrabold text-brand-700">{r.grade}</td>
                      <td className="p-3"><Badge status={r.status}>{r.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" onClick={() => setViewingCourseId(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PortalLayout>
  );
}
