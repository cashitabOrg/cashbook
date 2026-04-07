const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 1. Load Environment Variables
const envLocal = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envLocal.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join('=').trim();
        env[k] = v;
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

const storeId = '2d46e24a-a378-4312-a871-cc893635bf58';

async function reconcile() {
  console.log('====================================================');
  console.log('   FROZENPAY FOODIES: STOCK RECONCILIATION        ');
  console.log('====================================================\n');

  // 1. Fetch current live products
  const { data: products } = await supabase
    .from('products')
    .select('id, name, quantity, unit')
    .eq('store_id', storeId)
    .order('name');

  if (!products) return;

  // 2. Fetch all sales for Sunday (April 5)
  const { data: sundayItems } = await supabase
    .from('sale_items')
    .select('product_id, quantity')
    .eq('store_id', storeId)
    .gte('created_at', '2026-04-05T00:00:00Z')
    .lt('created_at', '2026-04-06T00:00:00Z');

  // 3. Fetch all sales for Today (April 6)
  const { data: todayItems } = await supabase
    .from('sale_items')
    .select('product_id, quantity')
    .eq('store_id', storeId)
    .gte('created_at', '2026-04-06T00:00:00Z')
    .lt('created_at', '2026-04-07T00:00:00Z');

  // Map quantities
  const sundayQty = {};
  const todayQty = {};
  
  (sundayItems || []).forEach(item => {
    sundayQty[item.product_id] = (sundayQty[item.product_id] || 0) + Number(item.quantity);
  });

  (todayItems || []).forEach(item => {
    todayQty[item.product_id] = (todayQty[item.product_id] || 0) + Number(item.quantity);
  });

  console.log('Product Name'.padEnd(20) | 'Current Stock'.padEnd(15) | 'Sunday Sold'.padEnd(15) | 'Today Sold'.padEnd(15));
  console.log('-'.repeat(65));

  products.forEach(p => {
    const sSold = (sundayQty[p.id] || 0).toFixed(2);
    const tSold = (todayQty[p.id] || 0).toFixed(2);
    const current = Number(p.quantity).toFixed(2);
    
    console.log(`${p.name.padEnd(20)} | ${current.padEnd(15)} | ${sSold.padEnd(15)} | ${tSold.padEnd(15)}`);
  });

  console.log('\nNOTE: "Sunday Sold" represents the 143 items currently in the database.');
  console.log('When you run the WIPE & INJECT, the "Current Stock" will first increase by "Sunday Sold",');
  console.log('and then decrease by the new 154 entries you type in.');
  console.log('Today\'s 31 items have already been deducted from the "Current Stock".');
  console.log('\n====================================================');
}

reconcile();
