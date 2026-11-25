import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api/response';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const client = getSupabaseClient();

  let query = client.from('receipts').select('*').order('generated_at', { ascending: false });
  if (studentId) query = query.eq('student_id', studentId);

  const { data } = await query;
  const receipts = (data || []).map((r: any) => ({
    id: String(r.id),
    appId: Number(r.id),
    receiptNumber: r.receipt_number || `RCP-${r.id}`,
    transactionId: `TXN-${r.id}`,
    studentId: r.student_id,
    studentName: 'Student',
    registerNumber: '',
    program: 'B.Tech',
    department: 'Computer Science',
    semester: 6,
    amount: Number(r.amount || 5000),
    paymentMethod: r.payment_method || 'UPI',
    date: r.generated_at || new Date().toISOString(),
    feeTitle: r.fee_title || 'Institutional Academic Fee',
    academicYear: '2024-2025',
    paymentStatus: 'Success',
  }));

  return apiSuccess(receipts);
}
