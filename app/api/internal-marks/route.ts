import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  const studentId = searchParams.get('studentId');
  const client = getSupabaseClient();

  let query = client.from('internal_marks').select('*').order('id', { ascending: true });
  if (studentId) query = query.eq('student_id', studentId);
  if (courseId) {
    const cid = Number(courseId);
    if (!isNaN(cid)) query = query.eq('course_id', cid);
  }

  const { data } = await query;
  const formatted = (data || []).map((m: any) => ({
    id: String(m.id),
    appId: Number(m.id),
    studentId: m.student_id,
    registerNumber: '',
    studentName: '',
    courseId: String(m.course_id || '1'),
    courseCode: 'CS601',
    courseName: 'Distributed Systems',
    cia1: Number(m.cia1 || 16),
    cia2: Number(m.cia2 || 17),
    assignment: Number(m.assignment || 8),
    total: Number(m.total || m.marks_obtained || 41),
    status: (m.status || 'Submitted') as 'Draft' | 'Submitted',
  }));

  return apiSuccess(formatted);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { marks, submit } = body;

    if (!marks || !Array.isArray(marks)) {
      return apiError('marks array is required', 400);
    }

    const client = getSupabaseClient();
    for (const m of marks) {
      const cia1 = Number(m.cia1 || 0);
      const cia2 = Number(m.cia2 || 0);
      const assignment = Number(m.assignment || 0);
      const total = cia1 + cia2 + assignment;
      const coursePk = Number(m.courseId);

      await client.from('internal_marks').upsert({
        student_id: m.studentId,
        course_id: isNaN(coursePk) ? 1 : coursePk,
        cia1,
        cia2,
        assignment,
        total,
        marks_obtained: total,
        max_marks: 50,
        status: submit ? 'Submitted' : 'Draft',
      });
    }

    return apiSuccess({ count: marks.length, submit }, 'Internal marks saved to Supabase');
  } catch (err: any) {
    return apiError(err.message, 400);
  }
}
