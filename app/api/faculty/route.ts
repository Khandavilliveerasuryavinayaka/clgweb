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
    const fac = await supabaseService.getUserByRegisterNumber(reg);
    if (!fac || fac.role !== 'FACULTY') return apiError('Faculty not found', 404);
    return apiSuccess(fac);
  }

  if (id) {
    const fac = await supabaseService.getUserById(id);
    if (!fac) return apiError('Faculty not found', 404);
    return apiSuccess(fac);
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
      faculty (
        id,
        designation,
        qualification,
        joining_date,
        departments ( name )
      )
    `)
    .eq('role', 'FACULTY')
    .order('created_at', { ascending: true });

  if (error) return apiError(error.message, 500);

  const formatted = (userRows || []).map((u: any) => {
    const prof = Array.isArray(u.profiles) ? u.profiles[0] : u.profiles;
    const fac = Array.isArray(u.faculty) ? u.faculty[0] : u.faculty;
    const dept = Array.isArray(fac?.departments) ? fac?.departments[0] : fac?.departments;

    const facNum = fac?.id ? Number(fac.id) : 1;

    return {
      id: u.id,
      appId: facNum,
      facultyNumber: facNum,
      registerNumber: u.register_number,
      email: u.email || '',
      name: prof?.full_name || u.register_number,
      role: 'FACULTY' as const,
      accountStatus: u.account_status || 'ACTIVE',
      phone: prof?.phone,
      avatarUrl: prof?.avatar_url,
      profileImagePath: prof?.profile_image_path,
      department: dept?.name || 'Computer Science and Engineering',
      designation: fac?.designation || 'Associate Professor',
      qualification: fac?.qualification || 'Ph.D',
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
      designation,
      qualification,
      password,
      adminUserId,
      adminName
    } = body;

    if (!name?.trim() || !email?.trim()) {
      return apiError('Faculty Full Name and Institutional Email are mandatory fields.', 400);
    }

    const client = getSupabaseClient();
    let finalFacId = registerNumber?.trim();

    if (!finalFacId) {
      const { data: generatedId, error: genErr } = await client.rpc('get_next_faculty_id');
      if (!genErr && generatedId) {
        finalFacId = String(generatedId);
      }
    }

    if (!finalFacId) {
      return apiError('Staff ID / Register Number could not be determined.', 400);
    }

    // Call atomic PostgreSQL function with SECURITY DEFINER
    const { data, error } = await client.rpc('admin_create_faculty', {
      p_register_number: finalFacId,
      p_name: name.trim(),
      p_email: email.trim(),
      p_phone: phone?.trim() || '',
      p_department_name: department || 'Computer Science and Engineering',
      p_designation: designation?.trim() || 'Associate Professor',
      p_qualification: qualification?.trim() || 'Ph.D in Computer Science',
      p_password: password?.trim() || 'staff',
      p_admin_user_id: adminUserId || null,
      p_admin_name: adminName || 'Central Administration'
    });

    if (error) {
      console.error('Error in admin_create_faculty RPC:', error);
      return apiError(error.message || 'Failed to appoint faculty in Supabase database.', 400);
    }

    if (data && typeof (mockDb as any)?.upsertUser === 'function') {
      mockDb.upsertUser({
        id: data.id,
        appId: data.appId,
        facultyNumber: data.facultyNumber,
        registerNumber: data.registerNumber,
        email: data.email,
        name: data.name,
        role: 'FACULTY',
        accountStatus: data.accountStatus || 'ACTIVE',
        department: data.department,
        phone: data.phone,
        createdAt: data.createdAt,
      });
    }

    return apiSuccess(data, 'Faculty member appointed successfully in Supabase database.', 201);
  } catch (err: any) {
    console.error('Exception in POST /api/faculty:', err);
    return apiError(err.message || 'Failed to create faculty', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const reg = searchParams.get('reg');

    if (!id && !reg) {
      return apiError('Faculty ID or Register Number is required for deletion.', 400);
    }

    const client = getSupabaseClient();
    const { data, error } = await client.rpc('admin_delete_faculty', {
      p_user_id: id || null,
      p_register_number: reg || null,
      p_admin_id: null,
      p_admin_name: 'Central Administrator',
    });

    if (error) {
      console.error('Error in admin_delete_faculty RPC:', error);
      return apiError(error.message || 'Failed to delete faculty member.', 400);
    }

    // Remove from in-memory mockDb users
    if (id) {
      mockDb.deleteUser(id);
    }
    if (reg) {
      mockDb.deleteUser(reg);
    }

    return apiSuccess({ deleted: true, id, reg }, 'Faculty record permanently deleted and ID released for reuse.');
  } catch (err: any) {
    console.error('Exception in DELETE /api/faculty:', err);
    return apiError(err.message || 'Failed to delete faculty member', 500);
  }
}
