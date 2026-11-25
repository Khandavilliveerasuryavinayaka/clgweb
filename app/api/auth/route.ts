import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { supabaseService } from '@/lib/services/supabaseService';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { registerNumber, password, honeypot, website_hp_code } = body;

    // Honeypot Trap Detection: Bots auto-fill hidden input fields
    if (honeypot || website_hp_code) {
      try {
        const client = getSupabaseClient();
        await client.from('audit_logs').insert({
          user_name: 'AUTOMATED_BOT',
          role: 'GUEST',
          action: 'BOT_LOGIN_ATTEMPT_BLOCKED',
          entity: 'SecurityFirewall',
          details: 'Automated bot filled hidden honeypot trap. Request immediately blocked.',
        });
      } catch (_) {}

      return apiError('Automated bot interaction detected and blocked.', 400);
    }

    if (!registerNumber) {
      return apiError('Register Number / Username is required', 400);
    }

    const user = await supabaseService.getUserByRegisterNumber(registerNumber.trim());
    if (!user) {
      return apiError('Invalid credentials. User not found.', 401);
    }

    // Account Status Check - Blocked students CANNOT log in!
    if (user.role === 'STUDENT' && user.accountStatus === 'BLOCKED') {
      const client = getSupabaseClient();
      await client.from('audit_logs').insert({
        user_id: user.id,
        user_name: user.name,
        role: user.role,
        action: 'LOGIN_ATTEMPT_BLOCKED',
        entity: 'UserSession',
        entity_id: user.id,
        details: `Blocked student ${user.registerNumber} attempted to log in. Access was denied.`,
      });

      return apiError('Account Blocked: Access to the student portal has been suspended due to administrative action. Contact Central Administration.', 403);
    }

    // Verify credentials with Supabase Auth
    if (password) {
      const client = getSupabaseClient();
      const { data: authData, error: authErr } = await client.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      // If Auth user password check fails, check password match or return error
      if (authErr && !authData?.user) {
        return apiError('Invalid credentials. Incorrect password.', 401);
      }
    }

    const client = getSupabaseClient();
    await client.from('audit_logs').insert({
      user_id: user.id,
      user_name: user.name,
      role: user.role,
      action: 'USER_LOGIN',
      entity: 'UserSession',
      entity_id: user.id,
      details: `User ${user.registerNumber} logged in. Account status: ${user.accountStatus}`,
    });

    return apiSuccess({
      user,
      token: `jwt-token-${user.id}-${Date.now()}`,
      isBlocked: false,
    }, 'Authentication successful');
  } catch (err: any) {
    return apiError(err.message || 'Internal Server Error', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const client = getSupabaseClient();
    await client.auth.signOut();
    return apiSuccess(null, 'Session invalidated and logged out successfully');
  } catch (err: any) {
    return apiError(err.message || 'Failed to logout', 500);
  }
}
