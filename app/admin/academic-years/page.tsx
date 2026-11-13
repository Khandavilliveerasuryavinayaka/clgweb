'use client';

import React, { useState } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Layers, Plus, Calendar } from 'lucide-react';

export default function AdminAcademicYearsPage() {
  const { success, error: toastError } = useToast();

  const [years, setYears] = useState([
    { id: 'ay-1', year: '2024–2025', status: 'Active', terms: 'Odd & Even Semesters', start: 'July 2024', end: 'June 2025' },
    { id: 'ay-2', year: '2023–2024', status: 'Completed', terms: 'Concluded Session', start: 'July 2023', end: 'June 2024' },
    { id: 'ay-3', year: '2025–2026', status: 'Pending', terms: 'Admissions Staged', start: 'July 2025', end: 'June 2026' },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    year: '2026–2027',
    status: 'Pending',
    terms: 'Odd & Even Semesters',
    start: 'July 2026',
    end: 'June 2027',
  });

  const handleAddYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.year.trim()) {
      toastError('Please enter a valid academic session year.');
      return;
    }

    const newYear = {
      id: `ay-${Date.now()}`,
      year: formData.year.trim(),
      status: formData.status,
      terms: formData.terms.trim(),
      start: formData.start.trim(),
      end: formData.end.trim(),
    };

    setYears(prev => [newYear, ...prev]);
    setModalOpen(false);
    success(`Academic session ${newYear.year} staged and registered.`, 'Academic Year Created');
  };

  return (
    <PortalLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Academic Calendar & Term Years
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure institutional calendar sessions, batch intakes, and academic duration cycles.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Academic Year
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {years.map((y) => (
            <Card key={y.id} className="border-slate-200 shadow-card">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-navy-900">{y.year}</h3>
                  <Badge status={y.status}>{y.status}</Badge>
                </div>
                <div className="text-xs text-slate-600 font-medium">{y.terms}</div>
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                  <div>Commencement: {y.start}</div>
                  <div>Conclusion: {y.end}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal: Add Academic Year */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Add New Academic Calendar Year"
          maxWidth="md"
        >
          <form onSubmit={handleAddYear} className="space-y-4">
            <Input
              label="Academic Year Range"
              required
              placeholder="e.g. 2026–2027"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            />

            <Select
              label="Session Operational Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { label: 'Active (Current Calendar)', value: 'Active' },
                { label: 'Pending (Upcoming Admissions)', value: 'Pending' },
                { label: 'Completed (Archived)', value: 'Completed' },
              ]}
            />

            <Input
              label="Terms / Semesters Description"
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Commencement Month"
                value={formData.start}
                onChange={(e) => setFormData({ ...formData, start: e.target.value })}
              />
              <Input
                label="Conclusion Month"
                value={formData.end}
                onChange={(e) => setFormData({ ...formData, end: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Academic Year
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
