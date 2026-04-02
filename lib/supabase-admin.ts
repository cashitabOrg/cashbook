import { createClient } from '@supabase/supabase-js'

// This client must NEVER be used in the browser/client-side code!
// It uses the Service Role Key which bypasses Row Level Security.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export function createAdminClient() {
  return supabaseAdmin;
}
