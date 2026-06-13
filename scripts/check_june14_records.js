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

  // Check sales sessions
  console.log('Querying sessions starting with 2026-06-14...');
  const { data: sessions, error: sErr } = await supabase
    .from('sales_sessions')
    .select('*')
    .gte('started_at', '2026-06-13T23:00:00.000Z')
    .lte('started_at', '2026-06-14T23:00:00.000Z');

  if (sErr) console.error(sErr);
  else console.log('Sessions in range:', sessions);

  // Check sale items
  console.log('Querying sale items starting with 2026-06-14...');
  const { data: items, error: iErr } = await supabase
    .from('sale_items')
    .select('*, products(name)')
    .gte('created_at', '2026-06-13T23:00:00.000Z')
    .lte('created_at', '2026-06-14T23:00:00.000Z');

  if (iErr) console.error(iErr);
  else console.log('Items in range:', items);
}

main().catch(console.error);
