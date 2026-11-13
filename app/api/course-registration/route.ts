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
  const status = searchParams.get('status');

  const client = getSupabaseClient();
  let liveRegistrations: any[] = [];

  try {
    let query = client
      .from('course_enrollments')
      .select(`
        id,
        student_id,
        course_id,
        semester,
        academic_year,
        status,
        requested_at,
        reviewed_by,
        reviewed_at,
        remarks,
        courses ( code, name, credits ),
        students (
          id,
          user_id,
          current_semester,
          users (
            register_number,
            profiles ( full_name )
          )
        )
      `)
      .order('id', { ascending: false });

    if (studentId) {
      if (!isNaN(Number(studentId))) {
        query = query.eq('student_id', Number(studentId));
      } else {
        const { data: stu } = await client
          .from('students')
          .select('id')
          .eq('user_id', studentId)
          .maybeSingle();
        if (stu?.id) {
          query = query.eq('student_id', stu.id);
        }
      }
    }
    if (courseId && !isNaN(Number(courseId))) {
      query = query.eq('course_id', Number(courseId));
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      liveRegistrations = data.map((r: any) => {
        const stu = r.students;
        const usr = Array.isArray(stu?.users) ? stu?.users[0] : stu?.users;
        const prof = Array.isArray(usr?.profiles) ? usr?.profiles[0] : (usr?.profiles || (Array.isArray(stu?.profiles) ? stu?.profiles[0] : stu?.profiles));
        const crs = Array.isArray(r.courses) ? r.courses[0] : r.courses;

        return {
          id: String(r.id),
          appId: Number(r.id),
          studentId: stu?.user_id || String(r.student_id),
          registerNumber: usr?.register_number || 'REG2024001',
          studentName: prof?.full_name || 'Student',
          courseId: String(r.course_id),
          courseCode: crs?.code || 'CS601',
          courseName: crs?.name || 'Course',
          credits: crs?.credits || 4,
          semester: r.semester || 6,
          academicYear: r.academic_year || '2024-2025',
          status: r.status,
          requestedAt: r.requested_at,
          reviewedBy: r.reviewed_by,
          reviewedAt: r.reviewed_at,
          remarks: r.remarks,
        };
      });
    }
  } catch (e) {
    console.warn('Course registration live query fallback to mockDb:', e);
  }

  // Merge with mockDb
  const mockList = mockDb.getCourseRegistrations(studentId || undefined);
  const liveIds = new Set(liveRegistrations.map((r) => r.id));
  const combined = [
    ...liveRegistrations,
    ...mockList.filter((m) => !liveIds.has(m.id)),
  ];

  return apiSuccess({
    registrations: combined,
    activePeriod: {
      id: '1',
      academicYear: '2024-2025',
      semester: 6,
      title: 'Even Semester Course Registration',
      startDate: '2024-01-01',
      endDate: '2025-12-31',
      isActive: true,
      eligiblePrograms: ['All'],
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, courseId } = body;

    if (!studentId || !courseId) {
      return apiError('studentId and courseId are required', 400);
    }

    let regResult: any = null;

    try {
      regResult = await supabaseService.requestEnrollment(studentId, courseId);
    } catch (supaErr) {
      console.warn('Supabase requestEnrollment fallback to mockDb:', supaErr);
    }

    // Also update mockDb
    try {
      mockDb.requestCourseEnrollment(studentId, courseId);
    } catch (_) {}

    return apiSuccess(
      regResult || { studentId, courseId, status: 'PENDING' },
      'Course enrollment request submitted with status PENDING',
      201
    );
  } catch (err: any) {
    return apiError(err.message || 'Failed to submit enrollment request', 400);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { regId, action, status, reviewerId, remarks } = body;

    const normalizedAction: 'ACCEPTED' | 'REJECTED' = 
      (action === 'ACCEPTED' || status === 'ACCEPTED' || action === 'Approved' || status === 'Approved')
        ? 'ACCEPTED'
        : 'REJECTED';

    if (!regId) {
      return apiError('regId is required', 400);
    }

    let updatedResult: any = null;

    try {
      updatedResult = await supabaseService.updateEnrollmentStatus(
        regId,
        normalizedAction,
        reviewerId,
        remarks
      );
    } catch (supaErr) {
      console.warn('Supabase updateEnrollmentStatus fallback to mockDb:', supaErr);
    }

    // Also update mockDb
    try {
      mockDb.reviewCourseEnrollment(regId, normalizedAction, reviewerId || 'Faculty', 'Reviewed');
    } catch (_) {}

    return apiSuccess(
      updatedResult || { regId, status: normalizedAction },
      `Course enrollment request ${normalizedAction.toLowerCase()} successfully`
    );
  } catch (err: any) {
    return apiError(err.message || 'Failed to review enrollment request', 400);
  }
}
