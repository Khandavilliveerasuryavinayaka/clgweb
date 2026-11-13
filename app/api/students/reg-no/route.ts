import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getSupabaseClient } from '@/lib/supabase';
import { mockDb } from '@/lib/data/mockDatabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get('year') || '2024';
    const trackParam = searchParams.get('track') || '1';

    const year = parseInt(yearParam, 10) || new Date().getFullYear();
    const trackDigit = (trackParam.replace(/[^0-9]/g, '').slice(-1)) || '1';

    const yy = String(year % 100).padStart(2, '0');
    const prefix = `19${yy}${trackDigit}`;

    try {
      const client = getSupabaseClient();
      const { data, error } = await client.rpc('preview_next_registration_number', {
        p_year: year,
        p_track: trackDigit,
      });

      if (!error && data && String(data).length === 9) {
        return apiSuccess({
          regNo: String(data),
          year,
          track: trackDigit,
          prefix,
        });
      }
    } catch (dbErr) {
      console.warn('Database preview RPC failed, falling back to query/in-memory calculation:', dbErr);
    }

    // Fallback calculation checking Supabase users + mockDb
    const usedSeqs = new Set<number>();

    try {
      const client = getSupabaseClient();
      const { data: existingUsers } = await client
        .from('users')
        .select('register_number')
        .like('register_number', `${prefix}%`);

      (existingUsers || []).forEach((u: { register_number: string }) => {
        const reg = u.register_number || '';
        if (reg.length === 9 && reg.startsWith(prefix)) {
          const seq = parseInt(reg.slice(5), 10);
          if (!isNaN(seq) && seq > 0) {
            usedSeqs.add(seq);
          }
        }
      });
    } catch (e) {
      // Ignore database error on fallback
    }

    // Also check mockDb users
    mockDb.getUsers().forEach((u) => {
      const reg = u.registerNumber || '';
      if (reg.length === 9 && reg.startsWith(prefix)) {
        const seq = parseInt(reg.slice(5), 10);
        if (!isNaN(seq) && seq > 0) {
          usedSeqs.add(seq);
        }
      }
    });

    let nextSeq = 1;
    while (usedSeqs.has(nextSeq)) {
      nextSeq++;
    }

    const regNo = `${prefix}${String(nextSeq).padStart(4, '0')}`;

    return apiSuccess({
      regNo,
      year,
      track: trackDigit,
      prefix,
    });
  } catch (err: any) {
    return apiError(err.message || 'Failed to preview registration number', 500);
  }
}
