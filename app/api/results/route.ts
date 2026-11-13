import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { supabaseService } from '@/lib/services/supabaseService';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  const studentId = searchParams.get('studentId');
  const type = searchParams.get('type');
  const courseId = searchParams.get('courseId');

  const client = getSupabaseClient();

  if (type === 'submissions') {
    let query = client.from('course_result_submissions').select('*').order('id', { ascending: false });
    if (courseId) query = query.eq('course_id', Number(courseId));
    const { data } = await query;
    return apiSuccess(data || []);
  }

  if (type === 'roster' && courseId) {
    // Get students enrolled in course and their internal marks
    const coursePk = Number(courseId);
    const { data: enrollments } = await client
      .from('course_enrollments')
      .select(`
        student_id,
        students (
          id,
          user_id,
          users (
            register_number,
            profiles ( full_name )
          )
        )
      `)
      .eq('course_id', isNaN(coursePk) ? 1 : coursePk)
      .eq('status', 'ACCEPTED');

    const roster = (enrollments || []).map((e: any) => {
      const stu = e.students;
      const usr = Array.isArray(stu?.users) ? stu?.users[0] : stu?.users;
      const prof = Array.isArray(usr?.profiles) ? usr?.profiles[0] : (usr?.profiles || (Array.isArray(stu?.profiles) ? stu?.profiles[0] : stu?.profiles));

      return {
        studentId: stu?.user_id,
        studentNumber: stu?.id,
        registerNumber: usr?.register_number || '21CS001',
        studentName: prof?.full_name || 'Student',
        internalMarks: 35, // max 50
        externalMarks: null,
      };
    });

    return apiSuccess(roster);
  }

  // Students can ONLY view published results!
  if (role === 'STUDENT' && studentId) {
    const publishedOnly = await supabaseService.getStudentVisibleResults(studentId);
    return apiSuccess(publishedOnly);
  }

  const { data: allResults } = await client.from('results').select('*').order('id', { ascending: false });
  return apiSuccess(allResults || []);
}

// POST: Faculty submits class results to Admin
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseId, facultyId, role, studentResults } = body;

    if (role === 'STUDENT') {
      return apiError('Forbidden: Students cannot submit results', 403);
    }
    if (!courseId) return apiError('courseId is required', 400);

    const result = await supabaseService.submitCourseResults(
      courseId,
      facultyId || 'f0000000-0000-0000-0000-000000000001',
      studentResults || []
    );

    return apiSuccess(result, 'Class results submitted for Admin approval', 201);
  } catch (err: any) {
    return apiError(err.message, 400);
  }
}

// PATCH: Admin Approves or Publishes class results
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, courseId, role, remarks } = body;

    if (role !== 'ADMIN') {
      return apiError('FORBIDDEN: Only Administrators can approve, reject, or publish results.', 403);
    }

    const act = (action || '').toLowerCase();
    if (courseId) {
      if (act.includes('approve')) {
        await supabaseService.approveCourseResults(courseId, 'Admin');
        return apiSuccess({ courseId, status: 'Approved' }, `Course results approved`);
      } else if (act.includes('reject')) {
        await supabaseService.rejectCourseResults(courseId, 'Admin', remarks);
        return apiSuccess({ courseId, status: 'Rejected' }, `Course results returned for correction`);
      } else if (act.includes('publish')) {
        await supabaseService.publishCourseResults(courseId, 'Admin');
        return apiSuccess({ courseId, status: 'Published' }, `Course results officially published`);
      }
    }

    return apiError('Invalid request. Specify courseId and valid action (approve, reject, publish)', 400);
  } catch (err: any) {
    return apiError(err.message, 400);
  }
}
