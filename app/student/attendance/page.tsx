'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Alert';
import { Select } from '@/components/ui/Select';
import { 
  CalendarCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  User, 
  BarChart3,
  Calendar,
  ClipboardList
} from 'lucide-react';

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const studentId = user?.id || '';

  const [selectedSemester, setSelectedSemester] = useState('6');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [summaries, setSummaries] = useState(() => (user ? mockDb.getAttendanceSummaries(studentId) : []));

  useEffect(() => {
    if (!studentId) return;
    fetch(`/api/attendance?studentId=${encodeURIComponent(studentId)}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setSummaries(json.data);
        }
      })
      .catch(() => {});
  }, [studentId]);

  const filteredSummaries = summaries.filter((s) => {
    if (selectedCourseFilter !== 'ALL' && s.courseId !== selectedCourseFilter) return false;
    return true;
  });

  const hasRecords = filteredSummaries.length > 0 && filteredSummaries.some((s) => s.totalClasses > 0);

  const totalClasses = filteredSummaries.reduce((a, c) => a + c.totalClasses, 0);
  const totalPresent = filteredSummaries.reduce((a, c) => a + c.present, 0);
  const totalAbsent = filteredSummaries.reduce((a, c) => a + c.absent, 0);
  const totalOD = filteredSummaries.reduce((a, c) => a + c.od, 0);
  const overallPercentage =
    totalClasses > 0 ? Math.round(((totalPresent + totalOD) / totalClasses) * 1000) / 10 : null;

  return (
    <PortalLayout role="STUDENT">
      <div className="space-y-6">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Attendance Records
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Official subject-wise attendance ledger. Minimum 75% required for exam hall ticket eligibility.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-36">
              <Select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                options={[
                  { label: 'Semester 6', value: '6' },
                  { label: 'Semester 5', value: '5' },
                ]}
              />
            </div>
            {summaries.length > 0 && (
              <div className="w-48">
                <Select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  options={[
                    { label: 'All Subjects', value: 'ALL' },
                    ...summaries.map((s) => ({ label: s.courseCode, value: s.courseId })),
                  ]}
                />
              </div>
            )}
          </div>
        </div>

        {/* Empty State vs Statistics */}
        {!hasRecords ? (
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center text-slate-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h3 className="text-base font-bold text-slate-700">No attendance records available.</h3>
              <p className="text-xs text-slate-500 mt-1">
                You do not have any recorded attendance sessions for the selected term yet. Records will reflect once your course instructors mark daily attendance.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 4 Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-slate-200">
                <CardContent className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Aggregate Attendance
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-brand-700 mt-1">
                    {overallPercentage !== null ? `${overallPercentage}%` : 'N/A'}
                  </div>
                  <div className="text-[11px] font-semibold mt-1">
                    {overallPercentage !== null && overallPercentage >= 75 ? (
                      <span className="text-emerald-600">✓ Above Examination Cut-off (75%)</span>
                    ) : (
                      <span className="text-rose-600">⚠ Below Examination Cut-off (75%)</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Conducted
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                    {totalClasses} Classes
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Current Academic Term</div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Attended (Present)
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                    {totalPresent} Classes
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Physical Classroom Sessions</div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Approved On-Duty (OD)
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1">
                    {totalOD} Sessions
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Credited via Faculty Approval</div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Course Table */}
            <Card className="border-slate-200 shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Subject-Wise Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                      <tr>
                        <th className="p-4">Course</th>
                        <th className="p-4">Faculty Instructor</th>
                        <th className="p-4 text-center">Conducted</th>
                        <th className="p-4 text-center">Present</th>
                        <th className="p-4 text-center">Absent</th>
                        <th className="p-4 text-center">Approved OD</th>
                        <th className="p-4">Percentage</th>
                        <th className="p-4">Eligibility</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSummaries.map((item) => {
                        const isEligible = item.percentage >= 75;
                        return (
                          <tr key={item.courseId} className="hover:bg-slate-50/60">
                            <td className="p-4">
                              <div className="font-mono font-bold text-slate-900">{item.courseCode}</div>
                              <div className="text-slate-500 text-[11px]">{item.courseName}</div>
                            </td>
                            <td className="p-4 text-slate-700 font-medium">{item.facultyName}</td>
                            <td className="p-4 text-center font-semibold">{item.totalClasses}</td>
                            <td className="p-4 text-center text-emerald-600 font-bold">{item.present}</td>
                            <td className="p-4 text-center text-rose-600 font-bold">{item.absent}</td>
                            <td className="p-4 text-center text-blue-600 font-bold">{item.od}</td>
                            <td className="p-4 w-44">
                              <div className="space-y-1">
                                <div className="flex justify-between font-bold text-slate-900">
                                  <span>{item.percentage}%</span>
                                </div>
                                <ProgressBar
                                  value={item.percentage}
                                  color={item.percentage >= 85 ? 'success' : isEligible ? 'warning' : 'danger'}
                                  showPercent={false}
                                  size="sm"
                                />
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge status={isEligible ? 'Approved' : 'Rejected'}>
                                {isEligible ? 'Eligible' : 'Shortage'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
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
