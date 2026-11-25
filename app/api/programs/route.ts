import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('programs')
      .select(`
        *,
        departments ( name )
      `)
      .order('id', { ascending: true });

    if (error) return apiError(error.message, 500);

    const formatted = (data || []).map((p) => {
      const dept = Array.isArray(p.departments) ? p.departments[0] : p.departments;
      return {
        id: String(p.id),
        appId: Number(p.id),
        programNumber: Number(p.id),
        code: p.code,
        name: p.name,
        degree: p.degree || 'B.Tech',
        departmentId: String(p.department_id),
        departmentName: dept?.name || 'Computer Science and Engineering',
        durationYears: p.duration_years || 4,
        totalSemesters: p.total_semesters || 8,
        creditsRequired: p.credits_required || 160,
        annualFee: Number(p.annual_fee) || 85000,
        enrolledStudents: 60,
      };
    });

    return apiSuccess(formatted);
  } catch (err: any) {
    return apiError(err.message || 'Failed to fetch programs', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      name,
      degree,
      departmentId,
      durationYears,
      totalSemesters,
      creditsRequired,
      annualFee
    } = body;

    if (!code?.trim() || !name?.trim()) {
      return apiError('Program Code and Name are required.', 400);
    }

    const client = getSupabaseClient();
    const deptId = departmentId ? Number(departmentId) : 1;

    const { data, error } = await client
      .from('programs')
      .insert({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        degree: degree || 'B.Tech',
        department_id: isNaN(deptId) ? 1 : deptId,
        duration_years: durationYears ? Number(durationYears) : 4,
        total_semesters: totalSemesters ? Number(totalSemesters) : 8,
        credits_required: creditsRequired ? Number(creditsRequired) : 160,
        annual_fee: annualFee ? Number(annualFee) : 85000,
      })
      .select(`*, departments ( name )`)
      .single();

    if (error) {
      return apiError(error.message || 'Failed to create program in Supabase.', 400);
    }

    const dept = Array.isArray(data.departments) ? data.departments[0] : data.departments;

    return apiSuccess({
      id: String(data.id),
      appId: Number(data.id),
      programNumber: Number(data.id),
      code: data.code,
      name: data.name,
      degree: data.degree,
      departmentId: String(data.department_id),
      departmentName: dept?.name || 'Computer Science and Engineering',
      durationYears: data.duration_years,
      totalSemesters: data.total_semesters,
      creditsRequired: data.credits_required,
      annualFee: Number(data.annual_fee),
      enrolledStudents: 0,
    }, 'Program created in Supabase database.', 201);
  } catch (err: any) {
    return apiError(err.message || 'Internal server error', 500);
  }
}
