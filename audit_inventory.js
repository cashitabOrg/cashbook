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
  const { data: products } = await supabase.from('products').select('id, name, quantity, unit, store_id, stores(name)');
  
  let totalMismatches = 0;
  let totalClean = 0;

  for (const p of products) {
    // 2. Total Added (only this product's correct store)
    const { data: added } = await supabase.from('stock_additions').select('quantity_added').eq('product_id', p.id).eq('store_id', p.store_id);
    const totalAdded = (added || []).reduce((acc, curr) => acc + Number(curr.quantity_added), 0);
    
    // 3. Total Sold (only this product's correct store)
    const { data: sold } = await supabase.from('sale_items').select('quantity').eq('product_id', p.id).eq('store_id', p.store_id);
    const totalSold = (sold || []).reduce((acc, curr) => acc + Number(curr.quantity), 0);
    
    // 4. Total Adjusted (adjustments don't have store_id so use product_id only)
    const { data: adj } = await supabase.from('stock_adjustments').select('quantity_change').eq('product_id', p.id);
    const totalAdjusted = (adj || []).reduce((acc, curr) => acc + Number(curr.quantity_change), 0);
    
    const theoreticalStock = totalAdded + totalAdjusted - totalSold;
    const actualStock = Number(p.quantity);
    const discrepancy = actualStock - theoreticalStock;
    const storeName = p.stores?.name || p.store_id;
    
    if (Math.abs(discrepancy) > 0.001) {
      totalMismatches++;
      console.log(`[MISMATCH] ${p.name} (${storeName}):`);
      console.log(`  Added: ${totalAdded.toFixed(2)} | Adjusted: ${totalAdjusted.toFixed(2)} | Sold: ${totalSold.toFixed(2)}`);
      console.log(`  Theoretical: ${theoreticalStock.toFixed(2)} | Actual in DB: ${actualStock.toFixed(2)}`);
      console.log(`  Discrepancy: ${discrepancy.toFixed(2)} ${p.unit}`);
      console.log(`  Fix: ${discrepancy < 0 ? 'Stock was deducted but sale NOT recorded' : 'Missing stock additions or over-inflated quantity'}`);
      console.log('-----------------------------------');
    } else {
      totalClean++;
      console.log(`[OK] ${p.name.padEnd(25)} | Store: ${storeName.padEnd(20)} | Stock: ${actualStock.toFixed(2)} ${p.unit}`);
    }
  }

  console.log('\n=== AUDIT COMPLETE ===');
  console.log(`✅ Clean products:     ${totalClean}`);
  console.log(`❌ Mismatched products: ${totalMismatches}`);

  if (totalMismatches === 0) {
    console.log('\n🎉 ALL PRODUCTS ARE CLEAN. Database matches transaction history perfectly.');
  } else {
    console.log(`\n⚠️  ${totalMismatches} product(s) need attention. Review the [MISMATCH] entries above.`);
  }
}

auditInventory();
