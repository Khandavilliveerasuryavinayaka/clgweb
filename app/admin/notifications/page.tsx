'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea, Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { Bell, Send, Plus, Users } from 'lucide-react';

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [notifications, setNotifications] = useState(() => mockDb.getNotifications(undefined, 'ADMIN'));
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipientRole: 'ALL' as any,
    category: 'System' as any,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sv_college_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((item: any) => {
            if (!mockDb.getNotifications(undefined, 'ADMIN').some(n => n.id === item.id)) {
              mockDb.addNotification(item);
            }
          });
          setNotifications([...mockDb.getNotifications(undefined, 'ADMIN')]);
        }
      }
    } catch (_) {}
  }, []);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toastError('Please complete message title and body.');
      return;
    }

    const createdNotif = mockDb.addNotification({
      title: formData.title.trim(),
      message: formData.message.trim(),
      recipientRole: formData.recipientRole,
      category: formData.category,
    });

    const updated = mockDb.getNotifications(undefined, 'ADMIN');
    setNotifications([...updated]);
    try {
      localStorage.setItem('sv_college_notifications', JSON.stringify(updated));
    } catch (_) {}

    setModalOpen(false);
    setFormData({ title: '', message: '', recipientRole: 'ALL', category: 'System' });

    mockDb.addAuditLog(
      user?.id || 'usr-admin-1',
      user?.name || 'Dr. K. S. Ramanathan',
      'ADMIN',
      'NOTIFICATION_BROADCAST',
      'Notification',
      createdNotif.id,
      `Broadcast notification "${createdNotif.title}" to target group: ${createdNotif.recipientRole}`
    );

    success('Institutional broadcast notification dispatched to portals.', 'Broadcast Sent');
  };

  return (
    <PortalLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Institutional Circulars & Broadcasts
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Dispatch multi-channel announcements to Students, Faculty, or institution-wide feeds.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create New Broadcast
          </Button>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className="border-slate-200">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-navy-900">{n.title}</h4>
                    <Badge variant="neutral" className="text-[10px]">{n.category}</Badge>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-mono">
                      Target: {n.recipientRole || 'ALL'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{n.message}</p>
                  <div className="text-[10px] text-slate-400">{formatDate(n.createdAt)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Compose Institutional Broadcast"
          maxWidth="md"
        >
          <form onSubmit={handleBroadcast} className="space-y-4">
            <Input
              label="Notification Headline / Title"
              required
              placeholder="e.g. Schedule for End-Semester Practical Assessments"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Target Recipient Audience"
                value={formData.recipientRole}
                onChange={(e) => setFormData({ ...formData, recipientRole: e.target.value as any })}
                options={[
                  { label: 'All Campus (Students & Faculty)', value: 'ALL' },
                  { label: 'Students Only', value: 'STUDENT' },
                  { label: 'Faculty Members Only', value: 'FACULTY' },
                ]}
              />

              <Select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                options={[
                  { label: 'Academic Notice', value: 'Academic' },
                  { label: 'Registration Window', value: 'Registration' },
                  { label: 'Results Gazette', value: 'Result' },
                  { label: 'Fee Circular', value: 'Fee' },
                  { label: 'System Notice', value: 'System' },
                ]}
              />
            </div>

            <Textarea
              label="Official Circular Text"
              required
              rows={4}
              placeholder="Full announcement body for recipient dashboards..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Send className="w-4 h-4" />}>
                Dispatch Broadcast
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
