'use server'

import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function registerAdmin(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const username = formData.get('username') as string

  if (!email || !password || !fullName || !username) {
    return { error: 'All fields are required.' }
  }

  const supabase = await createClient()

  let authData: any = null;
  let authError: any = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username,
        }
      }
    });

    authData = data;
    authError = error;

    if (error && (error.message.includes('fetch failed') || error.message.includes('ECONNRESET') || error.message.includes('timeout'))) {
       await new Promise(resolve => setTimeout(resolve, 300));
       continue;
    }
    
    break;
  }

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Something went wrong during signup.' }
  }

  // Return redirect URL for the client to handle — ensures cookies are committed first
  return { redirectTo: '/onboarding' }
}

export async function loginUser(formData: FormData) {
  const identifier = formData.get('email') as string // This can be email or username
  const password = formData.get('password') as string

  const supabase = await createClient()
  let email = identifier

  // Always try to find a user by username first to handle managers
  // especially if they use an email-like string as their username
  const { data: userProfile } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('username', identifier)
    .single()
  
  if (userProfile?.email) {
    email = userProfile.email
  }

  let authData: any = null;
  let authError: any = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    authData = data;
    authError = error;

    if (error && (error.message.includes('fetch failed') || error.message.includes('ECONNRESET') || error.message.includes('timeout'))) {
       // Wait 300ms before retrying the network request
       await new Promise(resolve => setTimeout(resolve, 300));
       continue;
    }
    
    break;
  }

  if (authError) {
    return { error: authError.message }
  }

  const data = authData;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('role, is_active, store_id, stores ( slug )')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Profile not found. Please contact support.' }
  }

  if (!profile.is_active) {
    // If the account is deactivated, sign them back out immediately
    await supabase.auth.signOut()
    return { error: 'Your account has been deactivated. Please contact your store administrator.' }
  }

  // @ts-ignore
  const slug = profile.stores?.slug

  let redirectTo = '/login'
  if (profile.role === 'super_admin') {
    redirectTo = '/super-admin/dashboard'
  } else if (profile.role === 'admin') {
    redirectTo = slug ? `/${slug}/admin/dashboard` : '/onboarding'
  } else if (profile.role === 'manager') {
    if (!slug) return { error: 'Manager has no store assigned.' }
    redirectTo = `/${slug}/manager/sales`
  }

  // Return URL for client to navigate — avoids middleware timing issues with cookies
  return { redirectTo }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { redirectTo: '/login' }
}
