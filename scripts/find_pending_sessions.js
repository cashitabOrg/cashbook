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

  console.log('Fetching all pending sales_sessions in the database...');
  const { data: sessions, error } = await supabase
    .from('sales_sessions')
    .select('*, stores(slug)')
    .eq('approval_status', 'pending');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${sessions.length} pending sessions.`);
  sessions.forEach(s => {
    console.log(`Session: ID=${s.id} | Store=${s.stores?.slug} | Revenue=${s.total_revenue} | Status=${s.status}`);
  });
}

main().catch(console.error);
