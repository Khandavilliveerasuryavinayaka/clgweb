import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getSupabaseClient } from '@/lib/supabase';
import { supabaseService } from '@/lib/services/supabaseService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const reg = searchParams.get('reg');

    if (!userId && !reg) {
      return apiError('userId or reg is required', 400);
    }

    const user = userId
      ? await supabaseService.getUserById(userId)
      : await supabaseService.getUserByRegisterNumber(reg!);

    if (!user) return apiError('User profile not found', 404);
    return apiSuccess(user);
  } catch (err: any) {
    return apiError(err.message, 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, fullName, phone, address, emergencyContact, avatarUrl } = body;

    if (!userId) {
      return apiError('userId is required', 400);
    }

    const client = getSupabaseClient();
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (fullName !== undefined) updatePayload.full_name = fullName.trim();
    if (phone !== undefined) updatePayload.phone = phone.trim();
    if (address !== undefined) updatePayload.address = address.trim();
    if (emergencyContact !== undefined) updatePayload.emergency_contact = emergencyContact.trim();
    if (avatarUrl !== undefined) updatePayload.avatar_url = avatarUrl;

    const { data, error } = await client
      .from('profiles')
      .update(updatePayload)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return apiError(error.message, 400);
    }

    return apiSuccess(data, 'Profile updated successfully in Supabase');
  } catch (err: any) {
    return apiError(err.message, 500);
  }
}
