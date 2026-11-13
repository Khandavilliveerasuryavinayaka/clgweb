'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';
import { SemesterResult } from '@/types';
import { 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  FileText, 
  ShieldCheck,
  Sparkles,
  GraduationCap
} from 'lucide-react';

export default function StudentResultsPage() {
  const { user } = useAuth();
  const studentId = user?.id || '';
  const [liveResults, setLiveResults] = useState<SemesterResult[]>([]);

  useEffect(() => {
    if (!studentId) return;
    fetch(`/api/results?role=STUDENT&studentId=${encodeURIComponent(studentId)}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setLiveResults(json.data);
        }
      })
      .catch(() => {});
  }, [studentId]);

  // CRITICAL RULE: Student can view results that have status === 'Published' or 'Approved' by Admin!
  const localPublished = user ? mockDb.getStudentVisibleResults(studentId) : [];
  const courseIds = new Set(liveResults.map(r => r.courseId));
  const publishedResults = [
    ...liveResults,
    ...localPublished.filter(r => !courseIds.has(r.courseId)),
  ];

  const availableSemesters = Array.from(
    new Set(publishedResults.map((r) => r.semester).filter(Boolean))
  ).sort((a, b) => Number(b) - Number(a));

  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  // Compute pending results for clear feedback
  const allStudentResults = user
    ? mockDb.getResults().filter(r => r.studentId === studentId || (user.registerNumber && r.registerNumber === user.registerNumber))
    : [];
  const pendingResults = allStudentResults.filter(
    r => (r.status === 'Submitted' || r.status === 'Draft') && !publishedResults.some(pr => pr.courseId === r.courseId)
  );

  const displayedResults = selectedSemester === 'all'
    ? publishedResults
    : publishedResults.filter((r) => r.semester === parseInt(selectedSemester, 10));

  // Compute SGPA for displayed semester / all results
  const totalCredits = displayedResults.reduce((acc, r) => acc + (r.credits || 0), 0);
  const totalPoints = displayedResults.reduce((acc, r) => acc + (r.credits || 0) * (r.gradePoints || 0), 0);
  const sgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : null;

  return (
    <PortalLayout role="STUDENT">
      <div className="space-y-6">
        {/* Header with Term Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              End-Semester Examination Results
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Only moderated, approved, and officially released examination results are reflected in this portal.
            </p>
          </div>

          {publishedResults.length > 0 && (
            <div className="w-56">
              <Select
                label="Filter by Semester"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                options={[
                  { label: `All Semesters (${publishedResults.length} Approved)`, value: 'all' },
                  ...availableSemesters.map((sem) => ({
                    label: `Semester ${sem} (${publishedResults.filter(r => r.semester === sem).length} Courses)`,
                    value: String(sem),
                  })),
                ]}
              />
            </div>
          )}
        </div>

        {publishedResults.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-card">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-base text-slate-900">
              No Approved Results Available Yet
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              {pendingResults.length > 0
                ? `Marks for ${pendingResults.length} course(s) have been submitted by faculty and are currently undergoing institutional review. Once approved by the Admin, your official results and grade cards will be displayed here.`
                : 'No semester examination results have been approved or published for your profile yet. Results will appear here once approved by the administration.'}
            </p>
          </div>
        ) : displayedResults.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-card">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h4 className="font-bold text-base text-slate-900">
              No approved results available for Semester {selectedSemester}.
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              Examination marks for Semester {selectedSemester} have not yet been approved and released by the Academic Deanery.
            </p>
          </div>
        ) : (
          <>
            {/* GPA Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-slate-200 bg-gradient-to-br from-brand-50 to-white">
                <CardContent className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {selectedSemester === 'all' ? 'Cumulative Grade Point Average (CGPA)' : `Semester ${selectedSemester} SGPA`}
                  </div>
                  <div className="text-3xl font-extrabold text-brand-700 mt-1">
                    {sgpa !== null ? `${sgpa} / 10.0` : 'N/A'}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold mt-1">
                    First Class with Distinction
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Cumulative Credits Earned
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">
                    {totalCredits} Credits
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">All registered courses cleared</div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Approval & Release Status
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Admin Approved</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Official Authority: {displayedResults[0]?.approvedBy || 'Dean of Examinations'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Table */}
            <Card className="border-slate-200 shadow-card">
              <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold">
                    Official Grade Transcript {selectedSemester === 'all' ? '(All Approved Semesters)' : `(Semester ${selectedSemester})`}
                  </CardTitle>
                  <div className="text-xs text-slate-500">
                    Candidate: {user?.name} ({user?.registerNumber})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Downloading official stamped grade sheet PDF...')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-brand-600" />
                  <span>Download Transcript</span>
                </button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                      <tr>
                        <th className="p-4">Course Code</th>
                        <th className="p-4">Course Title</th>
                        <th className="p-4 text-center">Semester</th>
                        <th className="p-4 text-center">Credits</th>
                        <th className="p-4 text-center">Internal (50)</th>
                        <th className="p-4 text-center">External (50)</th>
                        <th className="p-4 text-center">Total (100)</th>
                        <th className="p-4 text-center">Letter Grade</th>
                        <th className="p-4 text-center">Grade Points</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedResults.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/60">
                          <td className="p-4 font-mono font-bold text-slate-900">{r.courseCode}</td>
                          <td className="p-4 font-medium text-slate-900">{r.courseName}</td>
                          <td className="p-4 text-center text-slate-600 font-medium">Sem {r.semester}</td>
                          <td className="p-4 text-center font-bold text-slate-800">{r.credits}</td>
                          <td className="p-4 text-center font-medium">{r.internalMarks}</td>
                          <td className="p-4 text-center font-medium">{r.externalMarks}</td>
                          <td className="p-4 text-center font-bold text-slate-900">{r.totalMarks}</td>
                          <td className="p-4 text-center font-extrabold text-sm text-brand-600">
                            {r.grade}
                          </td>
                          <td className="p-4 text-center font-bold text-slate-800">
                            {r.gradePoints}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {r.status || 'Approved'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
