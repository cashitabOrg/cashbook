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
  const storeId = '2d46e24a-a378-4312-a871-cc893635bf58'; // frozenpay-foodies

  console.log(`Running direct query on sale_items for storeId=${storeId}...`);
  const { data: salesRaw, error } = await supabase
    .from('sale_items')
    .select(`
      id,
      quantity,
      subtotal,
      unit_price,
      unit_cost,
      created_at,
      is_deleted,
      products (name),
      sales_sessions!inner (
        id,
        started_at,
        status,
        approval_status,
        users!manager_id (full_name)
      )
    `)
    .eq('store_id', storeId)
    .eq('sales_sessions.status', 'closed')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Query error:', error);
    return;
  }

  console.log(`Query returned ${salesRaw.length} rows.`);
  const matchingRows = salesRaw.filter(r => r.sales_sessions?.id === '41e11101-f42a-4d23-9a28-1bc0690abbab');
  console.log('Matching rows for session 41e11101-f42a-4d23-9a28-1bc0690abbab:', matchingRows);

  // Let's also check if there is a plan-based filter that limits results
  const { data: store } = await supabase
    .from('stores')
    .select('plan, is_billing_exempt')
    .eq('id', storeId)
    .single();
  console.log('Store plan:', store);
}

main().catch(console.error);
