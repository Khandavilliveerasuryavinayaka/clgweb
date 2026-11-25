import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('departments')
      .select('*')
      .order('id', { ascending: true });

    if (error) return apiError(error.message, 500);

    const formatted = (data || []).map((d) => ({
      id: String(d.id),
      appId: Number(d.id),
      departmentNumber: Number(d.id),
      code: d.code,
      name: d.name,
      description: d.description || '',
      establishedYear: d.established_year || 2020,
      facultyCount: 15,
      studentCount: 180,
    }));

    return apiSuccess(formatted);
  } catch (err: any) {
    return apiError(err.message || 'Failed to fetch departments', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, description, establishedYear } = body;

    if (!code?.trim() || !name?.trim()) {
      return apiError('Department Code and Name are required.', 400);
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('departments')
      .insert({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description?.trim() || '',
        established_year: establishedYear ? Number(establishedYear) : new Date().getFullYear(),
      })
      .select()
      .single();

    if (error) {
      return apiError(error.message || 'Failed to create department in Supabase.', 400);
    }

    return apiSuccess({
      id: String(data.id),
      appId: Number(data.id),
      departmentNumber: Number(data.id),
      code: data.code,
      name: data.name,
      description: data.description,
      establishedYear: data.established_year,
      facultyCount: 0,
      studentCount: 0,
    }, 'Department created in Supabase database.', 201);
  } catch (err: any) {
    return apiError(err.message || 'Internal server error', 500);
  }
}
