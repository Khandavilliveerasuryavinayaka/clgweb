'use client';

import React, { useState } from 'react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/Input';
import { Bell, Calendar, Download, FileText, ArrowRight, Tag } from 'lucide-react';

interface NoticeItem {
  id: string;
  title: string;
  category: 'Academic' | 'Examination' | 'Registration' | 'Administration';
  date: string;
  referenceNo: string;
  summary: string;
  isUrgent?: boolean;
}

const initialNotices: NoticeItem[] = [
  {
    id: 'not-1',
    title: 'Spring 2025 Semester Course Registration Guidelines & Deadlines',
    category: 'Registration',
    date: '2025-01-05',
    referenceNo: 'SVC/ACAD/2025/004',
    summary: 'All eligible students in semesters 4, 6, and 8 must complete online elective registration via the Student Portal by Feb 15, 2025.',
    isUrgent: true,
  },
  {
    id: 'not-2',
    title: 'Schedule for Continuous Internal Assessment (CIA-2) Examinations',
    category: 'Examination',
    date: '2025-01-20',
    referenceNo: 'SVC/EXAM/2025/012',
    summary: 'The second cycle of internal assessments for B.Tech programs will commence from March 03, 2025. Timetable is appended.',
    isUrgent: false,
  },
  {
    id: 'not-3',
    title: 'Circulation on Mandatory Attendance Criteria & On-Duty (OD) Protocols',
    category: 'Academic',
    date: '2025-01-12',
    referenceNo: 'SVC/REG/2025/008',
    summary: 'Students must maintain a minimum of 75% attendance in each course. Approved OD certificates must be submitted within 3 days of event completion.',
    isUrgent: true,
  },
  {
    id: 'not-4',
    title: 'Semester 6 Tuition & Lab Maintenance Fee Re-conciliation Deadline',
    category: 'Administration',
    date: '2025-02-01',
    referenceNo: 'SVC/FIN/2025/019',
    summary: 'Last date for clearing outstanding semester tuition and specialized lab fees without late surcharge is March 31, 2025.',
    isUrgent: false,
  },
  {
    id: 'not-5',
    title: 'Call for Papers: SV International Symposium on Autonomous Edge AI',
    category: 'Academic',
    date: '2025-02-08',
    referenceNo: 'SVC/RND/2025/022',
    summary: 'Submissions invited from undergraduate, postgraduate scholars, and external research scholars for presentation in April 2025.',
    isUrgent: false,
  },
];

export default function NoticesPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filtered = initialNotices.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.summary.toLowerCase().includes(search.toLowerCase()) ||
      n.referenceNo.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || n.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <PublicLayout>
      <section className="bg-navy-950 text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <Badge status="Active" className="mb-3">Official Announcements</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Institutional Notices</h1>
          <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
            Stay up to date with official academic circulars, examination schedules, registration guidelines, and administrative orders.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8 pb-6 border-b border-slate-200">
            <div className="w-full sm:w-80">
              <SearchInput
                placeholder="Search circulars, reference numbers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              {['ALL', 'Academic', 'Examination', 'Registration', 'Administration'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    categoryFilter === c
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {c === 'ALL' ? 'All Circulars' : c}
                </button>
              ))}
            </div>
          </div>

          {/* Notices List */}
          <div className="space-y-4">
            {filtered.map((notice) => (
              <Card key={notice.id} className="border-slate-200 hover:border-brand-300 shadow-subtle hover:shadow-card transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            notice.category === 'Examination'
                              ? 'danger'
                              : notice.category === 'Registration'
                              ? 'info'
                              : notice.category === 'Academic'
                              ? 'success'
                              : 'neutral'
                          }
                        >
                          {notice.category}
                        </Badge>
                        {notice.isUrgent && (
                          <Badge variant="warning" dot>
                            Urgent Notice
                          </Badge>
                        )}
                        <span className="text-xs font-mono text-slate-400">
                          Ref: {notice.referenceNo}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-navy-900 leading-snug">
                        {notice.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                        {notice.summary}
                      </p>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{notice.date}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert(`Downloading circular ${notice.referenceNo}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-brand-600" />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
