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

  const { data, error } = await supabase.rpc('get_db_time'); // wait, is there an RPC or can we query raw postgres?
  // We can't query raw SQL via supabase client unless we use an RPC.
  // Wait, let's see if we can do SELECT NOW() using some query or RPC, or let's check if there's an RPC.
  // Let's check what RPCs are in the DB by checking `c:\Users\HP\Documents\cashbook\scripts\list_rpcs.js`.
  console.log('Error:', error);
}

main().catch(console.error);
