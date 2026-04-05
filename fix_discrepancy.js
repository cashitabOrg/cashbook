const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envLocal.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function fixInventory() {
  console.log('--- Fixing Inventory Discrepancy ---');
  
  const { data: products } = await supabase.from('products').select('id, name, quantity, unit');
  
  for (const p of products) {
    const { data: added } = await supabase.from('stock_additions').select('quantity_added').eq('product_id', p.id);
    const totalAdded = (added || []).reduce((acc, curr) => acc + Number(curr.quantity_added), 0);
    
    const { data: sold } = await supabase.from('sale_items').select('quantity').eq('product_id', p.id);
    const totalSold = (sold || []).reduce((acc, curr) => acc + Number(curr.quantity), 0);
    
    const theoreticalStock = totalAdded - totalSold;
    const actualStock = Number(p.quantity);
    const discrepancy = actualStock - theoreticalStock;
    
    if (Math.abs(discrepancy) > 0.001) {
      console.log(`[FIXING] ${p.name}: Actual ${actualStock.toFixed(2)} -> Theoretical ${theoreticalStock.toFixed(2)}`);
      const { error } = await supabase
        .from('products')
        .update({ quantity: theoreticalStock })
        .eq('id', p.id);
      
      if (error) {
        console.error(`Failed to update ${p.name}:`, error.message);
      } else {
        console.log(`Successfully updated ${p.name}`);
      }
    }
  }
  console.log('--- Done ---');
}
fixInventory();
