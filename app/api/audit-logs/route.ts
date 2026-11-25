import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api/response';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  const action = searchParams.get('action');
  const entity = searchParams.get('entity');

  const client = getSupabaseClient();
  let query = client.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);

  if (role) query = query.eq('role', role);
  if (action) query = query.eq('action', action);
  if (entity) query = query.eq('entity', entity);

  const { data } = await query;
  const formatted = (data || []).map((l: any) => ({
    id: String(l.id),
    appId: Number(l.id),
    userId: l.user_id,
    userName: l.user_name || 'System User',
    role: l.role || 'ADMIN',
    action: l.action,
    entity: l.entity || 'System',
    entityId: l.entity_id || '',
    details: l.details || '',
    ipAddress: l.ip_address || '127.0.0.1',
    timestamp: l.created_at || new Date().toISOString(),
  }));

  return apiSuccess(formatted);
}
