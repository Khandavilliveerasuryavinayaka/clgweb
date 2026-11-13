'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Building2, Plus, Users, GraduationCap, Loader2 } from 'lucide-react';
import { Department } from '@/types';

export default function AdminDepartmentsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    hodName: '',
  });

  const fetchDepartments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/departments');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDepartments(json.data);
      }
    } catch (e: any) {
      console.error('Failed to load departments from Supabase:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      toastError('Department Code and Name are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || 'Failed to create department in Supabase.');
      }

      await fetchDepartments();
      setCreateModalOpen(false);
      setFormData({ code: '', name: '', description: '', hodName: '' });
      success(`Department ${formData.name} established in Supabase.`, 'Department Created in Supabase');
    } catch (err: any) {
      toastError(err.message || 'Failed to create department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PortalLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Academic Departments Administration
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure engineering and management departments, assign HOD leadership, and manage capacity.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Department
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Card key={dept.id} className="border-slate-200 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-xs px-2.5 py-1 rounded bg-brand-50 text-brand-700 border border-brand-200 font-mono">
                    {dept.code}
                  </span>
                  <Badge status="Active">Established {dept.establishedYear}</Badge>
                </div>

                <h3 className="font-bold text-base text-navy-900 leading-snug">{dept.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{dept.description}</p>

                <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Head of Department:</span>
                    <span className="font-semibold text-slate-800">{dept.hodName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Faculty Strength:</span>
                    <span className="font-bold text-brand-700">{dept.facultyCount} Scholars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Student Capacity:</span>
                    <span className="font-semibold text-slate-800">{dept.studentCount} Students</span>
                  </div>
                </div>
              </CardContent>

              <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex justify-end">
                <Link href="/admin/programs">
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                    Manage Curriculum
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Modal */}
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Establish Academic Department"
          maxWidth="md"
        >
          <form onSubmit={handleCreateDept} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Department Code"
                required
                placeholder="e.g. AI-DS"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
              <Input
                label="Head of Department"
                required
                placeholder="e.g. Dr. Ramesh Chander"
                value={formData.hodName}
                onChange={(e) => setFormData({ ...formData, hodName: e.target.value })}
              />
            </div>

            <Input
              label="Department Full Title"
              required
              placeholder="e.g. Artificial Intelligence & Data Science"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <Input
              label="Mission Summary"
              required
              placeholder="Brief academic specialization description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Department
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
