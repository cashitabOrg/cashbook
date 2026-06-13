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
  const storeId = 'c00cc824-6dd1-43cb-9c44-04384ed33040';

  console.log('Fetching all users for Bishop Frozens...');
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('store_id', storeId);

  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`User: ID=${u.id} | Name=${u.full_name} | Username=${u.username} | Role=${u.role} | Active=${u.is_active}`);
    });
  }
}

main().catch(console.error);
