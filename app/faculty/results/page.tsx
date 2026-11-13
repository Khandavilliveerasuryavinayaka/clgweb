'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { calculateResult, validateExternalMarks } from '@/lib/grading';
import { Course } from '@/types';
import { 
  Award, 
  Save, 
  Send, 
  CheckCircle2, 
  BookOpen, 
  AlertCircle, 
  AlertTriangle,
  XCircle,
  HelpCircle,
  Calculator,
  Users,
  Lock
} from 'lucide-react';

interface StudentRosterRow {
  studentId: string;
  registerNumber: string;
  studentName: string;
  courseId: string;
  internalMarks: number | null; // out of 50
  hasInternalRecord: boolean;
  externalInput: string;
  externalMarks: number | null; // out of 50
  totalMarks: number | null; // out of 100
  grade: string;
  gradePoints: number;
  passStatus: 'PASS' | 'FAIL' | 'PENDING';
  isInternalPass: boolean;
  isExternalPass: boolean;
  isTotalPass: boolean;
  validationError?: string;
  status: string;
}

export default function FacultyResultsPage() {
  const { user } = useAuth();
  const { success, error: toastError, warning } = useToast();
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
        console.error('Failed to load courses on results page:', e);
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
  const [roster, setRoster] = useState<StudentRosterRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    missingExternal: string[];
    missingInternal: string[];
    invalidMarks: string[];
  } | null>(null);

  const [submittedOverride, setSubmittedOverride] = useState(false);
  const selectedCourse = courses.find((c) => c.id === selectedCourseId || c.code === selectedCourseId);
  const submission = selectedCourseId
    ? mockDb.getCourseSubmissionById(selectedCourseId) ||
      (selectedCourse ? mockDb.getCourseSubmissionById(selectedCourse.id) || mockDb.getCourseSubmissionById(selectedCourse.code) : undefined)
    : undefined;

  const isLocked = useMemo(() => {
    if (submittedOverride) return true;
    if (submission) {
      return (
        submission.status === 'Pending Approval' ||
        submission.status === 'Submitted' ||
        submission.status === 'Approved'
      );
    }
    return (
      roster.length > 0 &&
      roster.every((r) => r.status === 'Submitted' || r.status === 'Pending Approval' || r.status === 'Approved')
    );
  }, [submission, roster, submittedOverride]);

  // Load roster whenever selectedCourseId changes
  useEffect(() => {
    setSubmittedOverride(false);
    if (!selectedCourseId) {
      setRoster([]);
      return;
    }

    const entryData = mockDb.getCourseResultsForEntry(selectedCourseId);
    const initialRows: StudentRosterRow[] = entryData.map((item) => {
      const externalInput =
        item.externalMarks !== null && item.externalMarks !== undefined
          ? String(item.externalMarks)
          : '';

      const val = validateExternalMarks(externalInput);
      const calc = calculateResult(item.internalMarks, val.value);

      return {
        studentId: item.studentId,
        registerNumber: item.registerNumber,
        studentName: item.studentName,
        courseId: item.courseId,
        internalMarks: item.internalMarks,
        hasInternalRecord: item.hasInternalRecord,
        externalInput,
        externalMarks: val.value,
        totalMarks: calc.total,
        grade: calc.grade,
        gradePoints: calc.gradePoints,
        passStatus: calc.passStatus,
        isInternalPass: calc.isInternalPass,
        isExternalPass: calc.isExternalPass,
        isTotalPass: calc.isTotalPass,
        validationError: val.error,
        status: item.status,
      };
    });

    setRoster(initialRows);
    setSubmissionFeedback(null);
  }, [selectedCourseId]);

  // Handle external marks entry with instant recalculation
  const handleExternalMarksChange = (studentId: string, rawValue: string) => {
    if (isLocked) {
      toastError('Class results have already been submitted to Administration and are locked against editing.');
      return;
    }
    setRoster((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row;

        const val = validateExternalMarks(rawValue);
        const calc = calculateResult(row.internalMarks, val.value);

        return {
          ...row,
          externalInput: rawValue,
          externalMarks: val.value,
          totalMarks: calc.total,
          grade: calc.grade,
          gradePoints: calc.gradePoints,
          passStatus: calc.passStatus,
          isInternalPass: calc.isInternalPass,
          isExternalPass: calc.isExternalPass,
          isTotalPass: calc.isTotalPass,
          validationError: val.error,
        };
      })
    );
  };

  // Live Summary Statistics (Section 10)
  const summary = useMemo(() => {
    const totalStudents = roster.length;
    let studentsPassed = 0;
    let studentsFailed = 0;
    let studentsMissingExternal = 0;
    let studentsMissingInternal = 0;
    let invalidCount = 0;

    for (const r of roster) {
      if (r.validationError) invalidCount++;
      if (r.internalMarks === null) studentsMissingInternal++;
      if (r.externalMarks === null) {
        studentsMissingExternal++;
      } else {
        if (r.passStatus === 'PASS') studentsPassed++;
        if (r.passStatus === 'FAIL') studentsFailed++;
      }
    }

    return {
      totalStudents,
      studentsPassed,
      studentsFailed,
      studentsMissingExternal,
      studentsMissingInternal,
      invalidCount,
    };
  }, [roster]);

  // Save Draft Handler
  const handleSaveDraft = () => {
    if (isLocked) {
      toastError('Class results have already been submitted to Administration and cannot be edited.');
      return;
    }
    if (!selectedCourseId) return;

    // Check for validation errors like > 50
    const invalidRows = roster.filter((r) => r.validationError);
    if (invalidRows.length > 0) {
      toastError(`Please fix invalid marks before saving: ${invalidRows[0].validationError}`);
      return;
    }

    setIsSavingDraft(true);
    try {
      const payload = roster.map((r) => ({
        studentId: r.studentId,
        externalMarks: r.externalMarks,
      }));

      mockDb.saveCourseExternalMarks(
        selectedCourseId,
        user?.id || 'usr-fac-1',
        user?.name || 'Faculty Member',
        payload,
        false
      );

      setIsSavingDraft(false);
      success('Class results draft saved successfully.', 'Draft Saved');
    } catch (err: any) {
      setIsSavingDraft(false);
      toastError(err.message || 'Failed to save draft.');
    }
  };

  // Submit Complete Class Result Handler
  const handleSubmitResultsForApproval = async () => {
    if (isLocked && !submittedOverride) {
      toastError('Complete class result has already been submitted to Administration.');
      return;
    }
    if (!selectedCourseId) return;

    // Check for any validation errors
    const invalidRows = roster.filter((r) => r.validationError);
    const missingExternal = roster
      .filter((r) => r.externalMarks === null)
      .map((r) => `${r.studentName} (${r.registerNumber})`);
    const missingInternal = roster
      .filter((r) => r.internalMarks === null)
      .map((r) => `${r.studentName} (${r.registerNumber})`);

    if (invalidRows.length > 0 || missingExternal.length > 0 || missingInternal.length > 0) {
      setSubmissionFeedback({
        missingExternal,
        missingInternal,
        invalidMarks: invalidRows.map((r) => `${r.studentName}: ${r.validationError}`),
      });

      if (invalidRows.length > 0) {
        toastError(invalidRows[0].validationError || 'External marks cannot exceed 50.');
      } else if (missingInternal.length > 0) {
        toastError('Internal marks not available for all students. Cannot submit class result.');
      } else if (missingExternal.length > 0) {
        warning(`External marks missing for ${missingExternal.length} candidate(s). All students require marks before submission.`);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = roster.map((r) => ({
        studentId: r.studentId,
        externalMarks: r.externalMarks,
      }));

      mockDb.saveCourseExternalMarks(
        selectedCourseId,
        user?.id || 'usr-fac-1',
        user?.name || 'Faculty Member',
        payload,
        true
      );

      try {
        await fetch('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: selectedCourseId,
            facultyId: user?.id || 'f0000000-0000-0000-0000-000000000001',
            studentResults: payload,
          }),
        });
      } catch (apiErr) {
        console.warn('Backend API results submission sync error:', apiErr);
      }

      setSubmittedOverride(true);
      setIsSubmitting(false);
      setSubmissionFeedback(null);
      success(
        `Complete class result for ${selectedCourse?.code} (${roster.length} students) submitted to Admin. Result Status: Pending Approval. Grade editing is now locked.`,
        'Submitted for Admin Approval (Locked)'
      );
    } catch (err: any) {
      setIsSubmitting(false);
      toastError(err.message || 'Failed to submit results.');
    }
  };

  return (
    <PortalLayout role="FACULTY">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="warning">Course-Based Governance</Badge>
              <span className="text-xs text-slate-400 font-mono">Stage 1: Faculty Class Submission</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Course Results Entry & Class Submission
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter external exam marks (Max 50). Internal marks (Max 50) are auto-fetched from approved records. Total, letter grade, grade points, and pass/fail status are calculated automatically.
            </p>
          </div>

          {courses.length > 0 && (
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
          )}
        </div>

        {courses.length === 0 ? (
          <Card className="border-slate-200 p-12 text-center shadow-card bg-white">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">No Teaching Modules Assigned</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              You do not have any teaching modules assigned. Results can only be entered and submitted for courses allocated to your faculty profile.
            </p>
          </Card>
        ) : (
          <>
            {/* Status & Summary Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-pulse" />
                <div>
                  <span className="text-slate-500">Module: </span>
                  <strong className="text-slate-900 font-bold">
                    {selectedCourse?.code} - {selectedCourse?.name}
                  </strong>
                  <span className="text-slate-400 ml-2">({roster.length} Enrolled Candidates)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Course Submission Status:</span>
                <Badge status={submission?.status || 'Draft'}>
                  {submission?.status || 'Draft'}
                </Badge>
              </div>
            </div>

            {/* Class Summary Statistics Cards (Section 10) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Students</div>
                <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">{summary.totalStudents}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Enrolled candidates</div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 shadow-sm">
                <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Students Passed
                </div>
                <div className="text-xl font-extrabold text-emerald-700 mt-1 font-mono">{summary.studentsPassed}</div>
                <div className="text-[11px] text-emerald-600/80 mt-0.5">Met all 3 pass conditions</div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 shadow-sm">
                <div className="text-[11px] font-medium text-rose-700 uppercase tracking-wider flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-rose-600" />
                  Students Failed
                </div>
                <div className="text-xl font-extrabold text-rose-700 mt-1 font-mono">{summary.studentsFailed}</div>
                <div className="text-[11px] text-rose-600/80 mt-0.5">Section or total &lt; 50%</div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 shadow-sm">
                <div className="text-[11px] font-medium text-amber-700 uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Missing External Marks
                </div>
                <div className="text-xl font-extrabold text-amber-700 mt-1 font-mono">{summary.studentsMissingExternal}</div>
                <div className="text-[11px] text-amber-600/80 mt-0.5">Awaiting exam entry</div>
              </div>
            </div>

            {/* Validation / Missing Marks Alert Box */}
            {submissionFeedback && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  Cannot Submit Complete Class Result — Action Required
                </div>
                {submissionFeedback.invalidMarks.length > 0 && (
                  <p className="text-rose-700">
                    <strong>Invalid Marks: </strong> {submissionFeedback.invalidMarks.join('; ')}
                  </p>
                )}
                {submissionFeedback.missingInternal.length > 0 && (
                  <p className="text-rose-700">
                    <strong>Internal Marks Not Available: </strong> {submissionFeedback.missingInternal.join(', ')}
                  </p>
                )}
                {submissionFeedback.missingExternal.length > 0 && (
                  <p className="text-rose-700">
                    <strong>Missing External Marks: </strong> {submissionFeedback.missingExternal.join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Academic Pass Rule Reminder Helper */}
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Pass Mark Rule:</strong> Candidate must secure <strong>Internal &ge; 25/50</strong> AND <strong>External &ge; 25/50</strong> AND <strong>Total &ge; 50/100</strong> to PASS. If any condition fails, Status is FAIL, Grade is F, Grade Points is 0.
                </span>
              </div>
              <span className="hidden md:inline-block font-mono text-[11px] text-blue-700 font-semibold">
                Grading: 90+ O | 80+ A+ | 70+ A | 60+ B+ | 50+ B | &lt;50 F
              </span>
            </div>

            {/* Results Sheet Card */}
            <Card className="border-slate-200 shadow-card bg-white">
              <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold">
                    Class Result Roster — {selectedCourse?.code}
                  </CardTitle>
                  <div className="text-xs text-slate-500">
                    Semester {selectedCourse?.semester} • {selectedCourse?.departmentName}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isLocked ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-3.5 py-1.5 rounded-lg shadow-sm">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>{submission?.status === 'Approved' ? 'Results Approved by Admin (Locked)' : 'Submitted for Admin Approval (Locked)'}</span>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSaveDraft}
                        isLoading={isSavingDraft}
                        leftIcon={<Save className="w-3.5 h-3.5" />}
                      >
                        Save Draft
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleSubmitResultsForApproval}
                        isLoading={isSubmitting}
                        disabled={roster.length === 0}
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                      >
                        Submit Complete Class Result
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Submission Locked Banner */}
                {isLocked && (
                  <div className="mx-6 mt-4 p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Class Results Formally Submitted:</strong> Complete class results for <strong>{selectedCourse?.code} - {selectedCourse?.name}</strong> have been submitted to Administration. Marks are locked and editing is strictly disabled.
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded border border-amber-300 flex items-center gap-1 shrink-0">
                      <Lock className="w-3 h-3" /> Locked (Read-Only)
                    </span>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-600 tracking-wider">
                      <tr>
                        <th className="p-3.5">REGISTER NUMBER</th>
                        <th className="p-3.5">STUDENT NAME</th>
                        <th className="p-3.5 text-center">
                          INTERNAL (50)
                          <div className="text-[10px] text-slate-400 normal-case font-normal">Auto-loaded (Read-only)</div>
                        </th>
                        <th className={`p-3.5 text-center border-x ${
                          isLocked 
                            ? 'bg-slate-50 border-slate-200 text-slate-700 font-bold' 
                            : 'bg-blue-50/50 border-blue-100 text-blue-900 font-bold'
                        }`}>
                          EXTERNAL EXAM (50)
                          <div className={`text-[10px] normal-case ${
                            isLocked ? 'text-slate-400 font-normal' : 'text-blue-600 font-medium'
                          }`}>
                            {isLocked ? 'Submitted (Read-only)' : 'Faculty Enters (0–50)'}
                          </div>
                        </th>
                        <th className="p-3.5 text-center">
                          TOTAL (100)
                          <div className="text-[10px] text-slate-400 normal-case font-normal">Auto-calculated</div>
                        </th>
                        <th className="p-3.5 text-center">
                          LETTER GRADE
                          <div className="text-[10px] text-slate-400 normal-case font-normal">Auto-calculated</div>
                        </th>
                        <th className="p-3.5 text-center">
                          GRADE POINTS
                          <div className="text-[10px] text-slate-400 normal-case font-normal">Auto-calculated</div>
                        </th>
                        <th className="p-3.5 text-center">
                          STATUS
                          <div className="text-[10px] text-slate-400 normal-case font-normal">Auto-determined</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {roster.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-12 text-center">
                            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <h4 className="font-bold text-slate-800 text-sm">No Scholars Enrolled in This Course Yet</h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                              No scholars are currently enrolled in <strong>{selectedCourse?.code} - {selectedCourse?.name}</strong>. Once students enroll from the Student Portal and you accept their registration, they will appear here to enter external marks and calculate official semester grades.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        roster.map((r) => {
                          const hasError = !!r.validationError;
                          const isInternalLow = r.internalMarks !== null && r.internalMarks < 25;
                          const isExternalLow = r.externalMarks !== null && r.externalMarks < 25;

                          return (
                            <tr
                              key={r.studentId}
                              className={`hover:bg-slate-50/70 transition-colors ${
                                hasError ? 'bg-rose-50/40' : ''
                              }`}
                            >
                              {/* 1. Register Number */}
                              <td className="p-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                                {r.registerNumber}
                              </td>

                              {/* 2. Student Name */}
                              <td className="p-3.5 font-semibold text-slate-900 whitespace-nowrap">
                                {r.studentName}
                              </td>

                              {/* 3. Internal (50) - Read-only */}
                              <td className="p-3.5 text-center whitespace-nowrap">
                                {r.internalMarks !== null ? (
                                  <div className="inline-flex flex-col items-center">
                                    <span
                                      className={`inline-block px-2.5 py-1 rounded font-mono font-bold text-xs ${
                                        isInternalLow
                                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                                      }`}
                                      title={isInternalLow ? 'Internal mark below 25 passing requirement' : 'Approved Internal Exam Mark'}
                                    >
                                      {r.internalMarks} / 50
                                    </span>
                                    {isInternalLow && (
                                      <span className="text-[10px] text-rose-600 font-semibold mt-0.5">
                                        &lt; 25 (Fail Section)
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                    <AlertCircle className="w-3 h-3 text-amber-600" />
                                    Internal marks not available
                                  </span>
                                )}
                              </td>

                              {/* 4. External Exam (50) - Read-only when locked */}
                              <td className={`p-3 text-center border-x whitespace-nowrap ${
                                isLocked ? 'bg-slate-50/50 border-slate-100' : 'bg-blue-50/30 border-blue-100/60'
                              }`}>
                                <div className="inline-flex flex-col items-center">
                                  {isLocked ? (
                                    <span className="font-mono font-bold text-sm text-slate-800 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-lg inline-block w-20 text-center select-all shadow-sm">
                                      {r.externalMarks !== null ? r.externalMarks : '—'}
                                      <span className="text-[10px] text-slate-400 font-normal ml-1">/ 50</span>
                                    </span>
                                  ) : (
                                    <div className="relative">
                                      <input
                                        type="number"
                                        min={0}
                                        max={50}
                                        step="any"
                                        placeholder="0–50"
                                        value={r.externalInput}
                                        onChange={(e) => handleExternalMarksChange(r.studentId, e.target.value)}
                                        className={`w-24 px-2.5 py-1.5 text-center font-mono font-bold text-sm rounded-lg border-2 transition-all outline-none ${
                                          hasError
                                            ? 'border-rose-500 bg-rose-50 text-rose-900 focus:ring-2 focus:ring-rose-300'
                                            : isExternalLow
                                            ? 'border-rose-300 bg-rose-50/30 text-rose-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-200'
                                            : 'border-blue-300 bg-white text-slate-900 shadow-sm hover:border-blue-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-200'
                                        }`}
                                      />
                                      <span className="absolute right-1.5 top-2 text-[10px] text-slate-400 font-normal pointer-events-none">
                                        /50
                                      </span>
                                    </div>
                                  )}

                                  {/* Error or validation message */}
                                  {!isLocked && (hasError ? (
                                    <span className="text-[11px] text-rose-600 font-bold mt-1 max-w-[150px] leading-tight text-center">
                                      {r.validationError}
                                    </span>
                                  ) : isExternalLow ? (
                                    <span className="text-[10px] text-rose-600 font-semibold mt-0.5">
                                      &lt; 25 (Fail Section)
                                    </span>
                                  ) : null)}
                                </div>
                              </td>

                              {/* 5. Total (100) - Read-only calculated */}
                              <td className="p-3.5 text-center whitespace-nowrap">
                                {r.totalMarks !== null ? (
                                  <div className="inline-flex flex-col items-center">
                                    <span
                                      className={`inline-block px-2.5 py-1 rounded font-mono font-extrabold text-sm ${
                                        r.totalMarks < 50
                                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                          : 'bg-slate-100 text-slate-900 border border-slate-200'
                                      }`}
                                    >
                                      {r.totalMarks} / 100
                                    </span>
                                    {r.totalMarks < 50 && (
                                      <span className="text-[10px] text-rose-600 font-semibold mt-0.5">
                                        &lt; 50 (Total Fail)
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 font-mono">—</span>
                                )}
                              </td>

                              {/* 6. Letter Grade - Read-only calculated */}
                              <td className="p-3.5 text-center whitespace-nowrap">
                                {r.grade !== '—' ? (
                                  <span
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm font-mono ${
                                      r.grade === 'F'
                                        ? 'bg-rose-100 text-rose-700 border border-rose-300'
                                        : r.grade === 'O'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-brand-50 text-brand-700 border border-brand-200'
                                    }`}
                                  >
                                    {r.grade}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-mono">—</span>
                                )}
                              </td>

                              {/* 7. Grade Points - Read-only calculated */}
                              <td className="p-3.5 text-center whitespace-nowrap">
                                {r.grade !== '—' ? (
                                  <span
                                    className={`inline-block px-2.5 py-1 rounded font-mono font-bold text-xs ${
                                      r.gradePoints === 0
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                                    }`}
                                  >
                                    {r.gradePoints}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-mono">—</span>
                                )}
                              </td>

                              {/* 8. Status - Read-only PASS / FAIL badge */}
                              <td className="p-3.5 text-center whitespace-nowrap">
                                {r.passStatus === 'PASS' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    PASS
                                  </span>
                                ) : r.passStatus === 'FAIL' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                    FAIL
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                                    PENDING
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer notes */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                    <span>Only External Exam Marks are editable. Internal marks & all calculated outputs are strictly system-governed.</span>
                  </div>
                  <span className="font-semibold text-brand-700">Course-Level Admin Approval Required</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
