'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { Calendar, Plus, ToggleLeft, ToggleRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AdminCourseRegistrationPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [periods, setPeriods] = useState(() => mockDb.getRegistrationPeriods());
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: 'Spring 2025 Semester Registration Window',
    academicYear: '2024-2025',
    semester: 6,
    startDate: '2025-01-05',
    endDate: '2025-02-15',
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sv_college_registration_periods');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPeriods(parsed);
          mockDb.getRegistrationPeriods().length = 0;
          parsed.forEach((p: any) => mockDb.getRegistrationPeriods().push(p));
        }
      }
    } catch (e) {}
  }, []);

  const togglePeriodStatus = (id: string) => {
    const target = periods.find((p) => p.id === id);
    if (target) {
      target.isActive = !target.isActive;
      const mTarget = mockDb.getRegistrationPeriods().find(p => p.id === id);
      if (mTarget) {
        mTarget.isActive = target.isActive;
      }
      const updated = [...periods];
      setPeriods(updated);
      try {
        localStorage.setItem('sv_college_registration_periods', JSON.stringify(updated));
      } catch (e) {}
      mockDb.addAuditLog(
        user?.id || 'usr-admin-1',
        user?.name || 'Dr. K. S. Ramanathan',
        'ADMIN',
        target.isActive ? 'REGISTRATION_WINDOW_OPENED' : 'REGISTRATION_WINDOW_CLOSED',
        'RegistrationPeriod',
        target.id,
        `${target.isActive ? 'Opened' : 'Closed'} registration period ${target.title}`
      );
      success(
        `Registration period is now ${target.isActive ? 'ACTIVE' : 'CLOSED'}.`,
        'Window State Toggled'
      );
    }
  };

  const handleCreatePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    const newP = {
      id: `reg-p-${Date.now()}`,
      title: formData.title,
      academicYear: formData.academicYear,
      semester: Number(formData.semester),
      startDate: formData.startDate,
      endDate: formData.endDate,
      isActive: true,
      eligiblePrograms: ['BTECH-CSE', 'BTECH-ECE', 'BTECH-ME'],
    };
    mockDb.getRegistrationPeriods().push(newP);
    const updated = [...mockDb.getRegistrationPeriods()];
    setPeriods(updated);
    try {
      localStorage.setItem('sv_college_registration_periods', JSON.stringify(updated));
    } catch (e) {}
    setModalOpen(false);
    success(`Launched registration period: ${newP.title}`, 'Registration Window Created');
  };

  return (
    <PortalLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Course Registration Windows & Governance
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Control when students are permitted to submit course selections.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Launch New Window
          </Button>
        </div>

        <div className="space-y-4">
          {periods.map((p) => (
            <Card key={p.id} className="border-slate-200 shadow-card">
              <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge status={p.isActive ? 'Active' : 'Cancelled'}>
                      {p.isActive ? 'WINDOW OPEN' : 'WINDOW CLOSED'}
                    </Badge>
                    <span className="text-xs font-mono text-slate-400">Term: {p.academicYear} (Sem {p.semester})</span>
                  </div>
                  <h3 className="text-lg font-bold text-navy-900">{p.title}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-4">
                    <span>Opening: <strong>{formatDate(p.startDate)}</strong></span>
                    <span>•</span>
                    <span>Deadline: <strong>{formatDate(p.endDate)}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant={p.isActive ? 'destructive' : 'success'}
                    onClick={() => togglePeriodStatus(p.id)}
                  >
                    {p.isActive ? 'Close Registration Window' : 'Re-open Window'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Launch Course Registration Window"
          maxWidth="md"
        >
          <form onSubmit={handleCreatePeriod} className="space-y-4">
            <Input
              label="Window Title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Academic Year"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              />
              <Input
                label="Semester"
                type="number"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Opening Date"
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <Input
                label="Closing Deadline"
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Launch Window
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
