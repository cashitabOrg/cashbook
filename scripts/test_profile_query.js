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

  const managerId = 'b0417c76-b323-451e-98a6-623a5456918d';

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, is_active, store_id, stores ( slug )')
    .eq('id', managerId)
    .single();

  if (profileError) {
    console.error('❌ Profile Query Failed:', profileError);
  } else {
    console.log('✅ Profile Query Succeeded:', profile);
    console.log('Resolved slug:', profile.stores?.slug);
  }
}

main().catch(console.error);
