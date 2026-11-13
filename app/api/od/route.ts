import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getSupabaseClient } from '@/lib/supabase';
import { mockDb } from '@/lib/data/mockDatabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const client = getSupabaseClient();

  try {
    let query = client
      .from('od_requests')
      .select(`
        id,
        student_id,
        reason,
        start_date,
        end_date,
        total_days,
        document_url,
        status,
        applied_at,
        approval_remarks,
        users:student_id (
          register_number,
          profiles ( full_name )
        )
      `)
      .order('applied_at', { ascending: false });

    if (studentId) query = query.eq('student_id', studentId);

    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      const formatted = data.map((o: any) => {
        const usr = Array.isArray(o.users) ? o.users[0] : o.users;
        const prof = Array.isArray(usr?.profiles) ? usr?.profiles[0] : usr?.profiles;

        return {
          id: String(o.id),
          appId: Number(o.id),
          studentId: o.student_id,
          registerNumber: usr?.register_number || '21CS001',
          studentName: prof?.full_name || 'Student',
          department: 'Computer Science and Engineering',
          startDate: o.start_date,
          endDate: o.end_date,
          totalDays: o.total_days || 1,
          reason: o.reason,
          eventName: o.reason,
          documentName: o.document_url,
          status: o.status || 'Pending',
          facultyRemarks: o.approval_remarks,
          createdAt: o.applied_at,
        };
      });

      return apiSuccess(formatted);
    }
  } catch (e) {
    console.warn('OD live query fallback to mockDb:', e);
  }

  // Fallback to mockDb
  const mockODs = mockDb.getODRequests(studentId || undefined);
  return apiSuccess(mockODs);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, startDate, endDate, totalDays, reason, eventName, documentName, documentUrl } = body;

    const client = getSupabaseClient();
    try {
      await client
        .from('od_requests')
        .insert({
          student_id: studentId || 'e0000000-0000-0000-0000-000000000001',
          start_date: startDate,
          end_date: endDate,
          total_days: Number(totalDays) || 1,
          reason: reason || eventName || 'Academic Conference',
          document_url: documentUrl || documentName || null,
          status: 'Pending',
        });
    } catch (_) {}

    return apiSuccess({ success: true }, 'OD request submitted', 201);
  } catch (err: any) {
    return apiError(err.message, 400);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const targetId = body.id || body.odId;
    const { status, remarks, reviewerId } = body;
    if (!targetId || !status) return apiError('id and status are required', 400);

    const client = getSupabaseClient();
    try {
      const isNum = !isNaN(Number(targetId));
      let query = client.from('od_requests').update({
        status,
        approval_remarks: remarks,
        approved_by: reviewerId || null,
        actioned_at: new Date().toISOString(),
      });
      if (isNum) {
        query = query.eq('id', Number(targetId));
      } else {
        query = query.eq('id', targetId);
      }
      await query;
    } catch (_) {}

    return apiSuccess({ id: targetId, status }, `OD request ${status}`);
  } catch (err: any) {
    return apiError(err.message, 400);
  }
}
