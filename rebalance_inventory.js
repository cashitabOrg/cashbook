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

// 2. Main Logic
async function rebalanceInventory() {
  const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');
  
  console.log('====================================================');
  console.log('   FROZEN POS: INVENTORY RE-BALANCING SCRIPT        ');
  console.log('====================================================');
  if (isDryRun) {
    console.log('>>> MODE: DRY RUN (No changes will be saved)       ');
    console.log('>>> To apply changes, run: node rebalance_inventory.js --apply');
  } else {
    console.log('>>> MODE: LIVE (Applying changes to database!)     ');
  }
  console.log('====================================================\n');

  // 1. Get all products
  const { data: products, error: prodError } = await supabase.from('products').select('id, name, quantity, unit, store_id');
  if (prodError) {
    console.error('Error fetching products:', prodError.message);
    return;
  }

  let totalFixes = 0;

  for (const p of products) {
    // 2. Sum up all additions (including signed adjustments)
    const { data: added, error: addError } = await supabase.from('stock_additions').select('quantity_added').eq('product_id', p.id);
    if (addError) {
        console.error(`Error fetching additions for ${p.name}:`, addError.message);
        continue;
    }
    const totalAdded = added.reduce((acc, curr) => acc + Number(curr.quantity_added), 0);
    
    // 3. Sum up all recorded sales items
    const { data: sold, error: sellError } = await supabase.from('sale_items').select('quantity').eq('product_id', p.id);
    if (sellError) {
        console.error(`Error fetching sales for ${p.name}:`, sellError.message);
        continue;
    }
    const totalSold = sold.reduce((acc, curr) => acc + Number(curr.quantity), 0);
    
    const theoreticalStock = totalAdded - totalSold;
    const actualStock = Number(p.quantity);
    const discrepancy = actualStock - theoreticalStock;
    
    // Using a small epsilon for floating point comparison
    if (Math.abs(discrepancy) > 0.001) {
      console.log(`[MISMATCH] ${p.name}:`);
      console.log(`  Actual DB Stock:  ${actualStock.toFixed(2)} ${p.unit}`);
      console.log(`  Expected Stock:   ${theoreticalStock.toFixed(2)} ${p.unit} (Added: ${totalAdded} | Sold: ${totalSold})`);
      console.log(`  Adjustment:       ${theoreticalStock > actualStock ? '+' : ''}${(theoreticalStock - actualStock).toFixed(2)} ${p.unit}`);
      
      if (!isDryRun) {
        // APPLY CHANGE
        const { error: updateError } = await supabase
          .from('products')
          .update({ quantity: theoreticalStock })
          .eq('id', p.id);

        if (updateError) {
          console.error(`  [FAILED] Failed to update ${p.name}:`, updateError.message);
        } else {
          console.log(`  [SUCCESS] Updated ${p.name} to ${theoreticalStock.toFixed(2)}`);
          totalFixes++;
        }
      }
      console.log('----------------------------------------------------');
    }
  }

  if (totalFixes === 0 && !isDryRun) {
    console.log('\nNo discrepancies were found or corrected.');
  } else if (!isDryRun) {
    console.log(`\nDONE: Successfully re-balanced ${totalFixes} products.`);
  } else {
    console.log('\nDry run complete. No changes were made.');
  }
}

rebalanceInventory();
