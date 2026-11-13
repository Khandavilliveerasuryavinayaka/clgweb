import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { supabaseService } from '@/lib/services/supabaseService';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const client = getSupabaseClient();

    if (id) {
      const { data: assignment } = await client
        .from('fee_assignments')
        .select('*')
        .eq('id', Number(id))
        .single();

      if (!assignment) return apiError('Fee assignment not found', 404);

      const { data: studentAssignments } = await client
        .from('student_fee_assignments')
        .select(`
          id,
          fee_assignment_id,
          student_id,
          amount:total_fee,
          status:payment_status,
          due_date,
          assigned_at,
          students (
            user_id,
            users (
              register_number,
              profiles ( full_name )
            )
          )
        `)
        .eq('fee_assignment_id', Number(id));

      const formattedStudents = (studentAssignments || []).map((s: any) => {
        const usr = Array.isArray(s.students?.users) ? s.students?.users[0] : s.students?.users;
        const prof = Array.isArray(usr?.profiles) ? usr?.profiles[0] : (usr?.profiles || (Array.isArray(s.students?.profiles) ? s.students?.profiles[0] : s.students?.profiles));

        return {
          id: String(s.id),
          appId: Number(s.id),
          feeAssignmentId: String(s.fee_assignment_id),
          studentId: s.student_id,
          registerNumber: usr?.register_number || '21CS001',
          studentName: prof?.full_name || 'Student',
          amount: Number(s.amount || 0),
          status: s.status || 'Unpaid',
          dueDate: s.due_date,
          assignedAt: s.assigned_at,
        };
      });

      return apiSuccess({
        assignment: {
          id: String(assignment.id),
          appId: Number(assignment.id),
          feeName: assignment.fee_name || 'Fee',
          feeType: assignment.fee_type || 'Tuition Fee',
          amount: Number(assignment.amount || assignment.total_fee || 0),
          academicYear: assignment.academic_year || '2024-2025',
          batch: assignment.batch || '2023-2027',
          dueDate: assignment.due_date,
          status: assignment.status || 'Active',
          createdAt: assignment.created_at,
        },
        studentAssignments: formattedStudents,
      });
    }

    const { data: assignments } = await client
      .from('fee_assignments')
      .select('*')
      .order('id', { ascending: false });

    const formatted = (assignments || []).map((a: any) => ({
      id: String(a.id),
      appId: Number(a.id),
      feeName: a.fee_name || 'Fee',
      feeType: a.fee_type || 'Tuition Fee',
      amount: Number(a.amount || a.total_fee || 0),
      academicYear: a.academic_year || '2024-2025',
      batch: a.batch || '2023-2027',
      dueDate: a.due_date,
      status: a.status || 'Active',
      createdAt: a.created_at,
    }));

    return apiSuccess(formatted);
  } catch (err: any) {
    return apiError(err.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { feeName, feeType, amount, academicYear, batch, dueDate, description } = body;

    if (!feeName || !amount || !dueDate) {
      return apiError('feeName, amount, and dueDate are required', 400);
    }

    const result = await supabaseService.createFeeAssignment({
      feeName,
      feeType: feeType || 'Tuition Fee',
      amount: Number(amount),
      academicYear: academicYear || '2024-2025',
      batch: batch || '2023-2027',
      dueDate,
      description,
    });

    return apiSuccess(result, 'Fee assignment created and assigned to cohort successfully', 201);
  } catch (err: any) {
    return apiError(err.message, 400);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) return apiError('id and status are required', 400);

    const client = getSupabaseClient();
    await client
      .from('fee_assignments')
      .update({ status })
      .eq('id', Number(id));

    return apiSuccess({ id, status }, 'Status updated successfully');
  } catch (err: any) {
    return apiError(err.message, 400);
  }
}
