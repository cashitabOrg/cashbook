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

async function resetSales() {
  const isApply = process.argv.includes('--apply');
  const isDryRun = !isApply;

  const targetStoreId = '2d46e24a-a378-4312-a871-cc893635bf58'; // frozenpay-foodies (Definitive ID)
  
  console.log('====================================================');
  console.log('   FROZEN POS: SALES RESET & INVENTORY RESTORE     ');
  console.log('====================================================');
  console.log(`Target Store: Kenny Store (${targetStoreId})`);
  if (isDryRun) {
    console.log('>>> MODE: DRY RUN (No changes will be saved)       ');
    console.log('>>> To apply changes, run: node reset_frozenpay_sales.js --apply');
  } else {
    console.log('>>> MODE: APPLY (DESTRUCTIVE - RESETTING DATABASE)');
  }
  console.log('====================================================\n');

  // 1. Fetch all sessions for specifically this store
  console.log('1. Fetching all sales sessions for the store...');
  const { data: sessions, error: sessionError } = await supabase
    .from('sales_sessions')
    .select('id')
    .eq('store_id', targetStoreId);

  if (sessionError) {
    console.error('Error fetching sessions:', sessionError.message);
    return;
  }

  if (!sessions || sessions.length === 0) {
    console.log('No sales history found for this store. Nothing to reset.');
    return;
  }

  const sessionIds = sessions.map(s => s.id);
  console.log(`- Found ${sessions.length} sessions.`);

  // 2. Fetch all sale_items for these sessions
  console.log('2. Fetching all items sold across these sessions...');
  const { data: saleItems, error: itemError } = await supabase
    .from('sale_items')
    .select('id, product_id, quantity')
    .in('session_id', sessionIds);

  if (itemError) {
    console.error('Error fetching sale items:', itemError.message);
    return;
  }

  console.log(`- Found ${saleItems.length} items to restore.`);

  // 3. Aggregate totals to add back per product
  const restoreTotals = {};
  saleItems.forEach(item => {
    if (!restoreTotals[item.product_id]) restoreTotals[item.product_id] = 0;
    restoreTotals[item.product_id] += Number(item.quantity);
  });

  console.log('\n3. Restoration Plan (Inventory to Add Back):');
  for (const pid in restoreTotals) {
    console.log(`- Product ${pid}: +${restoreTotals[pid]} units`);
  }

  if (isDryRun) {
    console.log('\nDry run complete. No changes made.');
    return;
  }

  // --- APPLY MODIFICATIONS ---
  console.log('\n4. Applying Restoration...');
  for (const pid in restoreTotals) {
    // Fetch current qty
    const { data: product } = await supabase.from('products').select('quantity, name').eq('id', pid).single();
    if (product) {
      const newQty = Number(product.quantity) + restoreTotals[pid];
      const { error: updateError } = await supabase
        .from('products')
        .update({ quantity: newQty })
        .eq('id', pid);
        
      if (updateError) {
        console.error(`  [FAILED] ${product.name}: ${updateError.message}`);
      } else {
        console.log(`  [SUCCESS] ${product.name}: Restored to ${newQty.toFixed(2)}`);
      }
    }
  }

  console.log('\n5. Deleting Sales Records...');
  // Delete sale items first
  const { error: delItemsError } = await supabase
    .from('sale_items')
    .delete()
    .in('session_id', sessionIds);
  
  if (delItemsError) {
    console.error(`  [FAILED] Sale items deletion: ${delItemsError.message}`);
  } else {
    console.log('  [SUCCESS] All sale items deleted.');
    
    // Delete sessions
    const { error: delSessionsError } = await supabase
      .from('sales_sessions')
      .delete()
      .eq('store_id', targetStoreId);
      
    if (delSessionsError) {
      console.error(`  [FAILED] Sales sessions deletion: ${delSessionsError.message}`);
    } else {
      console.log('  [SUCCESS] All sales sessions deleted.');
    }
  }

  console.log('\nRESET COMPLETE. The store is now a clean slate.');
}

resetSales();
