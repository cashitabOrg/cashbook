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

async function reconcileAndFix() {
  const APPLY = process.argv.includes('--apply');
  console.log('====================================================');
  console.log('   FROZENPAY FOODIES: INVENTORY REPAIR TOOL       ');
  console.log('====================================================');
  if (!APPLY) console.log('   (DRY RUN MODE - No changes will be saved)    \n');
  else console.log('   (!!! LIVE MODE - Repairing Database !!!)      \n');

  const { data: products } = await supabase.from('products').select('id, name, quantity, unit');
  
  if (!products) return;

  for (const p of products) {
    // 1. Total Added
    const { data: added } = await supabase.from('stock_additions').select('quantity_added').eq('product_id', p.id);
    const totalAdded = (added || []).reduce((acc, curr) => acc + Number(curr.quantity_added), 0);
    
    // 2. Total Sold
    const { data: sold } = await supabase.from('sale_items').select('quantity').eq('product_id', p.id);
    const totalSold = (sold || []).reduce((acc, curr) => acc + Number(curr.quantity), 0);
    
    // 3. Total Adjusted
    const { data: adj } = await supabase.from('stock_adjustments').select('quantity_change').eq('product_id', p.id);
    const totalAdjusted = (adj || []).reduce((acc, curr) => acc + Number(curr.quantity_change), 0);
    
    const theoreticalStock = totalAdded + totalAdjusted - totalSold;
    const actualStock = Number(p.quantity);
    const discrepancy = actualStock - theoreticalStock;
    
    if (Math.abs(discrepancy) > 0.001) {
      console.log(`[FIXING] ${p.name.padEnd(20)}: ${actualStock.toFixed(2)} -> ${theoreticalStock.toFixed(2)} (${p.unit})`);
      
      if (APPLY) {
        const { error } = await supabase
          .from('products')
          .update({ quantity: theoreticalStock })
          .eq('id', p.id);
        
        if (error) {
          console.error(`  - ERROR updating ${p.name}:`, error.message);
        } else {
          console.log(`  - SUCCESS: Database updated.`);
        }
      }
    }
  }

  if (!APPLY) {
    console.log('\n====================================================');
    console.log('To apply these changes and fix your database, run:');
    console.log('node reconcile_and_fix_inventory.js --apply');
  }
}

reconcileAndFix();
