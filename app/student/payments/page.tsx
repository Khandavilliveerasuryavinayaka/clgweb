'use client';

import React, { useState } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { 
  CreditCard, 
  QrCode, 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  History, 
  ArrowRight,
  Receipt,
  Lock
} from 'lucide-react';
import Link from 'next/link';

export default function StudentPaymentsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const studentId = user?.id || 'usr-stu-1';

  const fees = mockDb.getStudentFees(studentId);
  const transactions = mockDb.getPayments(studentId);

  // Filter fees with outstanding amount
  const unpaidFees = fees.filter((f) => f.outstandingAmount > 0);

  const [selectedFeeId, setSelectedFeeId] = useState(unpaidFees[0]?.id || fees[0]?.id || '');
  const [payAmount, setPayAmount] = useState<number>(unpaidFees[0]?.outstandingAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<any>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const feeIdParam = params.get('feeId');
      if (feeIdParam) {
        const found = fees.find((f) => f.id === feeIdParam);
        if (found) {
          setSelectedFeeId(found.id);
          setPayAmount(found.outstandingAmount);
        }
      }
    }
  }, []);

  const activeFee = fees.find((f) => f.id === selectedFeeId);

  const handleSelectFeeChange = (feeId: string) => {
    setSelectedFeeId(feeId);
    const chosen = fees.find((f) => f.id === feeId);
    if (chosen) setPayAmount(chosen.outstandingAmount);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (user?.accountStatus === 'BLOCKED') {
      toastError('SECURITY RESTRICTION: Your account is BLOCKED. Payment initiation is disabled.');
      return;
    }

    if (!activeFee) {
      toastError('Please select a fee to pay.');
      return;
    }
    if (payAmount <= 0 || payAmount > activeFee.outstandingAmount) {
      toastError('Invalid payment amount. Cannot exceed outstanding balance.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      try {
        const result = mockDb.processFeePayment(activeFee.id, payAmount, paymentMethod);
        setIsProcessing(false);
        setSuccessReceipt(result);
        success(
          `Payment of ${formatCurrency(payAmount)} completed successfully. Transaction ID: ${result.transaction.transactionId}`,
          'Transaction Approved'
        );
      } catch (err: any) {
        setIsProcessing(false);
        toastError(err.message || 'Payment failed.');
      }
    }, 1200);
  };

  return (
    <PortalLayout role="STUDENT">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            Institutional Fee Payment Gateway
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Secure multi-channel payment interface with immediate cryptographic transaction logging and receipt generation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Payment Terminal Form */}
          <div className="lg:col-span-7">
            <Card className="border-slate-200 shadow-card">
              <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <CreditCard className="w-4 h-4 text-brand-600" />
                  <span>Initiate Fee Clearance</span>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <Lock className="w-3 h-3" />
                  256-Bit Encrypted Gateway
                </span>
              </CardHeader>

              <CardContent className="p-6">
                {unpaidFees.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                    <h4 className="font-bold text-base text-slate-900">All Academic Fees Cleared</h4>
                    <p className="text-xs text-slate-500">
                      You have zero outstanding dues for the current term.
                    </p>
                    <div className="pt-2">
                      <Link href="/student/receipts">
                        <Button size="sm" variant="outline">View Receipts History</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleProcessPayment} className="space-y-5">
                    <Select
                      label="Select Fee Component to Clear"
                      value={selectedFeeId}
                      onChange={(e) => handleSelectFeeChange(e.target.value)}
                      options={unpaidFees.map((f) => ({
                        label: `${f.title} — Outstanding: ${formatCurrency(f.outstandingAmount)}`,
                        value: f.id,
                      }))}
                    />

                    {activeFee && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total Invoiced:</span>
                          <span className="font-bold text-slate-800">{formatCurrency(activeFee.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Already Paid:</span>
                          <span className="font-bold text-emerald-600">{formatCurrency(activeFee.paidAmount)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200">
                          <span className="font-semibold text-slate-700">Outstanding Balance:</span>
                          <span className="font-extrabold text-rose-600 text-sm">{formatCurrency(activeFee.outstandingAmount)}</span>
                        </div>
                      </div>
                    )}

                    <Input
                      label="Payment Amount (INR)"
                      type="number"
                      required
                      min={1}
                      max={activeFee?.outstandingAmount || 100000}
                      value={payAmount}
                      onChange={(e) => setPayAmount(parseInt(e.target.value, 10) || 0)}
                      helperText="You can pay the full outstanding balance or an authorized partial installment."
                    />

                    {/* Payment Method Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-2">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'UPI', label: 'UPI / QR', icon: <QrCode className="w-4 h-4" /> },
                          { id: 'Credit Card', label: 'Credit Card', icon: <CreditCard className="w-4 h-4" /> },
                          { id: 'Debit Card', label: 'Debit Card', icon: <CreditCard className="w-4 h-4" /> },
                          { id: 'Net Banking', label: 'Net Banking', icon: <Building2 className="w-4 h-4" /> },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPaymentMethod(m.id as any)}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${
                              paymentMethod === m.id
                                ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500 shadow-sm'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {m.icon}
                            <span>{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      variant="primary"
                      className="w-full font-bold shadow-md shadow-brand-500/20"
                      isLoading={isProcessing}
                    >
                      <span>Authorize Payment of {formatCurrency(payAmount)}</span>
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transaction History Feed */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-slate-200 shadow-card">
              <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <CardTitle className="text-base font-bold">Recent Payment Transactions</CardTitle>
                <Link href="/student/receipts" className="text-xs font-semibold text-brand-600 hover:underline">
                  Receipts →
                </Link>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{formatCurrency(tx.amount)}</span>
                      <Badge status="Approved">Success</Badge>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      TXN ID: {tx.transactionId}
                    </div>
                    <div className="text-[11px] text-slate-600 line-clamp-1">{tx.feeTitle}</div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[10px] text-slate-400">
                      <span>Method: {tx.paymentMethod}</span>
                      <span>{formatDateTime(tx.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Success Receipt Modal */}
        {successReceipt && (
          <Modal
            isOpen={!!successReceipt}
            onClose={() => setSuccessReceipt(null)}
            title="Official Payment Voucher"
            maxWidth="md"
          >
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-lg text-slate-900">Payment Processed Successfully</h4>
              <p className="text-xs text-slate-500">
                Central accounts ledger updated. Official receipt has been gazetted.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt Number:</span>
                  <span className="font-mono font-bold text-brand-700">{successReceipt.receipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-slate-800">{successReceipt.transaction.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-bold text-emerald-600 text-sm">{formatCurrency(successReceipt.transaction.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Channel:</span>
                  <span className="font-semibold text-slate-800">{successReceipt.transaction.paymentMethod}</span>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-3 border-t border-slate-100">
                <Link href="/student/receipts">
                  <Button variant="primary" size="sm" onClick={() => setSuccessReceipt(null)}>
                    Go to Receipts Ledger
                  </Button>
                </Link>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </PortalLayout>
  );
}
