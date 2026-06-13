const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

function getEnv() {
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });
  return envVars;
}

async function main() {
  const env = getEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Find the manager user in public.users
  const { data: publicUser, error: pubErr } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'frozenpaymanagergmailcom@frozenpayfoodies.frozenpos.local')
    .single();

  if (pubErr || !publicUser) {
    console.error('❌ Manager not found in public.users table:', pubErr);
    return;
  }

  console.log('✅ Found manager in public.users:', publicUser);

  // Check auth user
  const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(publicUser.id);
  if (authErr) {
    console.error('❌ Failed to get auth user:', authErr);
  } else {
    console.log('✅ Auth User details:', {
      id: authUser.user.id,
      email: authUser.user.email,
      role: authUser.user.role,
      user_metadata: authUser.user.user_metadata
    });
  }
}

main().catch(console.error);
