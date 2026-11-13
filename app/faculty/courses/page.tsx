'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { 
  BookOpen, 
  CalendarCheck, 
  Award, 
  FileText, 
  CheckSquare, 
  Users, 
  PlusCircle, 
  Trash2,
  AlertCircle,
  Archive,
  Loader2,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function FacultyTeachingModulesPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [moduleToRemove, setModuleToRemove] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'concluded'>('active');

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const myFacultyId = user?.id;
      const myFacultyReg = user?.registerNumber;
      const facultyParam = myFacultyId || myFacultyReg || '';

      // Sync any approved or published submissions from backend
      try {
        const subRes = await fetch('/api/results?type=submissions', { cache: 'no-store' });
        const subJson = await subRes.json();
        if (subJson.success && Array.isArray(subJson.data)) {
          for (const sub of subJson.data) {
            if (sub.status === 'Approved' || sub.status === 'Published') {
              mockDb.archiveCourse(sub.course_id || sub.courseId, sub.course_code || sub.courseCode);
            }
          }
        }
      } catch (_) {}

      const res = await fetch(`/api/courses?facultyId=${encodeURIComponent(facultyParam)}&createdByOnly=true`, { cache: 'no-store' });
      const json = await res.json();

      let apiCourses: any[] = [];
      if (json.success && Array.isArray(json.data)) {
        apiCourses = json.data;
      }

      // Check mockDb for any non-catalog courses created by this faculty in this session
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

      // Filter out any explicitly deleted courses
      let deletedSet = new Set<string>();
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const stored = JSON.parse(window.localStorage.getItem('deleted_courses') || '[]');
          if (Array.isArray(stored)) {
            stored.forEach((item: string) => deletedSet.add(String(item).trim().toUpperCase()));
          }
        } catch (_) {}
      }

      const filtered = combined.filter((c) => {
        const cid = String(c.id).trim().toUpperCase();
        const ccode = String(c.code).trim().toUpperCase();
        return !deletedSet.has(cid) && !deletedSet.has(ccode);
      });

      setCourses(filtered);
    } catch (e) {
      console.error('Failed to load courses from API:', e);
      const myFacultyId = user?.id;
      const myFacultyReg = user?.registerNumber;
      setCourses(
        mockDb.getCourses().filter(
          (c) =>
            !c.isCatalog &&
            ((myFacultyId && (c.createdBy === myFacultyId || c.facultyId === myFacultyId)) ||
              (myFacultyReg && (c.createdBy === myFacultyReg || c.facultyId === myFacultyReg)))
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleConfirmRemove = async () => {
    if (!moduleToRemove) return;
    setIsDeleting(true);
    try {
      const targetId = moduleToRemove.id;
      const targetCode = moduleToRemove.code;

      // 1. Delete from API (Supabase & mockDb)
      await fetch(
        `/api/courses?id=${encodeURIComponent(targetId)}&code=${encodeURIComponent(targetCode)}`,
        { method: 'DELETE' }
      );

      // 2. Mark in mockDb & localStorage
      mockDb.deleteCourse(targetId, targetCode);
      mockDb.archiveCourse(targetId, targetCode);

      // 3. Update state
      setCourses((prev) =>
        prev.filter((c) => c.id !== targetId && c.code !== targetCode)
      );

      success(`Teaching module ${targetCode} (${moduleToRemove.name}) removed successfully.`);
      setModuleToRemove(null);
    } catch (err: any) {
      console.error('Failed to remove course:', err);
      toastError(err.message || 'Failed to remove teaching module.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Active courses: Exclude any course whose results have been published or deleted
  const activeCourses = courses.filter((c) => !mockDb.isCourseResultsPublished(c.id, c.code));

  // Concluded courses: Courses whose results have been officially published
  const concludedCourses = courses.filter((c) => mockDb.isCourseResultsPublished(c.id, c.code));

  const displayedCourses = activeTab === 'active' ? activeCourses : concludedCourses;
  const allRegistrations = mockDb.getCourseRegistrations();

  return (
    <PortalLayout role="FACULTY">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Teaching Modules
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Authorized curriculum modules assigned to your faculty profile for instruction, enrollment approvals, attendance, marks, assignments, and results.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/faculty/create-course">
              <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Create Course
              </Button>
            </Link>
            <Link href="/faculty/enrollment-requests">
              <Button size="sm" variant="outline" leftIcon={<Users className="w-4 h-4" />}>
                Enrollment Requests
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab switch between Active and Concluded/Published */}
        {courses.length > 0 && (
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'active'
                  ? 'bg-brand-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Active Modules ({activeCourses.length})
            </button>
            {concludedCourses.length > 0 && (
              <button
                onClick={() => setActiveTab('concluded')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'concluded'
                    ? 'bg-brand-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Concluded / Results Published ({concludedCourses.length})
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <Card className="border-slate-200 p-12 text-center shadow-card bg-white">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">Loading Teaching Modules...</h3>
            <p className="text-xs text-slate-500 mt-1">
              Retrieving curriculum modules assigned to your faculty profile.
            </p>
          </Card>
        ) : displayedCourses.length === 0 ? (
          <Card className="border-slate-200 p-12 text-center shadow-card bg-white">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">
              {activeTab === 'active'
                ? courses.length > 0
                  ? 'All Teaching Modules Concluded'
                  : 'No Teaching Modules Assigned'
                : 'No Concluded Teaching Modules'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              {activeTab === 'active'
                ? courses.length > 0
                  ? 'All assigned curriculum modules have concluded or their results have been officially published. Completed courses are archived.'
                  : 'You have not created or been assigned any teaching modules yet. Click below to create your first curriculum module.'
                : 'No teaching modules with published results found.'}
            </p>
            {courses.length === 0 && (
              <div className="mt-4">
                <Link href="/faculty/create-course">
                  <Button size="sm" variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
                    Create Teaching Module
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedCourses.map((crs) => {
              const courseRegs = allRegistrations.filter((r) => r.courseId === crs.id || r.courseCode === crs.code);
              const acceptedCount = courseRegs.filter(
                (r) => r.status === 'ACCEPTED' || r.status === 'Approved'
              ).length;
              const pendingCount = courseRegs.filter(
                (r) => r.status === 'PENDING' || r.status === 'Submitted'
              ).length;

              return (
                <Card
                  key={crs.id}
                  className="border-slate-200 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                            {crs.code}
                          </span>
                          <Badge variant={crs.type === 'LAB' ? 'info' : 'purple'}>
                            {crs.type || 'CORE'}
                          </Badge>
                          <span className="text-xs text-slate-500 font-semibold">
                            Semester {crs.semester || 6} • {crs.credits || 3} Credits
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-navy-900 leading-snug">{crs.name}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge status="Active">Instructor</Badge>
                        <button
                          type="button"
                          onClick={() => setModuleToRemove(crs)}
                          title="Remove / Conclude module"
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{crs.description}</p>

                    {/* Metric Cards: Accepted Students vs Pending Requests */}
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          Accepted Students
                        </div>
                        <div className="font-extrabold text-emerald-700 text-base mt-0.5">
                          {acceptedCount} <span className="text-xs font-normal text-slate-400">/ {crs.maxStudents || 60}</span>
                        </div>
                        <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Officially Enrolled</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          Pending Requests
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="font-extrabold text-amber-700 text-base">
                            {pendingCount}
                          </span>
                          {pendingCount > 0 && (
                            <Link
                              href="/faculty/enrollment-requests"
                              className="text-[10px] font-bold text-amber-700 hover:underline bg-amber-100/80 px-2 py-0.5 rounded-full"
                            >
                              Review →
                            </Link>
                          )}
                        </div>
                        <div className="text-[10px] text-amber-600 font-medium mt-0.5">Awaiting Action</div>
                      </div>
                    </div>
                  </CardContent>

                  {/* Actions: Students, Today's Attendance, Internal Marks, Assignments, Results */}
                  <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/faculty/students?courseCode=${crs.code}`}
                      className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Class List ({acceptedCount})</span>
                    </Link>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link href={`/faculty/attendance?courseId=${crs.id}`}>
                        <Button size="sm" variant="outline" className="h-8 text-[11px] px-2.5">
                          <CalendarCheck className="w-3 h-3 mr-1 text-emerald-600" />
                          <span>Today&apos;s Attendance</span>
                        </Button>
                      </Link>
                      <Link href={`/faculty/internal-marks?courseId=${crs.id}`}>
                        <Button size="sm" variant="outline" className="h-8 text-[11px] px-2.5">
                          <Award className="w-3 h-3 mr-1 text-amber-600" />
                          <span>Marks</span>
                        </Button>
                      </Link>
                      <Link href={`/faculty/assignments?courseId=${crs.id}`}>
                        <Button size="sm" variant="outline" className="h-8 text-[11px] px-2.5">
                          <FileText className="w-3 h-3 mr-1 text-blue-600" />
                          <span>Assignments</span>
                        </Button>
                      </Link>
                      <Link href={`/faculty/results?courseId=${crs.id}`}>
                        <Button size="sm" variant="primary" className="h-8 text-[11px] px-2.5">
                          <CheckSquare className="w-3 h-3 mr-1" />
                          <span>Results</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Confirmation Modal to Remove / Archive Teaching Module */}
        {moduleToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-navy-900 text-base">Remove Teaching Module</h3>
                    <p className="text-xs text-slate-500">Confirm removal of curriculum module</p>
                  </div>
                </div>
                <button
                  onClick={() => setModuleToRemove(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-navy-900">
                  {moduleToRemove.code} — {moduleToRemove.name}
                </div>
                <div className="text-slate-500">
                  Semester {moduleToRemove.semester || 6} • {moduleToRemove.credits || 3} Credits
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to remove this module from your active teaching modules? It will be removed from your active instruction list, student registration decks, and portal views.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setModuleToRemove(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleConfirmRemove}
                  disabled={isDeleting}
                  leftIcon={isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                >
                  {isDeleting ? 'Removing...' : 'Confirm Remove'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
