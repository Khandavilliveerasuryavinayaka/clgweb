'use client';

import React from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreditCard, CheckCircle2, Clock, Receipt, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function StudentFeesPage() {
  const { user } = useAuth();
  const studentId = user?.id || '';

  const fees = user ? mockDb.getStudentFees(studentId) : [];
  const totalAmount = fees.reduce((sum, f) => sum + f.totalAmount, 0);
  const totalPaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);
  const totalOutstanding = fees.reduce((sum, f) => sum + f.outstandingAmount, 0);

  return (
    <PortalLayout role="STUDENT">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                Official Student Accounts
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight mt-1">
              Student Fee Dues & Billing
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Review assigned batch fees, settlement statuses, and official institutional receipts.
            </p>
          </div>

          {fees.length > 0 && (
            <div className="flex items-center gap-3">
              {totalOutstanding > 0 && (
                <Link href="/student/payments">
                  <Button size="sm" variant="primary" leftIcon={<CreditCard className="w-4 h-4" />}>
                    Pay Outstanding Dues
                  </Button>
                </Link>
              )}
              <Link href="/student/receipts">
                <Button size="sm" variant="outline" leftIcon={<Receipt className="w-4 h-4" />}>
                  View Receipts
                </Button>
              </Link>
            </div>
          )}
        </div>

        {fees.length === 0 ? (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-12 text-center text-slate-400">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h3 className="text-base font-bold text-slate-700">No fees assigned.</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                There are no institutional fee demands currently assigned to your batch. Fees will appear here once assigned by the college administration.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 3 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-slate-200">
                <CardContent className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Assigned Fee
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                    {formatCurrency(totalAmount)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Cohort Batch: {user?.batch || 'Current Term'}</div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Amount Paid
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                    {formatCurrency(totalPaid)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                    ✓ Confirmed in Central Repository
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Outstanding Balance
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">
                    {formatCurrency(totalOutstanding)}
                  </div>
                  <div className="text-[11px] text-rose-500 mt-1">
                    {totalOutstanding > 0 ? 'Pending Clearance' : 'All Dues Cleared'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Fees Breakdown */}
            <Card className="border-slate-200 shadow-card">
              <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-600" />
                  <CardTitle className="text-base font-bold">Assigned Fee Manifest</CardTitle>
                </div>
                <span className="text-xs text-slate-400 font-medium">Batch {user?.batch || 'All'}</span>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                      <tr>
                        <th className="p-4">Fee Name</th>
                        <th className="p-4">Fee Type</th>
                        <th className="p-4 text-right">Amount</th>
                        <th className="p-4">Due Date</th>
                        <th className="p-4">Payment Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fees.map((f) => {
                        const isPaid = f.status === 'Paid' || f.status === 'Completed' || f.outstandingAmount === 0;
                        const statusLabel = isPaid ? 'Paid' : 'Unpaid';
                        const feeType = f.feeType || f.category || 'Tuition Fee';

                        return (
                          <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-slate-900">{f.title}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{f.academicYear}</div>
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-800 border border-slate-200">
                                {feeType}
                              </span>
                            </td>
                            <td className="p-4 text-right font-extrabold text-slate-900 text-sm">
                              {formatCurrency(f.totalAmount)}
                            </td>
                            <td className="p-4 text-slate-600 font-medium">{formatDate(f.dueDate)}</td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  isPaid
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}
                              >
                                {isPaid ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Paid
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 text-rose-600" />
                                    Unpaid
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {!isPaid ? (
                                <Link href={`/student/payments?feeId=${f.id}`}>
                                  <Button size="sm" variant="primary" className="h-7 text-xs px-3">
                                    Pay
                                  </Button>
                                </Link>
                              ) : (
                                <Link href="/student/receipts">
                                  <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 text-slate-600">
                                    Receipt
                                  </Button>
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
