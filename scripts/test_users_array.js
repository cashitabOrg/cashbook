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

  const { data: salesRaw, error } = await supabase
    .from('sale_items')
    .select(`
      id,
      sales_sessions!inner (
        id,
        users!manager_id (full_name)
      )
    `)
    .eq('store_id', storeId)
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const sale = salesRaw[0];
  console.log('sales_sessions:', JSON.stringify(sale.sales_sessions, null, 2));
}

main().catch(console.error);
