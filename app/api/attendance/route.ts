import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { supabaseService } from '@/lib/services/supabaseService';
import { getSupabaseClient } from '@/lib/supabase';
import { mockDb } from '@/lib/data/mockDatabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const courseId = searchParams.get('courseId');

  const client = getSupabaseClient();

  if (studentId) {
    try {
      let resolvedStudentUuid = studentId;
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId)) {
        const { data: u } = await client
          .from('users')
          .select('id')
          .eq('register_number', studentId)
          .maybeSingle();
        if (u?.id) {
          resolvedStudentUuid = u.id;
        }
      }

      const { data: records, error } = await client
        .from('attendance_records')
        .select(`
          id,
          student_id,
          status,
          created_at,
          attendance_sessions (
            id,
            session_date,
            period_number,
            course_offering_id,
            course_offerings (
              course_id,
              courses (
                id,
                code,
                name
              )
            )
          )
        `)
        .eq('student_id', resolvedStudentUuid);

      if (!error && Array.isArray(records) && records.length > 0) {
        const courseMap = new Map<string, any>();
        for (const r of records) {
          const sess = r.attendance_sessions as any;
          const offering = sess?.course_offerings;
          const crs = offering?.courses;
          const cId = String(crs?.id || offering?.course_id || '1');
          if (!courseMap.has(cId)) {
            courseMap.set(cId, {
              courseId: cId,
              courseCode: crs?.code || 'CS601',
              courseName: crs?.name || 'Department Course',
              facultyName: 'Course Instructor',
              totalClasses: 0,
              present: 0,
              absent: 0,
              od: 0,
              percentage: 100,
            });
          }
          const summary = courseMap.get(cId);
          summary.totalClasses += 1;
          if (r.status === 'PRESENT') summary.present += 1;
          else if (r.status === 'ABSENT') summary.absent += 1;
          else if (r.status === 'OD') summary.od += 1;
          summary.percentage = Math.round(((summary.present + summary.od) / summary.totalClasses) * 100);
        }
        return apiSuccess(Array.from(courseMap.values()));
      }
    } catch (e) {
      console.warn('Attendance live query fallback to mockDb:', e);
    }

    // Fallback to mockDb
    const mockSummaries = mockDb.getAttendanceSummaries(studentId);
    return apiSuccess(mockSummaries);
  }

  // Non-studentId query: list records or fallback
  try {
    const query = client
      .from('attendance_records')
      .select('*, attendance_sessions(*)')
      .order('created_at', { ascending: false });
    const { data: records, error } = await query;
    if (!error && records && records.length > 0) {
      return apiSuccess(records);
    }
  } catch (e) {}

  return apiSuccess(mockDb.getAttendanceRecords());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { records, facultyId, courseId, date } = body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return apiError('records array is required and must not be empty', 400);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Enforce attendance date is strictly today's institutional date
    for (const r of records) {
      const recDate = r.date || date || todayStr;
      if (recDate !== todayStr) {
        return apiError(
          `ATTENDANCE DATE REJECTED: Faculty can mark attendance ONLY for today's date (${todayStr}). Attempted date: '${recDate}'. Entering attendance for past or future dates is strictly forbidden.`,
          400
        );
      }
    }

    try {
      await supabaseService.markAttendance({
        courseId: courseId || records[0]?.courseId || '1',
        facultyId: facultyId || 'f0000000-0000-0000-0000-000000000001',
        date: todayStr,
        records: records.map((r) => ({
          studentId: r.studentId,
          registerNumber: r.registerNumber || '',
          studentName: r.studentName || '',
          status: r.status,
          period: r.period || 1,
        })),
      });
    } catch (supaErr) {
      console.warn('Supabase markAttendance fallback to mockDb:', supaErr);
    }

    // Also update mockDb
    try {
      mockDb.markAttendance(
        records.map((r) => ({
          courseId: courseId || r.courseId || '1',
          courseCode: r.courseCode || 'CS601',
          courseName: r.courseName || 'Course',
          date: todayStr,
          period: r.period || 1,
          studentId: r.studentId,
          registerNumber: r.registerNumber || '',
          studentName: r.studentName || '',
          status: r.status,
          markedBy: facultyId || 'Faculty',
        }))
      );
    } catch (mockErr) {
      console.warn('mockDb markAttendance note:', mockErr);
    }

    return apiSuccess({ success: true, count: records.length, date: todayStr }, 'Attendance recorded successfully for today', 201);
  } catch (err: any) {
    return apiError(err.message, 400);
  }
}
