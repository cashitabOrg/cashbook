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

async function compareIds() {
  const email = 'taiwoadedotunm1gmailcom@kennystore.frozenpos.local';
  console.log(`Auditing: ${email}`);

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const authUser = authUsers.users.find(u => u.email === email);
  
  if (authUser) {
    console.log(`Auth ID: ${authUser.id}`);
  } else {
    console.log('User not found in Auth.');
  }

  const { data: publicUser } = await supabase.from('users').select('id, email').eq('email', email).single();
  if (publicUser) {
    console.log(`Public ID: ${publicUser.id}`);
  } else {
    console.log('User not found in Public.');
  }
}

compareIds();
