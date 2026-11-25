import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getSupabaseClient } from '@/lib/supabase';
import { supabaseService } from '@/lib/services/supabaseService';
import { mockDb } from '@/lib/data/mockDatabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reg = searchParams.get('reg');
  const id = searchParams.get('id');

  if (reg) {
    const student = await supabaseService.getUserByRegisterNumber(reg);
    if (!student || student.role !== 'STUDENT') return apiError('Student not found', 404);
    return apiSuccess(student);
  }

  if (id) {
    const student = await supabaseService.getUserById(id);
    if (!student) return apiError('Student not found', 404);
    return apiSuccess(student);
  }

  const client = getSupabaseClient();
  const { data: userRows, error } = await client
    .from('users')
    .select(`
      id,
      register_number,
      email,
      role,
      account_status,
      created_at,
      profiles (
        full_name,
        phone,
        avatar_url,
        profile_image_path
      ),
      students (
        id,
        current_semester,
        batch,
        departments ( name ),
        programs ( name )
      )
    `)
    .eq('role', 'STUDENT')
    .order('created_at', { ascending: true });

  if (error) return apiError(error.message, 500);

  const formatted = (userRows || []).map((u: any) => {
    const prof = Array.isArray(u.profiles) ? u.profiles[0] : u.profiles;
    const stu = Array.isArray(u.students) ? u.students[0] : u.students;
    const dept = Array.isArray(stu?.departments) ? stu?.departments[0] : stu?.departments;
    const prog = Array.isArray(stu?.programs) ? stu?.programs[0] : stu?.programs;

    const studentNum = stu?.id ? Number(stu.id) : 1;

    return {
      id: u.id,
      appId: studentNum,
      studentNumber: studentNum,
      registerNumber: u.register_number,
      email: u.email || '',
      name: prof?.full_name || u.register_number,
      role: 'STUDENT' as const,
      accountStatus: u.account_status || 'ACTIVE',
      phone: prof?.phone,
      avatarUrl: prof?.avatar_url,
      profileImagePath: prof?.profile_image_path,
      department: dept?.name || 'Computer Science and Engineering',
      program: prog?.name || 'B.Tech Computer Science and Engineering',
      semester: stu?.current_semester || 1,
      batch: stu?.batch || '2024-2028',
      createdAt: u.created_at || new Date().toISOString(),
    };
  });

  return apiSuccess(formatted);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      registerNumber,
      name,
      email,
      phone,
      department,
      program,
      semester,
      batch,
      password,
      adminUserId,
      adminName,
      academicYear,
      trackCode
    } = body;

    if (!name?.trim() || !email?.trim()) {
      return apiError('Full Name and Institutional Email are mandatory fields.', 400);
    }

    const client = getSupabaseClient();
    let finalRegNumber = registerNumber?.trim();
    let createdStudentData: any = null;
    let lastError: any = null;

    // Concurrency protection: If 2 admins submit at the exact same millisecond,
    // the system retries up to 3 times to allocate the next sequential number without failing.
    const maxAttempts = academicYear && trackCode ? 3 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // 1. Generate atomically via database function if academicYear & trackCode provided
      if (academicYear && trackCode) {
        const year = parseInt(String(academicYear), 10);
        const track = String(trackCode).replace(/[^0-9]/g, '').slice(-1) || '1';

        const { data: generatedReg, error: genError } = await client.rpc('get_next_registration_number', {
          p_year: year,
          p_track: track,
        });

        if (!genError && generatedReg) {
          finalRegNumber = String(generatedReg);
        }
      }

      // 2. Validate that registration number is exactly 9 digits and starts with 19
      if (!finalRegNumber || !/^19[0-9]{7}$/.test(finalRegNumber)) {
        return apiError('Registration Number must be exactly 9 digits in the format 19YYTNNNN (e.g. 192110001).', 400);
      }

      // 3. Call atomic PostgreSQL function with SECURITY DEFINER
      const { data, error } = await client.rpc('admin_create_student', {
        p_register_number: finalRegNumber,
        p_name: name.trim(),
        p_email: email.trim().toLowerCase(),
        p_phone: phone?.trim() || '',
        p_department_name: department || 'Computer Science and Engineering',
        p_program_name: program || 'B.Tech Computer Science and Engineering',
        p_semester: semester ? Number(semester) : 1,
        p_batch: batch?.trim() || '2024-2028',
        p_password: password?.trim() || 'welcome',
        p_admin_user_id: adminUserId || null,
        p_admin_name: adminName || 'Central Administration'
      });

      if (error) {
        const isRegConflict =
          error.message?.includes('already enrolled') ||
          error.message?.includes('users_register_number_key') ||
          error.message?.includes('duplicate key');

        if (isRegConflict && attempt < maxAttempts - 1) {
          // Concurrency detected: another admin claimed this number a few milliseconds earlier.
          // Pause 60ms and retry to grab the next sequential number cleanly.
          await new Promise((resolve) => setTimeout(resolve, 60));
          continue;
        }

        lastError = error;
        break;
      }

      createdStudentData = data;
      break;
    }

    if (lastError || !createdStudentData) {
      console.error('Error in admin_create_student RPC:', lastError);
      return apiError(lastError?.message || 'Failed to enroll student in Supabase database.', 400);
    }

    const data = createdStudentData;

    if (data && typeof (mockDb as any)?.upsertUser === 'function') {
      mockDb.upsertUser({
        id: data.id,
        appId: data.appId,
        studentNumber: data.studentNumber,
        registerNumber: data.registerNumber,
        email: data.email,
        name: data.name,
        role: 'STUDENT',
        accountStatus: data.accountStatus || 'ACTIVE',
        department: data.department,
        program: data.program,
        semester: data.semester,
        batch: data.batch,
        phone: data.phone,
        createdAt: data.createdAt,
      });
    }

    return apiSuccess(data, 'Student enrolled successfully in Supabase database.', 201);
  } catch (err: any) {
    console.error('Exception in POST /api/students:', err);
    return apiError(err.message || 'Failed to create student', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const reg = searchParams.get('reg');

    if (!id && !reg) {
      return apiError('Student ID or Register Number is required for deletion.', 400);
    }

    const client = getSupabaseClient();
    const { data, error } = await client.rpc('admin_delete_student', {
      p_user_id: id || null,
      p_register_number: reg || null,
      p_admin_id: null,
      p_admin_name: 'Central Administrator',
    });

    if (error) {
      console.error('Error in admin_delete_student RPC:', error);
      return apiError(error.message || 'Failed to delete student.', 400);
    }

    // Remove from in-memory mockDb users
    if (id) {
      mockDb.deleteUser(id);
    }
    if (reg) {
      mockDb.deleteUser(reg);
    }

    return apiSuccess({ deleted: true, id, reg }, 'Student record permanently deleted.');
  } catch (err: any) {
    console.error('Exception in DELETE /api/students:', err);
    return apiError(err.message || 'Failed to delete student', 500);
  }
}

