'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { InternalMark, Course } from '@/types';
import { Award, Save, Send, ShieldAlert, CheckCircle2, Users, Lock } from 'lucide-react';

function FacultyInternalMarksContent() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const searchParams = useSearchParams();
  const queryCourseId = searchParams.get('courseId');

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  useEffect(() => {
    async function loadFacultyCourses() {
      try {
        const myFacultyId = user?.id;
        const myFacultyReg = user?.registerNumber;
        const facultyParam = myFacultyId || myFacultyReg || '';

        const res = await fetch(`/api/courses?facultyId=${encodeURIComponent(facultyParam)}&createdByOnly=true`, { cache: 'no-store' });
        const json = await res.json();

        let apiCourses: Course[] = [];
        if (json.success && Array.isArray(json.data)) {
          apiCourses = json.data;
        }

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
        ].filter((c) => !mockDb.isCourseResultsPublished(c.id || c.code));

        setCourses(combined);

        if (queryCourseId) {
          const match = combined.find(
            (c) => c.id === queryCourseId || c.code.toUpperCase() === queryCourseId.toUpperCase()
          );
          if (match) setSelectedCourseId(match.id);
          else if (combined.length > 0) setSelectedCourseId(combined[0].id);
        } else if (combined.length > 0) {
          setSelectedCourseId(combined[0].id);
        }
      } catch (e) {
        console.error('Failed to load courses on internal marks page:', e);
        const myFacultyId = user?.id;
        const myFacultyReg = user?.registerNumber;
        const fallback = mockDb.getCourses().filter(
          (c) =>
            !c.isCatalog &&
            ((myFacultyId && (c.createdBy === myFacultyId || c.facultyId === myFacultyId)) ||
              (myFacultyReg && (c.createdBy === myFacultyReg || c.facultyId === myFacultyReg))) &&
            !mockDb.isCourseResultsPublished(c.id || c.code)
        );
        setCourses(fallback);
        if (fallback.length > 0) setSelectedCourseId(fallback[0].id);
      }
    }
    loadFacultyCourses();
  }, [user, queryCourseId]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId || c.code === selectedCourseId);

  // Requirement 8: Faculty can enter internal marks ONLY for ACCEPTED students
  const acceptedRegistrations = selectedCourseId 
    ? mockDb.getCourseRegistrations().filter(
        (r) =>
          (r.courseId === selectedCourseId || (selectedCourse && (r.courseId === selectedCourse.code || r.courseCode === selectedCourse.code))) &&
          (r.status === 'ACCEPTED' || r.status === 'Approved')
      )
    : [];
  const enrolledStudentIds = new Set(acceptedRegistrations.map((r) => r.studentId));
  const students = mockDb.getUsers().filter((u) => u.role === 'STUDENT' && enrolledStudentIds.has(u.id));

  // Load existing marks and submission status
  const [existingMarks, setExistingMarks] = useState<InternalMark[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedCourseId) {
      setExistingMarks([]);
      setIsSubmitted(false);
      return;
    }
    const marks = mockDb.getInternalMarks(selectedCourseId);
    setExistingMarks(marks);
    const hasSubmitted = marks.length > 0 && marks.some((m) => m.status === 'Submitted');
    setIsSubmitted(hasSubmitted);
  }, [selectedCourseId]);

  // Local editable marks state
  const [marksState, setMarksState] = useState<Record<string, { cia1: number; cia2: number; assignment: number }>>({});

  useEffect(() => {
    const map: Record<string, { cia1: number; cia2: number; assignment: number }> = {};
    for (const s of students) {
      const match = existingMarks.find((m) => m.studentId === s.id);
      map[s.id] = {
        cia1: match?.cia1 ?? 0,
        cia2: match?.cia2 ?? 0,
        assignment: match?.assignment ?? 0,
      };
    }
    setMarksState(map);
  }, [selectedCourseId, students.length, existingMarks]);

  const [isSaving, setIsSaving] = useState(false);

  const handleScoreChange = (studentId: string, field: 'cia1' | 'cia2' | 'assignment', val: number) => {
    if (isSubmitted) {
      toastError('Internal marks have already been submitted to Administration and are locked against editing.');
      return;
    }

    const student = students.find((s) => s.id === studentId);
    if (student?.accountStatus === 'BLOCKED') {
      toastError(`Cannot enter marks for ${student.name}. Student account is BLOCKED.`);
      return;
    }

    const max = field === 'assignment' ? 10 : 20;
    const clamped = Math.max(0, Math.min(max, isNaN(val) ? 0 : val));

    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: clamped,
      },
    }));
  };

  const handleSaveMarks = async (submit = false) => {
    if (isSubmitted && submit) {
      toastError('Internal marks for this module are already submitted and locked.');
      return;
    }

    setIsSaving(true);
    try {
      const markObjects: InternalMark[] = students
        .filter((s) => s.accountStatus !== 'BLOCKED')
        .map((s) => {
          const entry = marksState[s.id] || { cia1: 0, cia2: 0, assignment: 0 };
          return {
            id: `im-${s.id}-${selectedCourseId}`,
            studentId: s.id,
            registerNumber: s.registerNumber,
            studentName: s.name,
            courseId: selectedCourseId,
            courseCode: selectedCourse?.code || 'CS601',
            courseName: selectedCourse?.name || 'Course',
            cia1: entry.cia1,
            cia2: entry.cia2,
            assignment: entry.assignment,
            total: entry.cia1 + entry.cia2 + entry.assignment,
            status: submit ? 'Submitted' : 'Draft',
            submittedBy: user?.name || 'Course Faculty',
          };
        });

      mockDb.saveInternalMarks(markObjects, submit);

      try {
        await fetch('/api/internal-marks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ marks: markObjects, submit }),
        });
      } catch (apiErr) {
        console.warn('API sync warning:', apiErr);
      }

      const refreshed = mockDb.getInternalMarks(selectedCourseId);
      setExistingMarks(refreshed);
      if (submit) {
        setIsSubmitted(true);
      }

      setIsSaving(false);
      success(
        submit
          ? `Marks for ${markObjects.length} student(s) finalized and submitted to Administration. Grade entries are now locked.`
          : `Marks draft saved locally.`,
        submit ? 'Marks Formally Submitted (Locked)' : 'Draft Saved'
      );
    } catch (err: any) {
      setIsSaving(false);
      toastError(err.message || 'Failed to save marks.');
    }
  };

  return (
    <PortalLayout role="FACULTY">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Continuous Internal Assessment (CIA) Grade Entry
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter CIA-1 (20M), CIA-2 (20M), and Continuous Assignment component (10M). Blocked students are locked.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <Select
              label="Select Teaching Module"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              options={courses.map((c) => ({
                label: `${c.code} - ${c.name}`,
                value: c.id,
              }))}
            />
          </div>
        </div>

        {courses.length === 0 ? (
          <Card className="border-slate-200 p-12 text-center shadow-card bg-white">
            <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">No Teaching Modules Created Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              You have not created any curriculum modules yet. Internal marks can only be recorded for courses published under your faculty profile.
            </p>
          </Card>
        ) : (
          <Card className="border-slate-200 shadow-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold">
                    Student Grading Sheet — {selectedCourse?.code}
                  </CardTitle>
                  {isSubmitted ? (
                    <Badge variant="success" className="px-2 py-0.5 text-[11px] font-bold flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>Submitted & Locked</span>
                    </Badge>
                  ) : (
                    <Badge variant="purple" className="px-2 py-0.5 text-[11px] font-medium">
                      Draft Mode (Editable)
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {isSubmitted
                    ? 'Internal marks have been finalized and submitted to Administration. Grade entries are locked.'
                    : 'Max Aggregate: 50 Marks (CIA-1: 20M, CIA-2: 20M, Assignment: 10M)'}
                </div>
              </div>
              {students.length > 0 && (
                <div className="flex items-center gap-2">
                  {isSubmitted ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3.5 py-1.5 rounded-lg shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Submitted to Administration</span>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveMarks(false)}
                        isLoading={isSaving}
                        leftIcon={<Save className="w-3.5 h-3.5" />}
                      >
                        Save Draft
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSaveMarks(true)}
                        isLoading={isSaving}
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                      >
                        Submit to Admin
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {/* Submission Locked Banner */}
              {isSubmitted && (
                <div className="mx-6 mt-4 p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Submitted to Administration:</strong> Continuous Internal Assessment (CIA) marks for <strong>{selectedCourse?.code} - {selectedCourse?.name}</strong> have been formally submitted and locked. Once submitted, marks cannot be edited by faculty.
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded border border-emerald-300 flex items-center gap-1 shrink-0">
                    <Lock className="w-3 h-3" /> Locked (Read-Only)
                  </span>
                </div>
              )}

              {students.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 text-sm">No Scholars Enrolled in This Course Yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    No scholars are currently enrolled in <strong>{selectedCourse?.code} - {selectedCourse?.name}</strong>. Once students enroll from the Student Portal and you accept their requests, they will appear here to enter CIA-1, CIA-2, and Assignment scores.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                      <tr>
                        <th className="p-4">Register Number</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4 text-center">CIA-1 (Max 20)</th>
                    <th className="p-4 text-center">CIA-2 (Max 20)</th>
                    <th className="p-4 text-center">Assignment (Max 10)</th>
                    <th className="p-4 text-center">Total (Max 50)</th>
                    <th className="p-4 text-right">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => {
                    const isBlocked = s.accountStatus === 'BLOCKED';
                    const scores = marksState[s.id] || { cia1: 0, cia2: 0, assignment: 0 };
                    const total = scores.cia1 + scores.cia2 + scores.assignment;

                    return (
                      <tr key={s.id} className={isBlocked ? 'bg-rose-50/40' : 'hover:bg-slate-50/60'}>
                        <td className="p-4 font-mono font-bold text-slate-900">{s.registerNumber}</td>
                        <td className="p-4 font-semibold text-slate-900">{s.name}</td>
                        <td className="p-4">
                          <Badge status={s.accountStatus}>{s.accountStatus}</Badge>
                        </td>

                        {/* CIA 1 */}
                        <td className="p-4 text-center">
                          {isBlocked ? (
                            <span className="text-slate-400 font-mono">—</span>
                          ) : isSubmitted ? (
                            <span className="font-mono font-bold text-sm text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg inline-block w-16 text-center select-all">
                              {scores.cia1}
                            </span>
                          ) : (
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={scores.cia1}
                              onChange={(e) =>
                                handleScoreChange(s.id, 'cia1', parseInt(e.target.value, 10))
                              }
                              className="w-16 text-center p-1.5 rounded border border-slate-300 font-bold text-slate-900 focus:border-brand-500 outline-none"
                            />
                          )}
                        </td>

                        {/* CIA 2 */}
                        <td className="p-4 text-center">
                          {isBlocked ? (
                            <span className="text-slate-400 font-mono">—</span>
                          ) : isSubmitted ? (
                            <span className="font-mono font-bold text-sm text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg inline-block w-16 text-center select-all">
                              {scores.cia2}
                            </span>
                          ) : (
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={scores.cia2}
                              onChange={(e) =>
                                handleScoreChange(s.id, 'cia2', parseInt(e.target.value, 10))
                              }
                              className="w-16 text-center p-1.5 rounded border border-slate-300 font-bold text-slate-900 focus:border-brand-500 outline-none"
                            />
                          )}
                        </td>

                        {/* Assignment */}
                        <td className="p-4 text-center">
                          {isBlocked ? (
                            <span className="text-slate-400 font-mono">—</span>
                          ) : isSubmitted ? (
                            <span className="font-mono font-bold text-sm text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg inline-block w-16 text-center select-all">
                              {scores.assignment}
                            </span>
                          ) : (
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={scores.assignment}
                              onChange={(e) =>
                                handleScoreChange(s.id, 'assignment', parseInt(e.target.value, 10))
                              }
                              className="w-16 text-center p-1.5 rounded border border-slate-300 font-bold text-slate-900 focus:border-brand-500 outline-none"
                            />
                          )}
                        </td>

                        {/* Total */}
                        <td className="p-4 text-center">
                          {isBlocked ? (
                            <span className="text-slate-400 font-mono">—</span>
                          ) : (
                            <span className={`font-extrabold text-sm px-2.5 py-1 rounded-md border ${
                              isSubmitted
                                ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                                : 'text-brand-700 bg-brand-50 border-brand-200'
                            }`}>
                              {total} / 50
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          {isBlocked ? (
                            <span className="text-xs text-rose-600 font-bold flex items-center justify-end gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>BLOCKED (Marks Disabled)</span>
                            </span>
                          ) : isSubmitted ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                              <Lock className="w-3 h-3 text-emerald-600" />
                              <span>Submitted (Locked)</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Draft / Editable</span>
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
      )}
    </div>
  </PortalLayout>
  );
}

export default function FacultyInternalMarksPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading internal marks...</div>}>
      <FacultyInternalMarksContent />
    </React.Suspense>
  );
}
