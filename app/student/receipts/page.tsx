'use client';

import React, { useState } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Receipt } from '@/types';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
import { Receipt as ReceiptIcon, Download, Printer, GraduationCap, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function StudentReceiptsPage() {
  const { user } = useAuth();
  const studentId = user?.id || '';

  const receipts = user ? mockDb.getReceipts(studentId) : [];
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);

  const printVoucher = () => {
    window.print();
  };

  return (
    <PortalLayout role="STUDENT">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Official Payment Receipts & Vouchers
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Digitally signed institutional fee receipts with unique audit reference codes.
            </p>
          </div>
        </div>

        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Generated Receipts Ledger</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4">Receipt Number</th>
                    <th className="p-4">Fee Name</th>
                    <th className="p-4">Fee Type</th>
                    <th className="p-4">Payment Date</th>
                    <th className="p-4">Channel</th>
                    <th className="p-4 text-right">Amount Paid</th>
                    <th className="p-4">Payment Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No receipts generated yet.
                      </td>
                    </tr>
                  ) : (
                    receipts.map((rcpt) => (
                      <tr key={rcpt.id} className="hover:bg-slate-50/60">
                        <td className="p-4 font-mono font-bold text-brand-700">{rcpt.receiptNumber}</td>
                        <td className="p-4 font-medium text-slate-900">{rcpt.feeTitle}</td>
                        <td className="p-4 font-semibold text-slate-700">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                            {rcpt.feeType || 'Tuition / Exam Fee'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">{formatDate(rcpt.date)}</td>
                        <td className="p-4 text-slate-600">{rcpt.paymentMethod}</td>
                        <td className="p-4 text-right font-extrabold text-slate-900">
                          {formatCurrency(rcpt.amount)}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {rcpt.paymentStatus || 'Paid'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5"
                            onClick={() => setActiveReceipt(rcpt)}
                            leftIcon={<ReceiptIcon className="w-3.5 h-3.5" />}
                          >
                            View Voucher
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Printable Receipt Voucher Modal */}
        {activeReceipt && (
          <Modal
            isOpen={!!activeReceipt}
            onClose={() => setActiveReceipt(null)}
            title="Official E-Receipt Voucher"
            maxWidth="2xl"
          >
            <div className="space-y-6 text-slate-800 p-2 print:p-0">
              {/* Institution Header */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg tracking-tight text-navy-900">
                      SV COLLEGE OF ENGINEERING
                    </h3>
                    <div className="text-[11px] text-slate-500">
                      Center for Higher Academic Excellence • Technology Enclave
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-brand-700 font-mono">
                    {activeReceipt.receiptNumber}
                  </div>
                  <div className="text-[10px] text-slate-400">Date: {formatDate(activeReceipt.date)}</div>
                </div>
              </div>

              {/* Student and Payment Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">Student Particulars:</div>
                  <div>Student Name: <strong>{activeReceipt.studentName}</strong></div>
                  <div>Register Number: <strong className="font-mono">{activeReceipt.registerNumber}</strong></div>
                  <div>Department: {activeReceipt.department}</div>
                  <div>Academic Cohort: Semester {activeReceipt.semester} ({activeReceipt.academicYear})</div>
                </div>

                <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">Transaction & Receipt Particulars:</div>
                  <div>Receipt Number: <strong className="font-mono text-brand-700">{activeReceipt.receiptNumber}</strong></div>
                  <div>Transaction ID: <strong className="font-mono">{activeReceipt.transactionId}</strong></div>
                  <div>Payment Channel: {activeReceipt.paymentMethod}</div>
                  <div>Payment Status: <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">{activeReceipt.paymentStatus || 'Paid'}</span></div>
                  <div>Payment Date: {formatDateTime(activeReceipt.date)}</div>
                </div>
              </div>

              {/* Itemized Table */}
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 font-semibold">
                  <tr>
                    <th className="p-3">Fee Particulars</th>
                    <th className="p-3">Fee Type</th>
                    <th className="p-3 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">{activeReceipt.feeTitle}</td>
                    <td className="p-3 font-medium text-slate-700">{activeReceipt.feeType || 'Tuition / Exam Fee'}</td>
                    <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(activeReceipt.amount)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold border-t border-slate-200">
                    <td colSpan={2} className="p-3 text-right uppercase">Total Amount Settled:</td>
                    <td className="p-3 text-right text-emerald-700 text-sm">
                      {formatCurrency(activeReceipt.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Security Seal */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Digitally verified by SV Central Accounts Repository</span>
                </div>
                <div>Authorized Signatory (Finance Deanery)</div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={printVoucher}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Print Voucher
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => alert(`Downloaded receipt ${activeReceipt.receiptNumber}`)}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download PDF
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </PortalLayout>
  );
}
