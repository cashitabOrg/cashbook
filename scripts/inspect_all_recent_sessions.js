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

  // Fetch all sessions for Bishop Frozens
  console.log('Fetching all sessions for Bishop Frozens...');
  const { data: sessions, error } = await supabase
    .from('sales_sessions')
    .select('*, users(full_name)')
    .eq('store_id', 'c00cc824-6dd1-43cb-9c44-04384ed33040')
    .order('started_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  sessions.forEach(s => {
    console.log(`Session: ID=${s.id} | Manager=${s.users?.full_name} | Status=${s.status} | Started=${s.started_at} | Ended=${s.ended_at} | Revenue=${s.total_revenue} | Approval=${s.approval_status}`);
  });
}

main().catch(console.error);
