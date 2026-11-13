'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Course } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Save, 
  Send, 
  Clock, 
  Users,
  AlertCircle
} from 'lucide-react';

export default function FacultyAttendancePage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const searchParams = useSearchParams();
  const queryCourseId = searchParams.get('courseId');

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [period, setPeriod] = useState('1');

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

        // Auto-select course from query param or first available
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
        console.error('Failed to load courses on attendance page:', e);
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

  // Strict Today Only: Automatically use today's date
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const selectedCourse = courses.find((c) => c.id === selectedCourseId || c.code === selectedCourseId);

  // Requirement 5 & 6: Attendance is strictly for ACCEPTED students in this authorized module
  const acceptedRegistrations = mockDb.getCourseRegistrations().filter(
    (r) =>
      (r.courseId === selectedCourseId || (selectedCourse && (r.courseId === selectedCourse.code || r.courseCode === selectedCourse.code))) &&
      (r.status === 'ACCEPTED' || r.status === 'Approved')
  );
  const enrolledStudentIds = new Set(acceptedRegistrations.map((r) => r.studentId));
  const allStudents = mockDb.getUsers().filter((u) => u.role === 'STUDENT');
  const students = allStudents.filter((s) => enrolledStudentIds.has(s.id));

  // Attendance state map: studentId -> 'PRESENT' | 'ABSENT'
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});

  useEffect(() => {
    const initialMap: Record<string, 'PRESENT' | 'ABSENT'> = {};
    students.forEach((s) => {
      initialMap[s.id] = 'PRESENT';
    });
    setAttendanceMap(initialMap);
  }, [selectedCourseId, students.length]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleAttendance = (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    const student = students.find((s) => s.id === studentId);
    if (student?.accountStatus === 'BLOCKED') {
      toastError(`Cannot mark attendance for ${student.name}. Student account is BLOCKED.`);
      return;
    }
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleBulkMark = (status: 'PRESENT' | 'ABSENT') => {
    const updated: Record<string, 'PRESENT' | 'ABSENT'> = {};
    for (const s of students) {
      if (s.accountStatus !== 'BLOCKED') {
        updated[s.id] = status;
      }
    }
    setAttendanceMap(updated);
    success(`Marked all non-blocked students as ${status}.`, 'Bulk Operation Applied');
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toastError('Please select a valid teaching module.');
      return;
    }

    setIsSubmitting(true);

    try {
      const recordsToSubmit = students
        .filter((s) => s.accountStatus !== 'BLOCKED')
        .map((s) => ({
          courseId: selectedCourseId,
          courseCode: selectedCourse?.code || 'CS601',
          courseName: selectedCourse?.name || 'Course',
          date: todayStr, // Backend strictly enforces date = todayStr
          period: parseInt(period, 10),
          studentId: s.id,
          registerNumber: s.registerNumber,
          studentName: s.name,
          status: (attendanceMap[s.id] || 'PRESENT') as 'PRESENT' | 'ABSENT',
          markedBy: user?.name || 'Faculty Member',
        }));

      if (recordsToSubmit.length === 0) {
        toastError('No active, non-blocked students available to mark attendance.');
        setIsSubmitting(false);
        return;
      }

      mockDb.markAttendance(recordsToSubmit);

      try {
        await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: selectedCourseId,
            facultyId: user?.id,
            date: todayStr,
            records: recordsToSubmit,
          }),
        });
      } catch (apiErr) {
        console.warn('API sync warning:', apiErr);
      }

      setIsSubmitting(false);
      success(
        `Attendance for ${recordsToSubmit.length} students recorded for Period ${period} on today's date (${todayStr}).`,
        'Attendance Gazetted'
      );
    } catch (err: any) {
      setIsSubmitting(false);
      toastError(err.message || 'Failed to submit attendance.');
    }
  };

  return (
    <PortalLayout role="FACULTY">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            Daily Classroom Attendance Entry
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Faculty attendance is strictly limited to today&apos;s institutional date. Blocked students are systematically locked.
          </p>
        </div>

        {courses.length === 0 ? (
          <Card className="border-slate-200 p-8 text-center">
            <CalendarCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">No Assigned Teaching Modules</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              You do not currently have any curriculum modules assigned. Attendance can only be marked for courses assigned to your faculty profile.
            </p>
          </Card>
        ) : (
          <>
            {/* Course & Session Selector Form */}
            <Card className="border-slate-200 shadow-card">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select
                    label="Teaching Module"
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    options={courses.map((c) => ({
                      label: `${c.code} - ${c.name}`,
                      value: c.id,
                    }))}
                  />

                  {/* Locked Today Only Date Display */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Attendance Date (Today Only)
                    </label>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold">
                      <CalendarCheck className="w-4 h-4 text-brand-600 shrink-0" />
                      <span className="truncate">{todayFormatted}</span>
                      <span className="ml-auto font-mono text-[10px] text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200 shrink-0">
                        {todayStr}
                      </span>
                    </div>
                  </div>

                  <Select
                    label="Class Period / Hour"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    options={[
                      { label: 'Period 1 (08:30 – 09:25 AM)', value: '1' },
                      { label: 'Period 2 (09:25 – 10:20 AM)', value: '2' },
                      { label: 'Period 3 (10:35 – 11:30 AM)', value: '3' },
                      { label: 'Period 4 (11:30 – 12:25 PM)', value: '4' },
                      { label: 'Period 5 (01:15 – 02:10 PM)', value: '5' },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>

        {/* Student Attendance Roster */}
        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold">
                Student Attendance Sheet ({students.length} Total Registered)
              </CardTitle>
              <div className="text-xs text-slate-500">
                Module: <strong>{selectedCourse?.code} - {selectedCourse?.name}</strong>
              </div>
            </div>

            {/* Bulk actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 text-emerald-700 hover:bg-emerald-50"
                onClick={() => handleBulkMark('PRESENT')}
              >
                Mark All Present
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 text-rose-700 hover:bg-rose-50"
                onClick={() => handleBulkMark('ABSENT')}
              >
                Mark All Absent
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {students.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">No Scholars Enrolled in This Course Yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  No scholars are currently enrolled in <strong>{selectedCourse?.code} - {selectedCourse?.name}</strong>. Once students enroll from the Student Portal and their registration is accepted, they will appear here for daily attendance tracking.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                      <tr>
                        <th className="p-4">Register Number</th>
                        <th className="p-4">Student Name</th>
                        <th className="p-4">Account Status</th>
                        <th className="p-4 text-center">Attendance Toggle</th>
                        <th className="p-4 text-right">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((s) => {
                        const isBlocked = s.accountStatus === 'BLOCKED';
                        const currentStatus = attendanceMap[s.id] || 'PRESENT';

                        return (
                          <tr
                            key={s.id}
                            className={isBlocked ? 'bg-rose-50/40' : 'hover:bg-slate-50/60'}
                          >
                            <td className="p-4 font-mono font-bold text-slate-900">{s.registerNumber}</td>
                            <td className="p-4 font-semibold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span>{s.name}</span>
                                {isBlocked && (
                                  <span className="text-[10px] text-rose-600 font-bold bg-rose-100 px-1.5 py-0.5 rounded">
                                    DISCIPLINARY LOCK
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge status={s.accountStatus}>{s.accountStatus}</Badge>
                            </td>

                            {/* Toggle */}
                            <td className="p-4">
                              {isBlocked ? (
                                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 font-semibold">
                                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                                  <span>ATTENDANCE DISABLED (BLOCKED)</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAttendance(s.id, 'PRESENT')}
                                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                                      currentStatus === 'PRESENT'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Present</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleAttendance(s.id, 'ABSENT')}
                                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                                      currentStatus === 'ABSENT'
                                        ? 'bg-rose-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Absent</span>
                                  </button>
                                </div>
                              )}
                            </td>

                            <td className="p-4 text-right">
                              {isBlocked ? (
                                <span className="text-[11px] text-rose-600 font-medium">
                                  Academic actions unavailable while blocked
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-[11px]">Regular</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Submitting updates the student attendance percentage and logs marked classes.
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSubmitAttendance}
                    isLoading={isSubmitting}
                    leftIcon={<Send className="w-4 h-4" />}
                  >
                    Submit & Gazette Attendance
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
