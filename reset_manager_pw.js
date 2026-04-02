const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envLocal.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join('=').trim();
        env[k] = v;
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPassword() {
  const username = 'taiwoadedotunm1@gmail.com';
  const newPassword = '12345678';
  
  console.log(`Resetting password for username: ${username}...`);

  // 1. Find the internal email for this username
  const { data: profile, error: pError } = await supabase
    .from('users')
    .select('email, id')
    .eq('username', username)
    .single();

  if (pError || !profile) {
    console.error('Could not find user profile:', pError?.message);
    return;
  }

  const internalEmail = profile.email;
  const userId = profile.id;
  console.log(`Resolved to internal ID: ${userId} (${internalEmail})`);

  // 2. Perform Admin Password Update
  const { data, error } = await supabase.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  );

  if (error) {
    console.error('Failed to reset password:', error.message);
  } else {
    console.log('--- SUCCESS ---');
    console.log(`Password for ${username} has been reset to: ${newPassword}`);
    console.log('You can now log in with these credentials.');
  }
}

resetPassword();
