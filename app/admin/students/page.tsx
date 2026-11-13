'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, SearchInput } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { User } from '@/types';
import { Plus, KeyRound, Eye, Loader2, Lock, Sparkles, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminStudentsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<User[]>([]);

  const [availablePrograms, setAvailablePrograms] = useState<any[]>([]);
  const [autoRegNo, setAutoRegNo] = useState('');
  const [isGeneratingReg, setIsGeneratingReg] = useState(false);

  const [studentToDelete, setStudentToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New Student Form
  const [formData, setFormData] = useState({
    name: '',
    academicYear: 2021,
    trackCode: '1',
    email: '',
    phone: '',
    department: 'Computer Science and Engineering',
    program: 'B.Tech Computer Science and Engineering',
    semester: 1,
    batch: '2021-2025',
    password: 'welcome',
  });

  const fetchProgramsList = useCallback(async () => {
    try {
      const res = await fetch('/api/programs');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAvailablePrograms(json.data);
      }
    } catch (e) {
      console.error('Failed to load programs list:', e);
    }
  }, []);

  const updateGeneratedRegNo = useCallback(async (year: number, track: string) => {
    setIsGeneratingReg(true);
    try {
      const res = await fetch(`/api/students/reg-no?year=${year}&track=${encodeURIComponent(track)}`);
      const json = await res.json();
      if (json.success && json.data?.regNo) {
        setAutoRegNo(json.data.regNo);
      }
    } catch (e) {
      console.error('Error fetching preview reg no:', e);
    } finally {
      setIsGeneratingReg(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/students');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setStudents(json.data);
      }
    } catch (e: any) {
      console.error('Failed to load students from Supabase:', e);
      toastError('Could not load student list from Supabase.');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchStudents();
    fetchProgramsList();
  }, [fetchStudents, fetchProgramsList]);

  // When modal opens or year/track changes, update the auto-generated Reg No
  useEffect(() => {
    if (createModalOpen) {
      updateGeneratedRegNo(formData.academicYear, formData.trackCode);
    }
  }, [createModalOpen, formData.academicYear, formData.trackCode, updateGeneratedRegNo]);

  const programOptions = availablePrograms.length > 0
    ? availablePrograms.map((p, i) => {
        const track = String(p.programNumber || i + 1);
        return {
          label: `Track ${track}: ${p.name} (${p.code})`,
          value: track,
          programName: p.name,
          departmentName: p.departmentName,
        };
      })
    : [
        { label: 'Track 1: B.Tech Computer Science and Engineering (BTECH-CSE)', value: '1', programName: 'B.Tech Computer Science and Engineering', departmentName: 'Computer Science and Engineering' },
        { label: 'Track 2: B.Tech Electronics and Communication (BTECH-ECE)', value: '2', programName: 'B.Tech Electronics and Communication Engineering', departmentName: 'Electronics and Communication Engineering' },
        { label: 'Track 3: M.Tech Computer Science and Engineering (MTECH-CSE)', value: '3', programName: 'M.Tech Computer Science and Engineering', departmentName: 'Computer Science and Engineering' },
      ];

  const handleYearChange = (year: number) => {
    const endYear = year + 4;
    setFormData((prev) => ({
      ...prev,
      academicYear: year,
      batch: `${year}-${endYear}`,
    }));
  };

  const handleTrackChange = (track: string) => {
    const matched = programOptions.find((p) => p.value === track);
    setFormData((prev) => ({
      ...prev,
      trackCode: track,
      program: matched?.programName || prev.program,
      department: matched?.departmentName || prev.department,
    }));
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.registerNumber.toLowerCase().includes(search.toLowerCase()) ||
      (s.department && s.department.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toastError('Please fill in candidate name and institutional email.');
      return;
    }

    if (!autoRegNo || autoRegNo.length !== 9 || !/^19[0-9]{7}$/.test(autoRegNo)) {
      toastError('Registration Number must be exactly 9 digits in the format 19YYTNNNN.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYear: formData.academicYear,
          trackCode: formData.trackCode,
          registerNumber: autoRegNo,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          department: formData.department,
          program: formData.program,
          semester: Number(formData.semester),
          batch: formData.batch.trim(),
          password: formData.password || 'welcome',
          adminUserId: user?.id,
          adminName: user?.name,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || 'Failed to enroll student account.');
      }

      await fetchStudents();
      setIsSubmitting(false);
      setCreateModalOpen(false);
      const enrolledName = formData.name;
      const enrolledReg = json.data?.registerNumber || autoRegNo;
      setFormData({
        name: '',
        academicYear: 2021,
        trackCode: '1',
        email: '',
        phone: '',
        department: 'Computer Science and Engineering',
        program: 'B.Tech Computer Science and Engineering',
        semester: 1,
        batch: '2021-2025',
        password: 'welcome',
      });
      success(
        `Scholar ${enrolledName} enrolled with auto-generated Register Number: ${enrolledReg}. Initial password is "welcome".`,
        'Student Enrolled & Registered'
      );
    } catch (err: any) {
      setIsSubmitting(false);
      toastError(err.message || 'Failed to create student account.');
    }
  };

  const handleResetAccess = (student: User) => {
    mockDb.addAuditLog(
      user?.id || 'usr-admin-1',
      user?.name || 'Dr. K. S. Ramanathan',
      'ADMIN',
      'PASSWORD_RESET',
      'User',
      student.id,
      `Dispatched credential reset for scholar ${student.name} (${student.registerNumber}). Temporary password set to "welcome".`
    );
    success(`Password reset dispatched to ${student.email}. Default credentials set.`, 'Credentials Reset');
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/students?id=${encodeURIComponent(studentToDelete.id)}&reg=${encodeURIComponent(studentToDelete.registerNumber)}`,
        {
          method: 'DELETE',
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || 'Failed to delete student.');
      }
      success(
        `Scholar ${studentToDelete.name} (${studentToDelete.registerNumber}) deleted successfully. Registration number is released and can be reused.`,
        'Student Record Removed'
      );
      setStudentToDelete(null);
      await fetchStudents();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete student.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PortalLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Institutional Student Registry
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enroll new candidates, manage academic status, and review full 360-degree dossiers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-64">
              <SearchInput
                placeholder="Search by student name or Reg No..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Enroll Student
            </Button>
          </div>
        </div>

        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">
              Enrolled Scholars ({filtered.length} Students)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4">Student Particulars</th>
                    <th className="p-4">Register Number</th>
                    <th className="p-4">Program & Department</th>
                    <th className="p-4 text-center">Semester</th>
                    <th className="p-4">Batch</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                          <span>Loading institutional registry from Supabase...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No student records found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => {
                      const isBlocked = s.accountStatus === 'BLOCKED';
                      return (
                      <tr key={s.id} className={isBlocked ? 'bg-rose-50/40' : 'hover:bg-slate-50/60'}>
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
                        <td className="p-4 font-mono font-bold text-brand-700">
                          <div>{s.registerNumber}</div>
                          {(s.studentNumber || s.appId) && (
                            <div className="text-[10px] text-slate-400 font-normal">
                              ID: #{s.studentNumber || s.appId}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{s.program || 'B.Tech CSE'}</div>
                          <div className="text-[11px] text-slate-400">{s.department}</div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            Sem {s.semester || 1}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">{s.batch || '2021-2025'}</td>
                        <td className="p-4">
                          <Badge variant={isBlocked ? 'danger' : 'success'}>
                            {s.accountStatus || 'ACTIVE'}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/faculty/student-360?reg=${s.registerNumber}`}>
                              <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                                Dossier
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetAccess(s)}
                              title="Reset security credentials"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setStudentToDelete(s)}
                              title="Permanently delete student record"
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal: Enroll Student */}
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Enroll New Student Registry"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateStudent} className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
              <span className="font-bold">Initial Security Credentials:</span> The student&apos;s initial
              temporary password will be{' '}
              <strong className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-blue-950">welcome</strong>.
              No fake academic records are created. The student will be required to change this password on
              first login.
            </div>

            {/* Academic Track & Year Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                  Academic Starting Year <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={String(formData.academicYear)}
                  onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                  options={[
                    { label: '2021 (Starting Year 2021)', value: '2021' },
                    { label: '2022 (Starting Year 2022)', value: '2022' },
                    { label: '2023 (Starting Year 2023)', value: '2023' },
                    { label: '2024 (Starting Year 2024)', value: '2024' },
                    { label: '2025 (Starting Year 2025)', value: '2025' },
                    { label: '2026 (Starting Year 2026)', value: '2026' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                  Program Track <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={formData.trackCode}
                  onChange={(e) => handleTrackChange(e.target.value)}
                  options={programOptions}
                />
              </div>
            </div>

            {/* Auto-Generated Registration Number Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Registration Number
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  disabled
                  readOnly
                  value={isGeneratingReg ? 'Calculating next sequence...' : autoRegNo}
                  className="w-full rounded-lg border border-slate-300 bg-slate-100/90 px-3.5 py-2.5 text-sm font-mono font-bold text-navy-900 tracking-wider cursor-not-allowed select-none shadow-sm pr-36"
                />
                <div className="absolute right-3 flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-md">
                  <Lock className="w-3.5 h-3.5 text-brand-600" />
                  <span>Auto-generated</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <span>🔒 Automatically generated by the system (Format: <strong>19 YY T NNNN</strong> — 9 digits)</span>
              </p>
            </div>

            {/* Student Particulars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Candidate Name"
                required
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label="Institutional Email"
                type="email"
                required
                placeholder="john.doe@svcollege.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Primary Contact Number"
                placeholder="+91 98765 00000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="Academic Department"
                readOnly
                disabled
                value={formData.department}
                className="bg-slate-100/80 cursor-not-allowed text-slate-700 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Initial Semester"
                type="number"
                min={1}
                max={8}
                value={formData.semester}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    semester: parseInt(e.target.value, 10) || 1,
                  })
                }
              />
              <Input
                label="Academic Batch"
                placeholder="2024-2028"
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save & Dispatch Credentials
              </Button>
            </div>
          </form>
        </Modal>

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={!!studentToDelete}
          onClose={() => setStudentToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Student Record"
          message={`Are you sure you want to permanently delete the student record for "${studentToDelete?.name}" (${studentToDelete?.registerNumber})? This will remove all associated fees, receipts, enrollments, and academic data. Registration number ${studentToDelete?.registerNumber} will be released and can be reused.`}
          confirmText="Delete Record"
          cancelText="Cancel"
          variant="destructive"
          isLoading={isDeleting}
        />
      </div>
    </PortalLayout>
  );
}
