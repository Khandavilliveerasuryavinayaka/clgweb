import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getSupabaseClient } from '@/lib/supabase';
import { mockDb } from '@/lib/data/mockDatabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.rpc('preview_next_faculty_id');

      if (!error && data && /^FAC[0-9]{3,}$/.test(String(data))) {
        return apiSuccess({
          facId: String(data),
        });
      }
    } catch (dbErr) {
      console.warn('Database faculty ID preview RPC failed, falling back to calculation:', dbErr);
    }

    // Fallback calculation: find lowest unused sequence starting from 1
    const usedSeqs = new Set<number>();

    try {
      const client = getSupabaseClient();
      const { data: existingUsers } = await client
        .from('users')
        .select('register_number')
        .like('register_number', 'FAC%');

      (existingUsers || []).forEach((u: { register_number: string }) => {
        const reg = u.register_number || '';
        const match = reg.match(/^FAC([0-9]+)$/i);
        if (match) {
          const seq = parseInt(match[1], 10);
          if (!isNaN(seq) && seq > 0) {
            usedSeqs.add(seq);
          }
        }
      });
    } catch (e) {
      // Ignore database error on fallback
    }

    // Check mockDb users
    mockDb.getUsers().forEach((u) => {
      const reg = u.registerNumber || '';
      const match = reg.match(/^FAC([0-9]+)$/i);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > 0) {
          usedSeqs.add(seq);
        }
      }
    });

    let nextSeq = 1;
    while (usedSeqs.has(nextSeq)) {
      nextSeq++;
    }

    const facId = `FAC${String(nextSeq).padStart(3, '0')}`;

    return apiSuccess({
      facId,
    });
  } catch (err: any) {
    return apiError(err.message || 'Failed to preview faculty ID', 500);
  }
}
