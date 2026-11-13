'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { Bell, CheckCheck, Clock, BookOpen, CreditCard, Award, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function StudentNotificationsPage() {
  const { user } = useAuth();
  const studentId = user?.id || 'usr-stu-1';

  const [filter, setFilter] = useState('ALL');
  const [notifications, setNotifications] = useState(() => mockDb.getNotifications(studentId, 'STUDENT'));

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sv_college_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((item: any) => {
            if (!mockDb.getNotifications(studentId, 'STUDENT').some(n => n.id === item.id)) {
              mockDb.addNotification(item);
            }
          });
          setNotifications(mockDb.getNotifications(studentId, 'STUDENT'));
        }
      }
    } catch (_) {}
  }, [studentId]);

  const filtered = notifications.filter((n) => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !n.isRead;
    return n.category === filter;
  });

  const handleMarkAllRead = () => {
    notifications.forEach((n) => mockDb.markNotificationRead(n.id));
    setNotifications([...mockDb.getNotifications(studentId, 'STUDENT')]);
  };

  return (
    <PortalLayout role="STUDENT">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Academic & System Notifications
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Personalized alerts regarding course approvals, OD requests, results publication, and fees.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            leftIcon={<CheckCheck className="w-4 h-4 text-brand-600" />}
          >
            Mark All as Read
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {['ALL', 'UNREAD', 'Registration', 'OD', 'Result', 'Fee', 'System'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'All Alerts' : cat}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="p-12 text-center text-xs text-slate-400">
                No notifications match your current filter.
              </CardContent>
            </Card>
          ) : (
            filtered.map((n) => (
              <Card
                key={n.id}
                className={`border transition-all ${
                  !n.isRead ? 'border-brand-200 bg-brand-50/20 shadow-sm' : 'border-slate-200 bg-white'
                }`}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-navy-900">{n.title}</h4>
                      <Badge variant="neutral" className="text-[10px]">
                        {n.category}
                      </Badge>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{n.message}</p>
                    <div className="text-[10px] text-slate-400 pt-0.5">{formatDate(n.createdAt)}</div>
                  </div>

                  {n.link && (
                    <Link href={n.link} className="shrink-0">
                      <Button size="sm" variant="outline" className="h-8 text-xs">
                        Open Module
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
