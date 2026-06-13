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

  // Fetch sales sessions for frozenpay-foodies
  console.log('Fetching sales sessions...');
  const { data: sessions, error: sessErr } = await supabase
    .from('sales_sessions')
    .select('*')
    .eq('store_id', '2d46e24a-a378-4312-a871-cc893635bf58')
    .order('started_at', { ascending: false });

  if (sessErr) {
    console.error('❌ Failed to fetch sessions:', sessErr.message);
    return;
  }

  sessions.forEach(s => {
    console.log(`Session ID: ${s.id} | Started At: ${s.started_at} | Ended At: ${s.ended_at} | Status: ${s.status} | Approval: ${s.approval_status}`);
  });

  // Fetch sale items
  console.log('\nFetching sale items...');
  const { data: items, error: itemErr } = await supabase
    .from('sale_items')
    .select('*, products(name)')
    .eq('store_id', '2d46e24a-a378-4312-a871-cc893635bf58')
    .order('created_at', { ascending: false })
    .limit(10);

  if (itemErr) {
    console.error('❌ Failed to fetch sale items:', itemErr.message);
    return;
  }

  items.forEach(i => {
    console.log(`Item ID: ${i.id} | Product: ${i.products?.name} | Qty: ${i.quantity} | Subtotal: ${i.subtotal} | Created At: ${i.created_at} | Session ID: ${i.session_id}`);
  });
}

main().catch(console.error);
