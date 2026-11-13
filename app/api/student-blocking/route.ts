import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { supabaseService } from '@/lib/services/supabaseService';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const client = getSupabaseClient();
  const { data: records } = await client
    .from('student_block_history')
    .select(`
      id,
      student_id,
      reason,
      blocked_by,
      blocked_at,
      unblocked_by,
      unblocked_at,
      unblock_remarks,
      users:student_id (
        register_number,
        profiles ( full_name )
      )
    `)
    .order('blocked_at', { ascending: false });

  const formatted = (records || []).map((r: any) => {
    const usr = Array.isArray(r.users) ? r.users[0] : r.users;
    const prof = Array.isArray(usr?.profiles) ? usr?.profiles[0] : usr?.profiles;

    return {
      id: String(r.id),
      appId: Number(r.id),
      studentId: r.student_id,
      registerNumber: usr?.register_number || 'REG2024002',
      studentName: prof?.full_name || 'Student',
      department: 'Computer Science and Engineering',
      semester: 6,
      status: 'BLOCKED' as const,
      reason: r.reason,
      blockedBy: 'Faculty / Administration',
      blockedById: r.blocked_by,
      blockedAt: r.blocked_at,
      unblockedBy: r.unblocked_by,
      unblockedAt: r.unblocked_at,
      unblockRemarks: r.unblock_remarks,
    };
  });

  return apiSuccess(formatted);
}

// POST: Block Student (Faculty or Admin)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { registerNumber, reason, blockerName, blockerId } = body;

    if (!registerNumber) return apiError('registerNumber is required', 400);
    if (!reason || !reason.trim()) return apiError('Mandatory reason is required to block a student', 400);

    const record = await supabaseService.blockStudent(
      registerNumber,
      reason,
      blockerName || 'Faculty Member',
      blockerId || 'f0000000-0000-0000-0000-000000000001'
    );

    return apiSuccess(record, 'Student successfully blocked and access revoked', 201);
  } catch (err: any) {
    return apiError(err.message, 400);
  }
}

// PATCH: Unblock Student (ADMIN ONLY!)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { registerNumber, remarks, role, adminId } = body;

    if (!registerNumber) return apiError('registerNumber is required', 400);

    // Rule: FACULTY CANNOT UNBLOCK. ADMIN ONLY.
    if (role !== 'ADMIN') {
      return apiError(
        'FORBIDDEN: Faculty cannot unblock students. Only an Administrator possesses unblocking privileges.',
        403
      );
    }

    const record = await supabaseService.unblockStudent(
      registerNumber,
      remarks || 'Admin unblock action',
      adminId || 'a0000000-0000-0000-0000-000000000001'
    );

    return apiSuccess(record, 'Student account successfully restored to ACTIVE status');
  } catch (err: any) {
    return apiError(err.message, 400);
  }
}
