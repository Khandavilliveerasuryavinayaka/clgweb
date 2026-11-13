'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { Bell, CheckCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function FacultyNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(() => mockDb.getNotifications(user?.id, 'FACULTY'));

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sv_college_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((item: any) => {
            mockDb.addNotification(item);
          });
          setNotifications(mockDb.getNotifications(user?.id, 'FACULTY'));
        }
      }
    } catch (_) {}
  }, [user?.id]);

  return (
    <PortalLayout role="FACULTY">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Faculty Administrative Notifications
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Academic circulars, OD approvals, and marks submission reminders.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className="border-slate-200">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-navy-900">{n.title}</h4>
                    <Badge variant="neutral" className="text-[10px]">{n.category}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <div className="text-[10px] text-slate-400">{formatDate(n.createdAt)}</div>
                </div>
                {n.link && (
                  <Link href={n.link}>
                    <Button size="sm" variant="outline" className="h-8 text-xs">
                      View Module →
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
