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
  const args = process.argv.slice(2);
  const email = args[0] || 'frozenpaymanagergmailcom@frozenpayfoodies.frozenpos.local';
  const newPassword = args[1] || 'TemporaryPassword123!';

  console.log(`Setting password for user: ${email}`);

  const env = getEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Find user by email or username in public.users to get the id
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, email, username')
    .or(`email.eq.${email},username.eq.${email}`)
    .single();

  if (userErr || !user) {
    console.error('❌ User not found in public.users:', userErr?.message || 'Not found');
    return;
  }

  console.log(`Found public user: email=${user.email}, id=${user.id}`);

  // Update password in auth
  const { data: authUser, error: authErr } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword
  });

  if (authErr) {
    console.error('❌ Failed to update auth password:', authErr.message);
  } else {
    console.log(`✅ Successfully updated password for ${user.email} (Username: ${user.username}) to: ${newPassword}`);
  }
}

main().catch(console.error);
