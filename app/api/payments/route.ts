import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { supabaseService } from '@/lib/services/supabaseService';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const client = getSupabaseClient();

  let query = client.from('payments').select('*').order('payment_date', { ascending: false });
  if (studentId) query = query.eq('student_id', studentId);

  const { data, error } = await query;
  if (error) {
    // Fallback if ordering by payment_date fails
    const fallback = await client.from('payments').select('*').order('id', { ascending: false });
    if (fallback.data) {
      return apiSuccess(fallback.data.map((p: any) => ({
        id: String(p.id),
        appId: Number(p.id),
        transactionId: p.transaction_reference || p.transaction_id || `TXN-${p.id}`,
        studentId: p.student_id,
        amount: Number(p.amount || 0),
        paymentMethod: p.payment_mode || p.payment_method || 'UPI',
        status: p.payment_status || p.status || 'Success',
        timestamp: p.payment_date || p.created_at || new Date().toISOString(),
        receiptNumber: `RCP-${p.id}`,
      })));
    }
  }

  const formatted = (data || []).map((p: any) => ({
    id: String(p.id),
    appId: Number(p.id),
    transactionId: p.transaction_reference || p.transaction_id || `TXN-${p.id}`,
    studentId: p.student_id,
    amount: Number(p.amount || 0),
    paymentMethod: p.payment_mode || p.payment_method || 'UPI',
    status: p.payment_status || p.status || 'Success',
    timestamp: p.payment_date || p.created_at || new Date().toISOString(),
    receiptNumber: `RCP-${p.id}`,
  }));

  return apiSuccess(formatted);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { feeId, amount, paymentMethod, studentId } = body;

    if (!feeId || !amount || !paymentMethod) {
      return apiError('feeId, amount, and paymentMethod are required', 400);
    }

    const targetStudentId = studentId || 'e0000000-0000-0000-0000-000000000001';

    const result = await supabaseService.processPayment(
      feeId,
      Number(amount),
      paymentMethod,
      targetStudentId
    );

    return apiSuccess(result, 'Payment successful', 201);
  } catch (err: any) {
    return apiError(err.message, 400);
  }
}
