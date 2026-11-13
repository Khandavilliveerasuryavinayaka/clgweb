'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import { FolderGit2, Plus, GraduationCap, Loader2 } from 'lucide-react';
import { Program } from '@/types';

export default function AdminProgramsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    degree: 'B.Tech' as any,
    departmentId: '1',
    durationYears: 4,
    totalSemesters: 8,
    creditsRequired: 160,
    annualFee: 120000,
    eligibility: '10+2 with 60% in PCM',
    description: 'Degree curriculum overview',
  });

  const fetchPrograms = useCallback(async () => {
    try {
      setIsLoading(true);
      const [progRes, deptRes] = await Promise.all([
        fetch('/api/programs'),
        fetch('/api/departments'),
      ]);
      const progJson = await progRes.json();
      const deptJson = await deptRes.json();

      if (progJson.success && Array.isArray(progJson.data)) {
        setPrograms(progJson.data);
      }
      if (deptJson.success && Array.isArray(deptJson.data)) {
        setDepartments(deptJson.data);
        if (deptJson.data.length > 0) {
          setFormData(prev => ({ ...prev, departmentId: String(deptJson.data[0].id) }));
        }
      }
    } catch (e: any) {
      console.error('Failed to load programs or departments from Supabase:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      toastError('Program Code and Name are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          degree: formData.degree,
          departmentId: Number(formData.departmentId),
          durationYears: Number(formData.durationYears),
          totalSemesters: Number(formData.totalSemesters),
          creditsRequired: Number(formData.creditsRequired),
          annualFee: Number(formData.annualFee),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || 'Failed to create program in Supabase.');
      }

      await fetchPrograms();
      setCreateModalOpen(false);
      success(`Degree program ${formData.name} added to Supabase.`, 'Program Created in Supabase');
    } catch (err: any) {
      toastError(err.message || 'Failed to create program.');
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
              Degree Programs & Academic Curricula
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure undergraduate and postgraduate degree specifications, credit graduation caps, and fee rates.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Degree Program
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programs.map((prog, idx) => (
            <Card key={prog.id} className="border-slate-200 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-xs px-2.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                      {prog.degree} Track
                    </span>
                    <span className="font-mono text-xs text-slate-400 ml-2">Code: {prog.code} - {prog.programNumber ?? idx + 1}</span>
                    <h3 className="font-bold text-base text-navy-900 mt-1.5 leading-snug">{prog.name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-brand-700">{formatCurrency(prog.annualFee)}</div>
                    <div className="text-[10px] text-slate-400">Annual Tuition</div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{prog.description}</p>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Duration</div>
                    <div className="font-bold text-slate-800">{prog.durationYears} Years</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Semesters</div>
                    <div className="font-bold text-slate-800">{prog.totalSemesters} Terms</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Required Credits</div>
                    <div className="font-bold text-brand-600">{prog.creditsRequired} Cr</div>
                  </div>
                </div>
              </CardContent>

              <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-between text-xs text-slate-500">
                <span>Dept: {prog.departmentName}</span>
                <span className="font-semibold text-brand-600">Active Curriculum</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Modal */}
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Add New Degree Program"
          maxWidth="md"
        >
          <form onSubmit={handleCreateProgram} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Program Code"
                required
                placeholder="e.g. BTECH-AI"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
              <Select
                label="Degree Award"
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value as any })}
                options={[
                  { label: 'B.Tech', value: 'B.Tech' },
                  { label: 'M.Tech', value: 'M.Tech' },
                  { label: 'MBA', value: 'MBA' },
                ]}
              />
            </div>

            <Input
              label="Program Full Title"
              required
              placeholder="e.g. B.Tech in Artificial Intelligence"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <Select
              label="Department Allocation"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              options={
                departments.length > 0
                  ? departments.map((d) => ({
                      label: `${d.name} (${d.code})`,
                      value: String(d.id),
                    }))
                  : [
                      { label: 'Computer Science and Engineering (CSE)', value: '1' },
                      { label: 'Electronics and Communication (ECE)', value: '2' },
                    ]
              }
            />

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Years"
                type="number"
                value={formData.durationYears}
                onChange={(e) => setFormData({ ...formData, durationYears: Number(e.target.value) })}
              />
              <Input
                label="Semesters"
                type="number"
                value={formData.totalSemesters}
                onChange={(e) => setFormData({ ...formData, totalSemesters: Number(e.target.value) })}
              />
              <Input
                label="Credits Cap"
                type="number"
                value={formData.creditsRequired}
                onChange={(e) => setFormData({ ...formData, creditsRequired: Number(e.target.value) })}
              />
            </div>

            <Input
              label="Annual Tuition Rate (INR)"
              type="number"
              value={formData.annualFee}
              onChange={(e) => setFormData({ ...formData, annualFee: Number(e.target.value) })}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Degree Program
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
