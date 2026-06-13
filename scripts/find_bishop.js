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
  const userId = '8faaee25-598f-4a72-a21d-c3ebaf20bf0b';

  console.log(`Searching for auth user ID ${userId}...`);
  const { data: user, error } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    console.error('Error fetching user:', error);
  } else {
    console.log('User Details:', {
      id: user.user.id,
      email: user.user.email,
      role: user.user.role,
      user_metadata: user.user.user_metadata
    });
  }
}

main().catch(console.error);
