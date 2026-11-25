'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/Input';
import { Users, Search, ShieldAlert, ArrowRight, Eye, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Course } from '@/types';

import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';

function FacultyStudentsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const queryCourseCode = searchParams.get('courseCode') || searchParams.get('courseId');

  const [courses, setCourses] = useState<Course[]>([]);
  const [filterCourse, setFilterCourse] = useState<string>('ALL');
  const [search, setSearch] = useState('');

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
        ];

        setCourses(combined);

        if (queryCourseCode) {
          const match = combined.find(
            (c) => c.code.toUpperCase() === queryCourseCode.toUpperCase() || c.id === queryCourseCode
          );
          if (match) {
            setFilterCourse(match.code);
          }
        }
      } catch (e) {
        console.error('Failed to load courses on students page:', e);
        const myFacultyId = user?.id;
        const myFacultyReg = user?.registerNumber;
        const fallback = mockDb.getCourses().filter(
          (c) =>
            !c.isCatalog &&
            ((myFacultyId && (c.createdBy === myFacultyId || c.facultyId === myFacultyId)) ||
              (myFacultyReg && (c.createdBy === myFacultyReg || c.facultyId === myFacultyReg)))
        );
        setCourses(fallback);
      }
    }
    loadFacultyCourses();
  }, [user, queryCourseCode]);

  // Requirement 5 & 12: Faculty sees ONLY ACCEPTED students for their authorized courses
  const facultyCourseIds = new Set(courses.map((c) => c.id));
  const facultyCourseCodes = new Set(courses.map((c) => c.code?.toUpperCase()));

  const acceptedRegistrations = mockDb.getCourseRegistrations().filter((r) => {
    if (r.status !== 'ACCEPTED' && r.status !== 'Approved') return false;
    if (filterCourse !== 'ALL') {
      return (
        r.courseCode?.toUpperCase() === filterCourse.toUpperCase() ||
        r.courseId === filterCourse
      );
    }
    return facultyCourseIds.has(r.courseId) || facultyCourseCodes.has(r.courseCode?.toUpperCase());
  });

  const acceptedStudentIds = new Set(acceptedRegistrations.map((r) => r.studentId));
  const acceptedStudents = mockDb.getUsers().filter(
    (u) => u.role === 'STUDENT' && acceptedStudentIds.has(u.id)
  );

  const filtered = acceptedStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.registerNumber.toLowerCase().includes(search.toLowerCase()) ||
      (s.department && s.department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <PortalLayout role="FACULTY">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Authorized Course Enrolment Roster
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Scholars enrolled across your authorized department courses for Semester 6.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {courses.length > 0 && (
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="text-xs rounded-xl border border-slate-300 p-2 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ALL">All My Teaching Modules ({courses.length})</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            )}

            <div className="w-full sm:w-64">
              <SearchInput
                placeholder="Search by student name or Reg No..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
              />
            </div>
          </div>
        </div>

        {courses.length === 0 ? (
          <Card className="border-slate-200 p-12 text-center shadow-card bg-white">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">No Teaching Modules Created Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              You do not have any teaching modules published. Scholars enroll in modules you create.
            </p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border-slate-200 p-12 text-center shadow-card bg-white">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">No Scholars Enrolled Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              No scholars are currently enrolled in {filterCourse === 'ALL' ? 'your teaching modules' : filterCourse}. Once scholars enroll and you accept their requests, they will appear in this roster.
            </p>
          </Card>
        ) : (
          <Card className="border-slate-200 shadow-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold">Class List ({filtered.length} Students)</CardTitle>
              <span className="text-xs text-slate-400">
                {filterCourse === 'ALL' ? 'All Assigned Modules' : `Module: ${filterCourse}`}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                    <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Register Number</th>
                    <th className="p-4">Program & Dept</th>
                    <th className="p-4 text-center">Semester</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => {
                    const isBlocked = s.accountStatus === 'BLOCKED';
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={s.avatarUrl}
                              name={s.name}
                              registerNumber={s.registerNumber}
                              size="sm"
                              shape="circle"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{s.name}</div>
                              <div className="text-[11px] text-slate-400">{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-800">{s.registerNumber}</td>
                        <td className="p-4">
                          <div className="font-medium text-slate-900">{s.program || 'B.Tech CSE'}</div>
                          <div className="text-[11px] text-slate-400">{s.department}</div>
                        </td>
                        <td className="p-4 text-center font-bold text-slate-700">Sem {s.semester || 6}</td>
                        <td className="p-4">
                          <Badge status={s.accountStatus}>{s.accountStatus}</Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/faculty/student-360?reg=${s.registerNumber}`}>
                            <Button
                              size="sm"
                              variant={isBlocked ? 'destructive' : 'outline'}
                              className="h-7 text-xs px-2.5"
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                            >
                              Student 360
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  </PortalLayout>
  );
}

export default function FacultyStudentsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading students...</div>}>
      <FacultyStudentsContent />
    </React.Suspense>
  );
}
