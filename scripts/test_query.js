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

  console.log('Testing getReportSalesData query format on Supabase...');
  const { data, error } = await supabase
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
    console.error('❌ Error executing query:', error);
  } else {
    console.log(`✅ Success! Returned ${data.length} records.`);
    if (data.length > 0) {
      console.log('Sample record:', JSON.stringify(data[0], null, 2));
    }
    
    // Count per session
    const sessionCounts = {};
    data.forEach(item => {
      const sessId = item.sales_sessions?.id || 'Unknown';
      sessionCounts[sessId] = (sessionCounts[sessId] || 0) + 1;
    });
    console.log('Sales items per session in results:', sessionCounts);
  }
}

main().catch(console.error);
