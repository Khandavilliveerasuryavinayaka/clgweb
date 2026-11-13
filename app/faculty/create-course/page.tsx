'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { BookOpen, PlusCircle, ArrowLeft, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function FacultyCreateCoursePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [departmentName, setDepartmentName] = useState(user?.department || 'Computer Science and Engineering');
  const [program, setProgram] = useState('B.Tech Computer Science');
  const [semester, setSemester] = useState(6);
  const [credits, setCredits] = useState(3);
  const [type, setType] = useState<'CORE' | 'ELECTIVE' | 'LAB'>('CORE');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [maxStudents, setMaxStudents] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = mockDb.getDepartments();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      toastError('Course Code and Course Name are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || `${name.trim()} curriculum module.`,
          departmentName,
          semester: Number(semester),
          credits: Number(credits),
          type,
          facultyId: user?.id,
          facultyName: user?.name,
          academicYear,
          maxStudents: Number(maxStudents),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || 'Failed to create course in Supabase.');
      }

      success(
        `Course ${code.trim().toUpperCase()} created successfully in Supabase. You are designated as its instructor.`,
        'Course Created in Supabase'
      );
      router.push('/faculty/courses');
    } catch (err: any) {
      toastError(err.message || 'Failed to create course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PortalLayout role="FACULTY">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/faculty/courses"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Teaching Modules</span>
              </Link>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Create Teaching Module / Course
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Publish a new curriculum course module for student enrollment. You will automatically become the course instructor and owner.
            </p>
          </div>
        </div>

        <Card className="border-slate-200 shadow-card">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-navy-900">
                  Course Metadata & Curriculum Specification
                </CardTitle>
                <p className="text-[11px] text-slate-500">
                  All created courses undergo strict faculty ownership verification.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Course Code <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. CS606"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="font-mono uppercase font-bold"
                  />
                  <span className="text-[11px] text-slate-400">Institutional catalog reference</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Course Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Advanced Artificial Intelligence"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Course Description
                </label>
                <Textarea
                  placeholder="Outline course learning objectives, syllabus units, prerequisites, and laboratory components..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Program Target
                  </label>
                  <Input
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Academic Year <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2024-2025"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Semester <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Credits <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map((c) => (
                      <option key={c} value={c}>
                        {c} Credit{c > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Course Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="CORE">CORE (Theory)</option>
                    <option value="ELECTIVE">ELECTIVE</option>
                    <option value="LAB">LAB (Practical)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max Capacity
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Ownership notice box */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Course Ownership & Instructor Rights</div>
                  <p className="text-blue-800 leading-relaxed text-[11px]">
                    By creating this teaching module, you (<strong>{user?.name || 'Prof. Anand Kumar'}</strong>) will be designated as the authorized course instructor. Only you will be permitted to review student enrollment requests, mark today&apos;s attendance, assign coursework, submit internal marks, and file semester results for this course.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <Link href="/faculty/courses">
                  <Button type="button" variant="outline" size="md">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Creating Module...' : 'Create Course & Publish'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
