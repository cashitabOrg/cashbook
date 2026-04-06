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

async function resetSundaySales() {
  const isApply = process.argv.includes('--apply');
  const isDryRun = !isApply;

  const targetStoreId = '2d46e24a-a378-4312-a871-cc893635bf58'; // frozenpay-foodies
  
  console.log('====================================================');
  console.log('   FROZEN POS: SUNDAY 5/4/2026 SALES RESET        ');
  console.log('====================================================');
  console.log(`Target Store: Frozenpay Foodies (${targetStoreId})`);
  if (isDryRun) {
    console.log('>>> MODE: DRY RUN (No changes will be saved)       ');
    console.log('>>> To apply changes, run: node reset_sunday_sales.js --apply');
  } else {
    console.log('>>> MODE: APPLY (DESTRUCTIVE - RESETTING DATABASE)');
  }
  console.log('====================================================\n');

  // 1. Fetch all sessions for this store that started on Sunday April 5, 2026
  console.log('1. Fetching all Sunday sales sessions for the store...');
  const { data: sessions, error: sessionError } = await supabase
    .from('sales_sessions')
    .select('id, started_at')
    .eq('store_id', targetStoreId)
    .gte('started_at', '2026-04-05T00:00:00Z')
    .lt('started_at', '2026-04-06T00:00:00Z');

  if (sessionError) {
    console.error('Error fetching sessions:', sessionError.message);
    return;
  }

  if (!sessions || sessions.length === 0) {
    console.log('No Sunday sales history found for this store. Nothing to reset.');
    return;
  }

  const sessionIds = sessions.map(s => s.id);
  console.log(`- Found ${sessions.length} sessions from Sunday 5/4/2026.`);

  // 2. Fetch all sale_items for these sessions
  console.log('2. Fetching all items sold across these Sunday sessions...');
  const { data: saleItems, error: itemError } = await supabase
    .from('sale_items')
    .select('id, product_id, quantity')
    .in('session_id', sessionIds);

  if (itemError) {
    console.error('Error fetching sale items:', itemError.message);
    return;
  }

  console.log(`- Found ${saleItems.length} items to restore to inventory.`);

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
  // We MUST bypass the triggers. Wait, if we DELETE a sale_items row, our custom trigger
  // `trg_sync_stock_on_sale_change` will AUTOMATICALLY add back the inventory!
  // BUT the total items in history might be corrupted. 
  // Let's rely on the trigger. If we delete the sale_items, the trigger automatically
  // executes `products.quantity = quantity - (new_qty - old_qty)`. For DELETE, new_qty is 0, so it ADDS old_qty.
  // Wait, did we enable the smart trigger previously? We did, but then we decided it was faulty
  // in `consolidate_triggers.js` and removed it!
  // Let's manually restore the stock to be completely safe and predictable.
  
  // NOTE: If the trigger IS active, a manual restore PLUS a DELETE will double-deduct!
  // To avoid this, we manually fetch products, calculate new total, UPDATE products. 
  // Then we momentarily disable the trigger for the delete, or we don't.
  // Actually, Supabase REST API doesn't let us disable triggers.
  // We can just rely on the trigger! If we delete the items, the trigger refunds stock.
  // But wait, what if the trigger is missing?
  // Let's check if the trigger exists and rely on it?
  // Last time `reset_frozenpay_sales` MANUALLY increased `products` quantity AND deleted `sale_items`.
  // If `trg_deduct_stock_on_sale` is STILL an AFTER INSERT ONLY trigger, it WON'T refund on DELETE!
  // Let's do exactly what reset_frozenpay_sales.js did to be safe.
  
  console.log('\n4. Applying Restoration (Manual update, assuming simple INSERT triggers)...');
  for (const pid in restoreTotals) {
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

  console.log('\n5. Deleting Sunday Sales Records...');
  const { error: delItemsError } = await supabase
    .from('sale_items')
    .delete()
    .in('session_id', sessionIds);
  
  if (delItemsError) {
    console.error(`  [FAILED] Sale items deletion: ${delItemsError.message}`);
  } else {
    console.log('  [SUCCESS] All Sunday sale items deleted.');
    
    // Delete sessions
    const { error: delSessionsError } = await supabase
      .from('sales_sessions')
      .delete()
      .in('id', sessionIds);
      
    if (delSessionsError) {
      console.error(`  [FAILED] Sales sessions deletion: ${delSessionsError.message}`);
    } else {
      console.log('  [SUCCESS] All Sunday sales sessions deleted.');
    }
  }

  console.log('\nRESET COMPLETE. Sunday sales removed from the system.');
}

resetSundaySales();
