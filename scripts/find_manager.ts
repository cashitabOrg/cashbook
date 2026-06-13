import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function findManager() {
  console.log('--- FIND MANAGER ---');
  
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars: any = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

  const managerId = 'b0417c76-b323-451e-98a6-623a5456918d';
  console.log(`Searching for user ID ${managerId}...`);

  // Query auth.users via supabase.auth.admin.getUserById
  const { data: user, error } = await supabase.auth.admin.getUserById(managerId);

  if (error) {
    console.error('❌ Failed to fetch auth user:', error);
  } else {
    console.log('✅ Auth User details:', {
      id: user.user.id,
      email: user.user.email,
      role: user.user.role,
      user_metadata: user.user.user_metadata
    });
  }

  // Also query the public.users table just in case
  const { data: publicUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', managerId)
    .single();

  console.log('Public User table row:', publicUser);

  console.log('--- SEARCH COMPLETE ---');
}

findManager().catch(console.error);
