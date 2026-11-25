import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://placeholder-project.supabase.co';
const DEFAULT_SUPABASE_KEY = 'placeholder-anon-key';

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
}

export function getSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_KEY
  );
}

/**
 * Client-side browser Supabase instance (lazy-initialized to avoid build-time errors)
 */
let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClientInstance) {
    browserClientInstance = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return browserClientInstance;
}

// Proxy export for backward compatibility so `import { supabase } from '@/lib/supabase'` works safely
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop) {
    const client = getSupabaseBrowserClient();
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

/**
 * Standard Supabase client for API routes and server environments
 */
export function getSupabaseClient(): SupabaseClient {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
