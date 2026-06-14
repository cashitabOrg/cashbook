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
  const sessionId = '41e11101-f42a-4d23-9a28-1bc0690abbab';

  console.log(`Fetching session details for ${sessionId}...`);
  const { data: session } = await supabase
    .from('sales_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  console.log('Session record:', session);

  console.log(`Fetching sale items for ${sessionId}...`);
  const { data: items, error } = await supabase
    .from('sale_items')
    .select('*, products(name)')
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error fetching items:', error);
    return;
  }

  console.log(`Found ${items.length} items for this session:`);
  items.forEach(item => {
    console.log(`Item: ID=${item.id} | Product=${item.products?.name} | Qty=${item.quantity} | Subtotal=${item.subtotal} | Deleted=${item.is_deleted}`);
  });
}

main().catch(console.error);
