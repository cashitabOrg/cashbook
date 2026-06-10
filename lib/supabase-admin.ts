import { createClient } from '@supabase/supabase-js'

function fetchWithTimeout(
  url: string | URL | Request,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const signal = options.signal;
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => {
    clearTimeout(id);
  });
}

// This client must NEVER be used in the browser/client-side code!
// It uses the Service Role Key which bypasses Row Level Security.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      fetch: (url, options) => fetchWithTimeout(url, options, 15000)
    }
  }
)

export function createAdminClient() {
  return supabaseAdmin;
}
