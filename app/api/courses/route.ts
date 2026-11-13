import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { supabaseService } from '@/lib/services/supabaseService';
import { mockDb } from '@/lib/data/mockDatabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const facultyId = searchParams.get('facultyId') || undefined;
  const departmentId = searchParams.get('departmentId') || undefined;
  const semesterParam = searchParams.get('semester');
  const semester = semesterParam ? parseInt(semesterParam, 10) : undefined;

  const createdByOnly = searchParams.get('createdByOnly') === 'true';

  const courses = await supabaseService.getCourses({ 
    facultyId, 
    departmentId, 
    semester,
    onlyCreatedByFaculty: createdByOnly || !!facultyId,
  });
  return apiSuccess(courses);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      code,
      description,
      departmentName,
      departmentId,
      semester,
      credits,
      type,
      facultyId,
      facultyName,
      maxStudents,
      academicYear,
    } = body;

    if (!name || !code) {
      return apiError('Course name and course code are required', 400);
    }
    if (!semester || !credits) {
      return apiError('Semester and credits are required', 400);
    }

    const newCourse = await supabaseService.createCourse({
      code,
      name,
      description: description || 'Course curriculum focusing on theoretical principles and laboratory practice.',
      departmentName: departmentName || 'Computer Science and Engineering',
      departmentId,
      semester: Number(semester),
      credits: Number(credits),
      type: type || 'CORE',
      facultyId: facultyId || undefined,
      facultyName: facultyName || undefined,
      maxStudents: Number(maxStudents) || 60,
      academicYear: academicYear || '2024-2025',
    });

    // Also sync into in-memory mockDb
    try {
      mockDb.createCourse({
        code: newCourse.code,
        name: newCourse.name,
        departmentName: newCourse.departmentName,
        semester: newCourse.semester,
        credits: newCourse.credits,
        type: newCourse.type,
        description: newCourse.description,
        facultyId: newCourse.facultyId,
        facultyName: newCourse.facultyName,
        maxStudents: newCourse.maxStudents,
        academicYear: academicYear || '2024-2025',
      });
    } catch (mErr) {
      console.warn('mockDb sync notice:', mErr);
    }

    return apiSuccess(newCourse, 'Teaching module / course created successfully', 201);
  } catch (err: any) {
    return apiError(err.message || 'Failed to create course', 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const code = searchParams.get('code');

    const target = id || code;
    if (!target) {
      return apiError('Course ID or code is required for deletion', 400);
    }

    // 1. Delete from Supabase
    await supabaseService.deleteCourse(target);
    if (code && target !== code) {
      await supabaseService.deleteCourse(code);
    }

    // 2. Delete / archive in mockDb
    mockDb.deleteCourse(target);
    if (code) {
      mockDb.deleteCourse(code);
    }

    return apiSuccess({ deleted: true, target }, 'Course removed successfully');
  } catch (err: any) {
    return apiError(err.message || 'Failed to delete course', 400);
  }
}

