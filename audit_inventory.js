const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

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

async function auditInventory() {
  console.log('--- Inventory Discrepancy Audit ---');
  
  // 1. Get all products
  const { data: products } = await supabase.from('products').select('id, name, quantity, unit');
  
  for (const p of products) {
    // 2. Total Added
    const { data: added } = await supabase.from('stock_additions').select('quantity_added').eq('product_id', p.id);
    const totalAdded = (added || []).reduce((acc, curr) => acc + Number(curr.quantity_added), 0);
    
    // 3. Total Sold
    const { data: sold } = await supabase.from('sale_items').select('quantity').eq('product_id', p.id);
    const totalSold = (sold || []).reduce((acc, curr) => acc + Number(curr.quantity), 0);
    
    const theoreticalStock = totalAdded - totalSold;
    const actualStock = Number(p.quantity);
    const discrepancy = actualStock - theoreticalStock;
    
    if (Math.abs(discrepancy) > 0.001) {
      console.log(`[MISMATCH] ${p.name}:`);
      console.log(`  Added: ${totalAdded.toFixed(2)} | Sold: ${totalSold.toFixed(2)}`);
      console.log(`  Theoretical: ${theoreticalStock.toFixed(2)} | Actual in DB: ${actualStock.toFixed(2)}`);
      console.log(`  Discrepancy: ${discrepancy.toFixed(2)} ${p.unit}`);
      console.log(`  Fix: ${discrepancy < 0 ? 'Stock was deducted but sale NOT recorded' : 'Missing stock additions'}`);
      console.log('-----------------------------------');
    }
  }
}

auditInventory();
