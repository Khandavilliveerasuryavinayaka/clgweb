'use client';

import React from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Award, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function StudentInternalMarksPage() {
  const { user } = useAuth();
  const studentId = user?.id || '';

  const marks = user ? mockDb.getInternalMarks(undefined, studentId) : [];

  return (
    <PortalLayout role="STUDENT">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            Continuous Internal Assessment (CIA) Marks
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Continuous marks breakdown including CIA-1 (20M), CIA-2 (20M), and Continuous Assignment Component (10M). Max 50 Marks.
          </p>
        </div>

        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Current Term Internal Mark Sheet</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4">Course</th>
                    <th className="p-4 text-center">CIA-1 (Max 20)</th>
                    <th className="p-4 text-center">CIA-2 (Max 20)</th>
                    <th className="p-4 text-center">Assignment (Max 10)</th>
                    <th className="p-4 text-center">Total Internal (Max 50)</th>
                    <th className="p-4">Submission Status</th>
                    <th className="p-4">Submitted By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No continuous assessment marks published yet.
                      </td>
                    </tr>
                  ) : (
                    marks.map((m) => {
                      const isSubmitted = m.status === 'Submitted';
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60">
                          <td className="p-4">
                            <div className="font-mono font-bold text-slate-900">{m.courseCode}</div>
                            <div className="text-[11px] text-slate-500">{m.courseName}</div>
                          </td>
                          <td className="p-4 text-center font-bold text-slate-800">
                            {isSubmitted ? m.cia1 : <span className="text-slate-400 italic">In progress</span>}
                          </td>
                          <td className="p-4 text-center font-bold text-slate-800">
                            {isSubmitted ? m.cia2 : <span className="text-slate-400 italic">In progress</span>}
                          </td>
                          <td className="p-4 text-center font-bold text-slate-800">
                            {isSubmitted ? m.assignment : <span className="text-slate-400 italic">In progress</span>}
                          </td>
                          <td className="p-4 text-center">
                            {isSubmitted ? (
                              <span className="font-extrabold text-sm text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                                {m.total} / 50
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Pending submission</span>
                            )}
                          </td>
                          <td className="p-4">
                            <Badge status={m.status}>{m.status}</Badge>
                          </td>
                          <td className="p-4 text-slate-500">
                            {m.submittedBy ? (
                              <div>
                                <div>{m.submittedBy}</div>
                                <div className="text-[10px] text-slate-400">{formatDate(m.submittedAt!)}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Draft stage</span>
                            )}
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
      </div>
    </PortalLayout>
  );
}
