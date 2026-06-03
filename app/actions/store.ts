'use server'

import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function createStoreProfile(formData: FormData) {
  const storeName = formData.get('storeName') as string
  const storeSlug = formData.get('storeSlug') as string

  if (!storeName || !storeSlug) {
    return { error: 'Both fields are required.' }
  }

  // Ensure slug is lowercase and URL safe
  const formattedSlug = storeSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-')

  // Use the regular client just to verify the user is authenticated
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    return { error: 'Unauthorized. Please log in again.' }
  }

  // Check store creation limits
  const { checkPlanLimit } = require("@/lib/planEnforcement");
  const { data: userProfile } = await supabaseAdmin
    .from('users')
    .select('store_id')
    .eq('email', user.email)
    .not('store_id', 'is', null)
    .limit(1);

  if (userProfile && userProfile.length > 0) {
    const existingStoreId = userProfile[0].store_id;
    const limitCheck = await checkPlanLimit(existingStoreId, 'add_store', user.email);
    if (!limitCheck.allowed) {
      return {
        error: `Upgrade required: You have reached your limit of ${limitCheck.limit} store(s) on your current plan. Please upgrade to the ${limitCheck.nextPlan?.toUpperCase()} plan (${limitCheck.nextPrice}) to add more stores.`
      };
    }
  }

  // Check if store slug already exists - use admin client for consistent reads
  const { data: existingStore } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('slug', formattedSlug)
    .single()

  if (existingStore) {
    return { error: 'Store URL already taken. Try another.' }
  }

  // Create store using admin client to bypass RLS (admin users cannot INSERT stores via RLS)
  const { data: newStore, error: storeError } = await supabaseAdmin
    .from('stores')
    .insert({
      name: storeName,
      slug: formattedSlug,
      plan: 'free',
      is_active: true
    })
    .select('id')
    .single()

  if (storeError || !newStore) {
    console.error('Store creation error:', storeError)
    return { error: 'Failed to create store. Please try again.' }
  }

  // Link the user to their new store using admin client to bypass RLS
  const { error: userError } = await supabaseAdmin
    .from('users')
    .update({ store_id: newStore.id })
    .eq('id', user.id)

  if (userError) {
    console.error('User update error:', userError)
    // Attempt cleanup: delete the orphaned store we just created
    await supabaseAdmin.from('stores').delete().eq('id', newStore.id)
    return { error: 'Failed to link user to store. Please try again.' }
  }

  // Return URL for client to navigate — avoids proxy timing issues with cookies
  return { redirectTo: `/${formattedSlug}/admin/dashboard` }
}
