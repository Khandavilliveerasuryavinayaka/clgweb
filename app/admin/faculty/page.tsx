'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, SearchInput } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { User } from '@/types';
import { Users, Plus, ShieldCheck, Mail, Phone, BookOpen, Loader2, Lock, Trash2 } from 'lucide-react';

export default function AdminFacultyPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [facultyMembers, setFacultyMembers] = useState<User[]>([]);

  // Auto-generated Faculty ID state
  const [autoFacId, setAutoFacId] = useState('');
  const [isGeneratingFacId, setIsGeneratingFacId] = useState(false);

  // Deletion state
  const [facultyToDelete, setFacultyToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [departments, setDepartments] = useState<any[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    department: 'Computer Science and Engineering',
  });
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Computer Science and Engineering',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateGeneratedFacId = useCallback(async () => {
    setIsGeneratingFacId(true);
    try {
      const res = await fetch('/api/faculty/fac-id', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data?.facId) {
        setAutoFacId(json.data.facId);
      }
    } catch (e) {
      console.error('Error fetching preview faculty ID:', e);
    } finally {
      setIsGeneratingFacId(false);
    }
  }, []);

  const fetchFaculty = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/faculty', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setFacultyMembers(json.data);
      }
    } catch (e: any) {
      console.error('Failed to load faculty from Supabase:', e);
      toastError('Could not load faculty list from Supabase.');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchFaculty();
    fetch('/api/departments')
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setDepartments(json.data);
        }
      })
      .catch(() => {});
  }, [fetchFaculty]);

  useEffect(() => {
    if (createModalOpen) {
      updateGeneratedFacId();
    }
  }, [createModalOpen, updateGeneratedFacId]);

  const handleUpdateFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setIsEditing(true);

    setFacultyMembers(prev =>
      prev.map(f =>
        f.id === editingFaculty.id
          ? { ...f, name: editFormData.name.trim(), phone: editFormData.phone.trim(), department: editFormData.department }
          : f
      )
    );

    setIsEditing(false);
    setEditModalOpen(false);
    success(`Profile particulars updated for ${editFormData.name}.`, 'Faculty Profile Updated');
  };

  const filtered = facultyMembers.filter(
    (f) =>
      s(f.name).includes(search.toLowerCase()) ||
      s(f.registerNumber).includes(search.toLowerCase()) ||
      (f.department && s(f.department).includes(search.toLowerCase()))
  );

  function s(val?: string) {
    return (val || '').toLowerCase();
  }

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toastError('Please fill in candidate name and institutional email.');
      return;
    }

    const assignedId = autoFacId.trim();
    if (!assignedId || !/^FAC[0-9]{3,}$/.test(assignedId)) {
      toastError('Faculty ID must be in the format FAC001, FAC002, etc.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registerNumber: assignedId,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          department: formData.department,
          designation: 'Associate Professor',
          qualification: 'Ph.D in Computer Science',
          password: 'staff',
          adminUserId: user?.id,
          adminName: user?.name,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || 'Failed to appoint faculty member.');
      }

      await fetchFaculty();
      setIsSubmitting(false);
      setCreateModalOpen(false);
      const appointedName = formData.name;
      const appointedId = json.data?.registerNumber || assignedId;
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: 'Computer Science and Engineering',
      });
      success(
        `Faculty member ${appointedName} appointed with Staff ID ${appointedId}. Initial temporary password is "staff".`,
        'Faculty Appointed & Registered'
      );
    } catch (err: any) {
      setIsSubmitting(false);
      toastError(err.message || 'Failed to appoint faculty member.');
    }
  };

  const handleDeleteFaculty = async () => {
    if (!facultyToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/faculty?id=${encodeURIComponent(facultyToDelete.id)}&reg=${encodeURIComponent(facultyToDelete.registerNumber)}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || 'Failed to delete faculty member.');
      }
      success(
        `Faculty member ${facultyToDelete.name} (${facultyToDelete.registerNumber}) deleted successfully. Staff ID is released and available for reuse.`,
        'Faculty Record Removed'
      );
      setFacultyToDelete(null);
      await fetchFaculty();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete faculty member.');
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
              Faculty & Academic Staff Management
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Appoint professors, assign department heads, and manage course instructional allocations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-64">
              <SearchInput
                placeholder="Search by faculty name or ID..."
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
              Appoint Faculty
            </Button>
          </div>
        </div>

        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">
              Teaching Faculty Directory ({filtered.length} Members)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4">Faculty Member</th>
                    <th className="p-4">Staff ID</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Contact Phone</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                          <span>Loading faculty registry from Supabase...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No faculty members found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/60">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={f.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'}
                              alt={f.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{f.name}</div>
                              <div className="text-[11px] text-slate-400">{f.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-brand-700">
                          <div>{f.registerNumber}</div>
                          {(f.facultyNumber || f.appId) && (
                            <div className="text-[10px] text-slate-400 font-normal">ID: #{f.facultyNumber || f.appId}</div>
                          )}
                        </td>
                        <td className="p-4 font-semibold text-slate-800">{f.department}</td>
                        <td className="p-4 text-slate-600">{f.phone || '+91 98765 00000'}</td>
                        <td className="p-4">
                          <Badge status={f.accountStatus}>{f.accountStatus}</Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2.5"
                              onClick={() => {
                                setEditingFaculty(f);
                                setEditFormData({
                                  name: f.name,
                                  phone: f.phone || '',
                                  department: f.department || 'Computer Science and Engineering',
                                });
                                setEditModalOpen(true);
                              }}
                            >
                              Edit Profile
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFacultyToDelete(f)}
                              title="Permanently delete faculty record"
                              className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Appoint Faculty Modal */}
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Appoint New Faculty Member"
          maxWidth="md"
        >
          <form onSubmit={handleCreateFaculty} className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
              <span className="font-bold">Initial Security Credentials:</span> The faculty member&apos;s initial temporary password will be <strong className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-blue-950">staff</strong>. Faculty will change credentials upon first login.
            </div>

            {/* Auto-Generated Faculty ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Staff / Faculty ID
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  disabled
                  readOnly
                  value={isGeneratingFacId ? 'Calculating next sequence...' : autoFacId}
                  className="w-full rounded-lg border border-slate-300 bg-slate-100/90 px-3.5 py-2.5 text-sm font-mono font-bold text-navy-900 tracking-wider cursor-not-allowed select-none shadow-sm pr-36"
                />
                <div className="absolute right-3 flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-md">
                  <Lock className="w-3.5 h-3.5 text-brand-600" />
                  <span>Auto-generated</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                🔒 Automatically generated sequential Faculty ID (Format: <strong>FAC001, FAC002...</strong> — Released IDs are reused automatically)
              </p>
            </div>

            <Input
              label="Professor Full Name"
              required
              placeholder="e.g. Dr. Malini Subramanian"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Institutional Email"
                type="email"
                required
                placeholder="malini.subramanian@svcollege.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Contact Phone"
                placeholder="+91 98765 00000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <Select
              label="Department Allocation"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              options={
                departments.length > 0
                  ? departments.map((d) => ({ label: d.name, value: d.name }))
                  : [
                      { label: 'Computer Science and Engineering', value: 'Computer Science and Engineering' },
                      { label: 'Electronics and Communication', value: 'Electronics and Communication' },
                      { label: 'Mechanical Engineering', value: 'Mechanical Engineering' },
                    ]
              }
            />

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
                Save Appointment
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Faculty Profile Modal */}
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit Profile: ${editingFaculty?.registerNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleUpdateFaculty} className="space-y-4">
            <Input
              label="Faculty Full Name"
              required
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            />

            <Input
              label="Contact Phone"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
            />

            <Select
              label="Department Allocation"
              value={editFormData.department}
              onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
              options={
                departments.length > 0
                  ? departments.map((d) => ({ label: d.name, value: d.name }))
                  : [
                      { label: 'Computer Science and Engineering', value: 'Computer Science and Engineering' },
                      { label: 'Electronics and Communication', value: 'Electronics and Communication' },
                    ]
              }
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isEditing}>
                Update Particulars
              </Button>
            </div>
          </form>
        </Modal>

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={!!facultyToDelete}
          onClose={() => setFacultyToDelete(null)}
          onConfirm={handleDeleteFaculty}
          title="Delete Faculty Member"
          message={`Are you sure you want to permanently delete faculty member "${facultyToDelete?.name}" (${facultyToDelete?.registerNumber})? All course allocations and teaching records will be detached. Staff ID ${facultyToDelete?.registerNumber} will be released and can be reused.`}
          confirmText="Delete Record"
          cancelText="Cancel"
          variant="destructive"
          isLoading={isDeleting}
        />
      </div>
    </PortalLayout>
  );
}
