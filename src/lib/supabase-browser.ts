// Supabase client for browser (admin dashboard) - uses anon key + Supabase Auth
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowser(): SupabaseClient {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Keep Realtime client in sync with auth session token updates / refreshes
    browserClient.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token && browserClient?.realtime) {
        browserClient.realtime.setAuth(session.access_token);
      }
    });
  }

  return browserClient;
}

/**
 * Ensures the browser Supabase Realtime client has the active authenticated user's JWT.
 * Required so that Postgres Changes RLS policies allow event broadcasting.
 */
export async function ensureRealtimeAuth(client: SupabaseClient): Promise<string | null> {
  try {
    const { data: { session } } = await client.auth.getSession();
    if (session?.access_token && client.realtime) {
      await client.realtime.setAuth(session.access_token);
      return session.access_token;
    }
  } catch (err) {
    console.warn('[Realtime] Failed to sync realtime auth token:', err);
  }
  return null;
}

