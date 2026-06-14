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
  
  const storeId = '2d46e24a-a378-4312-a871-cc893635bf58';
  const managerId = 'b0417c76-b323-451e-98a6-623a5456918d';

  console.log('1. Checking store in stores table...');
  const { data: store, error: storeErr } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single();

  if (storeErr) {
    console.error('Store fetch error:', storeErr);
  } else {
    console.log('Store data:', store);
  }

  console.log('\n2. Checking tenant_subscriptions...');
  const { data: sub, error: subErr } = await supabase
    .from('tenant_subscriptions')
    .select('*')
    .eq('store_id', storeId)
    .single();

  if (subErr) {
    console.error('Subscription fetch error:', subErr);
  } else {
    console.log('Subscription data:', sub);
  }

  console.log('\n3. Executing the getManagerHistory:sessions query...');
  const { data: sessions, error: sessionsErr } = await supabase
    .from('sales_sessions')
    .select('id, started_at, ended_at, total_revenue, status, approval_status')
    .eq('store_id', storeId)
    .eq('manager_id', managerId)
    .eq('status', 'closed')
    .order('started_at', { ascending: false });

  if (sessionsErr) {
    console.error('❌ Query failed:', sessionsErr);
  } else {
    console.log('✅ Query succeeded! Found sessions count:', sessions.length);
  }
}

main().catch(console.error);
