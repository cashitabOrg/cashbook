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

  console.log('Fetching 20 most recent sessions in the entire database...');
  const { data: sessions, error } = await supabase
    .from('sales_sessions')
    .select('*, stores(slug, name), users(full_name)')
    .order('started_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching sessions:', error);
    return;
  }

  console.log(`Found ${sessions.length} sessions:`);
  sessions.forEach(s => {
    console.log(`Session: ID=${s.id} | Store=${s.stores?.slug} (${s.stores?.name}) | Manager=${s.users?.full_name} | Status=${s.status} | Started=${s.started_at} | Ended=${s.ended_at} | Revenue=${s.total_revenue} | Approval=${s.approval_status}`);
  });
}

main().catch(console.error);
