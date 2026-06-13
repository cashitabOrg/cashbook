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

  // Fetch all products for Bishop Frozens
  console.log('Fetching products for Bishop Frozens...');
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, quantity, selling_price, cost_price')
    .eq('store_id', 'c00cc824-6dd1-43cb-9c44-04384ed33040');

  if (error) {
    console.error('Error:', error);
    return;
  }

  products.forEach(p => {
    console.log(`Product: Name="${p.name}" | Qty=${p.quantity} | Price=${p.selling_price}`);
  });
}

main().catch(console.error);
