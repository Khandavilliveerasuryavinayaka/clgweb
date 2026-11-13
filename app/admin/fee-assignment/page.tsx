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
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { FeeAssignment, StudentFeeAssignment } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  CreditCard, 
  Plus, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Eye, 
  Ban, 
  Layers,
  Sparkles
} from 'lucide-react';

export default function AdminFeeAssignmentPage() {
  const { user } = useAuth();
  const { success, error: toastError, warning } = useToast();

  const [assignments, setAssignments] = useState<FeeAssignment[]>(() => mockDb.getFeeAssignments());
  const [search, setSearch] = useState('');
  const [filterBatch, setFilterBatch] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  const fetchFeeAssignments = useCallback(async () => {
    try {
      const res = await fetch('/api/fee-assignments');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAssignments(json.data);
      }
    } catch (e: any) {
      console.error('Failed to load fee assignments from Supabase:', e);
    }
  }, []);

  const [departments, setDepartments] = useState<any[]>(() => mockDb.getDepartments());
  const [programs, setPrograms] = useState<any[]>(() => mockDb.getPrograms());

  useEffect(() => {
    fetchFeeAssignments();
    fetch('/api/departments')
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setDepartments(json.data);
        }
      })
      .catch(() => {});
    fetch('/api/programs')
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setPrograms(json.data);
        }
      })
      .catch(() => {});
  }, [fetchFeeAssignments]);

  // Create Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCustomType, setIsCustomType] = useState(false);
  const [customFeeType, setCustomFeeType] = useState('');
  const [isCustomBatch, setIsCustomBatch] = useState(false);
  const [customBatch, setCustomBatch] = useState('');

  const [formData, setFormData] = useState({
    feeName: '',
    feeType: 'Exam Fee',
    amount: '',
    academicYear: '2026-2027',
    batch: '2023-2027',
    programName: 'All Programs',
    departmentName: 'All Departments',
    semester: '',
    dueDate: '',
    description: '',
    status: 'Active' as 'Active' | 'Closed' | 'Inactive',
  });

  // View Details Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeAssignment | null>(null);
  const [assignedStudents, setAssignedStudents] = useState<StudentFeeAssignment[]>([]);

  // Pre-load batches from existing users
  const allUsers = mockDb.getUsers();
  const existingBatches = Array.from(
    new Set(allUsers.filter(u => u.role === 'STUDENT' && u.batch).map(u => u.batch!))
  );
  const batches = Array.from(new Set([...existingBatches, '2023-2027', '2022-2026', '2024-2028', '2025-2029'])).sort();

  const activeFeeType = isCustomType ? customFeeType.trim() : formData.feeType;
  const activeBatch = isCustomBatch ? customBatch.trim() : formData.batch;

  // Real-time duplicate check
  const isDuplicate = assignments.some(
    f =>
      f.status !== 'Inactive' &&
      f.feeType.trim().toLowerCase() === activeFeeType.toLowerCase() &&
      f.batch.trim() === activeBatch.trim() &&
      f.academicYear.trim() === formData.academicYear.trim()
  );

  const handleOpenCreateModal = () => {
    setFormData({
      feeName: '',
      feeType: 'Exam Fee',
      amount: '',
      academicYear: '2026-2027',
      batch: '2023-2027',
      programName: 'All Programs',
      departmentName: 'All Departments',
      semester: '',
      dueDate: '',
      description: '',
      status: 'Active',
    });
    setIsCustomType(false);
    setCustomFeeType('');
    setIsCustomBatch(false);
    setCustomBatch('');
    setCreateModalOpen(true);
  };

  const handleCreateFeeAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalFeeType = isCustomType ? customFeeType.trim() : formData.feeType;
    const finalBatch = isCustomBatch ? customBatch.trim() : formData.batch;

    if (!formData.feeName.trim()) {
      toastError('Please enter a descriptive Fee Name.');
      return;
    }
    if (!finalFeeType) {
      toastError('Please specify the Fee Type.');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toastError('Please enter a valid amount.');
      return;
    }
    if (!finalBatch) {
      toastError('Please specify the target Student Batch.');
      return;
    }
    if (!formData.dueDate) {
      toastError('Please set a payment Due Date.');
      return;
    }

    try {
      const res = await fetch('/api/fee-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeName: formData.feeName,
          feeType: finalFeeType,
          amount: Number(formData.amount),
          academicYear: formData.academicYear,
          batch: finalBatch,
          dueDate: formData.dueDate,
          description: formData.description || `${finalFeeType} for Batch ${finalBatch}`,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || 'Failed to create fee assignment in Supabase.');
      }

      await fetchFeeAssignments();
      setCreateModalOpen(false);
      success(
        `Fee "${formData.feeName}" (₹${Number(formData.amount).toLocaleString()}) created in Supabase and automatically assigned to Batch ${finalBatch}.`,
        'Fee Assigned in Supabase'
      );
    } catch (err: any) {
      toastError(err.message || 'Failed to create fee assignment.');
    }
  };

  const handleViewDetails = async (assignment: FeeAssignment) => {
    setSelectedFee(assignment);
    try {
      const res = await fetch(`/api/fee-assignments?id=${assignment.id}`);
      const json = await res.json();
      if (json.success && json.data?.studentAssignments) {
        setAssignedStudents(json.data.studentAssignments);
      } else {
        const students = mockDb.getStudentFeeAssignments(undefined, assignment.id);
        setAssignedStudents(students);
      }
    } catch (e) {
      const students = mockDb.getStudentFeeAssignments(undefined, assignment.id);
      setAssignedStudents(students);
    }
    setDetailsModalOpen(true);
  };

  const handleToggleStatus = async (assignment: FeeAssignment) => {
    const newStatus = assignment.status === 'Active' ? 'Closed' : 'Active';
    try {
      await fetch('/api/fee-assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignment.id, status: newStatus }),
      });
      await fetchFeeAssignments();
      success(`Fee assignment "${assignment.feeName}" is now ${newStatus}.`);
    } catch (err: any) {
      toastError(err.message);
    }
  };

  // Filtered List
  const filteredAssignments = assignments.filter((item) => {
    const matchesSearch =
      item.feeName.toLowerCase().includes(search.toLowerCase()) ||
      item.feeType.toLowerCase().includes(search.toLowerCase()) ||
      item.batch.toLowerCase().includes(search.toLowerCase());
    const matchesBatch = filterBatch === 'ALL' || item.batch === filterBatch;
    const matchesType = filterType === 'ALL' || item.feeType === filterType;
    return matchesSearch && matchesBatch && matchesType;
  });

  return (
    <PortalLayout role="ADMIN">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-700 border border-brand-500/20">
                Institutional Billing Engine
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight mt-1">
              Fee Assignment & Batch Allocation
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Configure and assign mandatory fee structures to specific student cohorts. Fees automatically associate with all eligible students within the selected academic batch.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm"
          >
            Create Fee
          </Button>
        </div>

        {/* Filter Toolbar */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <SearchInput
                placeholder="Search fee title, type, or batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-brand-500"
              >
                <option value="ALL">All Batches</option>
                {batches.map((b) => (
                  <option key={b} value={b}>Batch {b}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-brand-500"
              >
                <option value="ALL">All Fee Types</option>
                <option value="Tuition Fee">Tuition Fee</option>
                <option value="Exam Fee">Exam Fee</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Assignments Table */}
        <Card className="border-slate-200 shadow-card overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-600" />
              <CardTitle className="text-sm font-bold">Assigned Fee Manifest</CardTitle>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {filteredAssignments.length} {filteredAssignments.length === 1 ? 'Record' : 'Records'}
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-3.5">Fee Particulars</th>
                    <th className="p-3.5">Fee Type</th>
                    <th className="p-3.5">Target Batch</th>
                    <th className="p-3.5">Program & Dept</th>
                    <th className="p-3.5">Academic Year</th>
                    <th className="p-3.5 text-right">Amount (₹)</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5 text-center">Assigned</th>
                    <th className="p-3.5 text-center">Paid</th>
                    <th className="p-3.5 text-center">Pending</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-12 text-center text-slate-400">
                        <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <div className="font-bold text-slate-700 text-sm">No fee assignments found</div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Create a fee assignment to allocate tuition or exam dues to student batches.
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleOpenCreateModal}
                          leftIcon={<Plus className="w-3.5 h-3.5" />}
                          className="mt-3 text-xs"
                        >
                          Create Fee Assignment
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    filteredAssignments.map((f) => {
                      const studentList = mockDb.getStudentFeeAssignments(undefined, f.id);
                      const paidCount = studentList.filter((s) => s.status === 'Paid').length;
                      const pendingCount = studentList.length - paidCount;

                      return (
                        <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{f.feeName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Created {formatDate(f.createdAt)}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-800 border border-slate-200">
                              {f.feeType}
                            </span>
                          </td>
                          <td className="p-3.5 font-semibold text-brand-700 font-mono">
                            {f.batch}
                          </td>
                          <td className="p-3.5 text-slate-600 max-w-[160px] truncate">
                            <div className="truncate font-medium">{f.programName || 'All Programs'}</div>
                            <div className="text-[10px] text-slate-400 truncate">{f.departmentName || 'All Departments'}</div>
                          </td>
                          <td className="p-3.5 text-slate-600 font-mono">{f.academicYear}</td>
                          <td className="p-3.5 text-right font-extrabold text-slate-900">
                            {formatCurrency(f.amount)}
                          </td>
                          <td className="p-3.5 text-slate-600 font-medium">{formatDate(f.dueDate)}</td>
                          <td className="p-3.5 text-center font-bold text-slate-800">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {studentList.length}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-emerald-600">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {paidCount}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-amber-600">
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              {pendingCount}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <Badge status={f.status === 'Active' ? 'Active' : f.status === 'Closed' ? 'Cancelled' : 'Draft'}>
                              {f.status}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2"
                              onClick={() => handleViewDetails(f)}
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className={`h-7 text-xs px-2 ${f.status === 'Active' ? 'text-rose-700 border-rose-200 hover:bg-rose-50' : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'}`}
                              onClick={() => handleToggleStatus(f)}
                            >
                              {f.status === 'Active' ? 'Close' : 'Reactivate'}
                            </Button>
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

        {/* Create Fee Modal */}
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create & Assign Fee to Student Batch"
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateFeeAssignment} className="space-y-4 text-xs">
            {/* Real-time duplicate warning banner */}
            {isDuplicate && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold">Duplicate Fee Assignment Alert</div>
                  <div className="text-[11px] leading-relaxed">
                    A fee assignment for <strong>{activeFeeType}</strong> targeting Batch <strong>{activeBatch}</strong> in Academic Year <strong>{formData.academicYear}</strong> already exists. Duplicate assignment is strictly prohibited.
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fee Name */}
              <div className="md:col-span-2 space-y-1">
                <label className="font-semibold text-slate-700">Fee Particulars Name *</label>
                <Input
                  required
                  placeholder="e.g. End-Semester Examination Fee"
                  value={formData.feeName}
                  onChange={(e) => setFormData({ ...formData, feeName: e.target.value })}
                />
              </div>

              {/* Fee Type */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Fee Type *</label>
                {!isCustomType ? (
                  <div className="space-y-1.5">
                    <select
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-brand-500"
                      value={formData.feeType}
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setIsCustomType(true);
                          setCustomFeeType('');
                        } else {
                          setFormData({ ...formData, feeType: e.target.value });
                        }
                      }}
                    >
                      <option value="Exam Fee">Exam Fee</option>
                      <option value="Tuition Fee">Tuition Fee</option>
                      <option value="Laboratory Access Fee">Laboratory Access Fee</option>
                      <option value="Library Fee">Library Fee</option>
                      <option value="Hostel Fee">Hostel Fee</option>
                      <option value="__CUSTOM__">+ Add Custom Fee Type...</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      autoFocus
                      placeholder="Enter custom fee type"
                      value={customFeeType}
                      onChange={(e) => setCustomFeeType(e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsCustomType(false);
                        setFormData({ ...formData, feeType: 'Exam Fee' });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Amount (INR ₹) *</label>
                <Input
                  type="number"
                  required
                  min="1"
                  step="1"
                  placeholder="e.g. 5000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              {/* Target Batch (CRITICAL) */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Target Student Batch *
                  <span className="text-[10px] text-slate-400 font-normal ml-1">(auto-assigned to this cohort)</span>
                </label>
                {!isCustomBatch ? (
                  <select
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-brand-500 font-mono"
                    value={formData.batch}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM_BATCH__') {
                        setIsCustomBatch(true);
                        setCustomBatch('');
                      } else {
                        setFormData({ ...formData, batch: e.target.value });
                      }
                    }}
                  >
                    {batches.map((b) => (
                      <option key={b} value={b}>Batch {b}</option>
                    ))}
                    <option value="__CUSTOM_BATCH__">+ Add New Batch...</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      autoFocus
                      placeholder="e.g. 2023-2027"
                      value={customBatch}
                      onChange={(e) => setCustomBatch(e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsCustomBatch(false);
                        setFormData({ ...formData, batch: '2023-2027' });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Academic Year */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Academic Year *</label>
                <select
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-brand-500 font-mono"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                >
                  <option value="2026-2027">2026-2027</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
                </select>
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Payment Due Date *</label>
                <Input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Status</label>
                <select
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-brand-500"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Program filter (optional) */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Program Scope</label>
                <select
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-brand-500"
                  value={formData.programName}
                  onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
                >
                  <option value="All Programs">All Programs</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Department filter (optional) */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Department Scope</label>
                <select
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-brand-500"
                  value={formData.departmentName}
                  onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                >
                  <option value="All Departments">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2 space-y-1">
                <label className="font-semibold text-slate-700">Description / Fee Directive</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-brand-500"
                  placeholder="Official instructions or circular reference for students..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* Workflow Notice */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px] space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                Automatic Cohort Assignment Policy:
              </div>
              <p>
                Saving this fee immediately generates individual fee records for all verified students in <strong>Batch {activeBatch}</strong>. Eligible students can view and clear this fee directly inside their Student Portal.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isDuplicate}
                className={isDuplicate ? 'opacity-50 cursor-not-allowed' : ''}
              >
                Assign Fee to Batch
              </Button>
            </div>
          </form>
        </Modal>

        {/* Fee Details & Assigned Students Modal */}
        {selectedFee && (
          <Modal
            isOpen={detailsModalOpen}
            onClose={() => setDetailsModalOpen(false)}
            title={`Fee Specification: ${selectedFee.feeName}`}
            maxWidth="4xl"
          >
            <div className="space-y-5 text-xs">
              {/* Fee Information Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Fee Type</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedFee.feeType}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Amount</div>
                  <div className="font-extrabold text-emerald-700 text-sm mt-0.5">
                    {formatCurrency(selectedFee.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Target Batch</div>
                  <div className="font-bold text-brand-700 font-mono mt-0.5">{selectedFee.batch}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Academic Year</div>
                  <div className="font-mono text-slate-700 mt-0.5">{selectedFee.academicYear}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Program Scope</div>
                  <div className="font-medium text-slate-800 mt-0.5 truncate">{selectedFee.programName || 'All Programs'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Department</div>
                  <div className="font-medium text-slate-800 mt-0.5 truncate">{selectedFee.departmentName || 'All Departments'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Due Date</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{formatDate(selectedFee.dueDate)}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Current Status</div>
                  <div className="mt-0.5">
                    <Badge status={selectedFee.status === 'Active' ? 'Active' : 'Cancelled'}>{selectedFee.status}</Badge>
                  </div>
                </div>
              </div>

              {/* Student Reconciliation KPIs */}
              {(() => {
                const total = assignedStudents.length;
                const paid = assignedStudents.filter(s => s.status === 'Paid').length;
                const pending = total - paid;
                const isOverdue = new Date(selectedFee.dueDate) < new Date();
                const overdue = isOverdue ? pending : 0;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Assigned</div>
                      <div className="text-xl font-extrabold text-slate-900 mt-1">{total}</div>
                      <div className="text-[10px] text-slate-400">Batch {selectedFee.batch}</div>
                    </div>
                    <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                      <div className="text-[10px] text-emerald-800 font-semibold uppercase">Paid Count</div>
                      <div className="text-xl font-extrabold text-emerald-700 mt-1">{paid}</div>
                      <div className="text-[10px] text-emerald-600 font-medium">Reconciled</div>
                    </div>
                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                      <div className="text-[10px] text-amber-800 font-semibold uppercase">Pending Count</div>
                      <div className="text-xl font-extrabold text-amber-700 mt-1">{pending}</div>
                      <div className="text-[10px] text-amber-600 font-medium">Awaiting Payment</div>
                    </div>
                    <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50">
                      <div className="text-[10px] text-rose-800 font-semibold uppercase">Overdue</div>
                      <div className="text-xl font-extrabold text-rose-700 mt-1">{overdue}</div>
                      <div className="text-[10px] text-rose-600 font-medium">{isOverdue ? 'Past Due Date' : 'Within Term'}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Student Manifest Table */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Assigned Student Cohort ({assignedStudents.length})</span>
                  <span className="text-[11px] text-slate-500 font-normal">Private payment details strictly masked</span>
                </div>
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {assignedStudents.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      No students currently registered under Batch {selectedFee.batch}.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 font-semibold text-slate-600 sticky top-0">
                        <tr>
                          <th className="p-3">Register No</th>
                          <th className="p-3">Scholar Name</th>
                          <th className="p-3 text-right">Fee Dues</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Settlement Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {assignedStudents.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/60">
                            <td className="p-3 font-mono font-bold text-brand-700">{s.registerNumber}</td>
                            <td className="p-3 font-medium text-slate-900">{s.studentName}</td>
                            <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(s.amount)}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  s.status === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {s.status}
                              </span>
                            </td>
                            <td className="p-3 text-right text-slate-500">
                              {s.paidAt ? formatDate(s.paidAt) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <Button size="sm" variant="outline" onClick={() => setDetailsModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </PortalLayout>
  );
}
