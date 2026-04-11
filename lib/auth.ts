import { createClient } from './supabase-server'
import { supabaseAdmin } from './supabase-admin'
import { redirect } from 'next/navigation'
import { cache } from 'react'

export async function getUserRole() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role || null
}

export async function getStoreSlug() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  const { data: profile } = await supabase
    .from('users')
    .select(`
      store_id,
      stores ( slug )
    `)
    .eq('id', user.id)
    .single()

  // @ts-ignore
  return profile?.stores?.slug || null
}

export async function requireRole(allowedRoles: string[]) {
  const supabase = await createClient()
  
  // Wrap getUser in a retry loop to handle DNS/network stutters during the initial handshake
  let user: any = null;
  let authError: any = null;
  let authAttempts = 0;
  const maxAuthAttempts = 2; // Keep low — exponential backoff can add seconds to page loads

  while (authAttempts < maxAuthAttempts) {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) {
      user = data.user;
      break;
    }
    
    authError = error;
    const isNetworkError = error?.message?.includes('fetch failed') || 
                           error?.message?.includes('ENOTFOUND') ||
                           error?.message?.includes('timeout') ||
                           error?.message?.includes('ECONNRESET') ||
                           error?.message?.includes('ETIMEDOUT') ||
                           error?.code === 'PGRST301'; // Database connection issue

    if (isNetworkError) {
      authAttempts++;
      const delay = 200 * authAttempts; // 200ms, 400ms max — not exponential
      console.warn(`requireRole: Auth handshake glitch (${authAttempts}/${maxAuthAttempts}). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    } else {
      break;
    }
  }

  if (authError || !user) {
    console.warn('requireRole: No user session found after retries', authError?.message);
    return redirect('/login?error=session_expired');
  }

  // Use admin client to bypass RLS — faster and more reliable for server-side auth checks.
  // Cached per-request to avoid redundant round-trips on the same page.
  const getProfile = cache(async (userId: string) => {
    let profile: any = null;
    let pError: any = null;
    let attempts = 0;
    const maxAttempts = 2; // Keep low — exponential backoff causes slow page loads

    while (attempts < maxAttempts) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (!error) return { profile: data, error: null };

      pError = error;
      const isNetworkError = error.message?.includes('fetch failed') || 
                             error.message?.includes('ENOTFOUND') ||
                             error.message?.includes('timeout') ||
                             error.message?.includes('ECONNRESET') ||
                             error.message?.includes('ETIMEDOUT') ||
                             error.code === 'PGRST301';

      if (isNetworkError) {
        attempts++;
        const delay = 200 * attempts; // 200ms, 400ms max — not exponential
        console.warn(`requireRole: Network glitch (Attempt ${attempts}/${maxAttempts}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        break; 
      }
    }
    return { profile: null, error: pError };
  });

  const { profile, error: pError } = await getProfile(user.id);

  if (!profile) {
    const detail = pError ? `${pError.code}: ${pError.message}` : 'User missing from database.';
    console.error('requireRole: Profile lookup failed for user ID:', user.id, detail);
    throw new Error(`Unauthorized: Profile access failed. Details: ${detail}`);
  }

  if (!allowedRoles.includes(profile.role)) {
    console.warn(`requireRole: Role mismatch. User role: ${profile.role}, Allowed: ${allowedRoles.join(', ')}`);
    throw new Error('Unauthorized: Insufficient permissions.');
  }

  if (!profile.is_active) {
    console.warn('requireRole: Account is deactivated', user.id);
    throw new Error('Account Deactivated: Please contact your administrator.');
  }

  return {
    ...profile,
    storeId: profile.store_id
  }
}
