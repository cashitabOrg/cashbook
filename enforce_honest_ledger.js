const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://imlnfwxfswxbxmtfrarr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbG5md3hmc3d4YnhtdGZyYXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg2Mjk1NiwiZXhwIjoyMDkwNDM4OTU2fQ.VyD08G2ixdgHedLkOdSPxnFZ7QCtCL-nB6DHCGQNlIo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function enforceHonestLedger() {
  console.log("=====================================================");
  console.log("   ROLLBACK & STRICT LEDGER ENFORCEMENT PROTOCOL");
  console.log("=====================================================");
  
  const { data: store } = await supabase.from('stores').select('id, name').eq('slug', 'frozenpay-foodies').single();
  if (!store) return console.error("Store not found!");

  // Step 1: Destroy the fake "Auto-Heal" adjustments I just made.
  // We must not hide the gaps! The business must see the gaps to track theft/loss.
  console.log("[1] Purging the fake 'Auto-Heal' system adjustments to restore tracking visibility...");
  const { error: deleteError, count } = await supabase
    .from('stock_adjustments')
    .delete({ count: 'exact' })
    .eq('note', '[Auto-Heal] Bridging dropped sales from constraint bug');

  if (deleteError) {
      console.error("Failed to rollback fake adjustments:", deleteError.message);
  } else {
      console.log(`---> Successfully erased ${count || 0} fake bridging records.\n`);
  }

  // Step 2: Recalculate the HONEST Ledger (Expected) for every product
  console.log("[2] Calculating mathematically undeniable stock levels based strictly on historical receipts...");
  
  const { data: products } = await supabase.from('products').select('id, name, quantity').eq('store_id', store.id);
  const { data: additions } = await supabase.from('stock_additions').select('product_id, quantity_added').eq('store_id', store.id);
  const { data: adjustments } = await supabase.from('stock_adjustments').select('product_id, quantity_change').eq('store_id', store.id);
  const { data: sales } = await supabase.from('sale_items').select('product_id, quantity').eq('store_id', store.id);

  let enforcementCount = 0;

  for (const product of products || []) {
    const productAdditions = (additions || []).filter(a => a.product_id === product.id).reduce((sum, a) => sum + Number(a.quantity_added), 0);
    const productAdjustments = (adjustments || []).filter(a => a.product_id === product.id).reduce((sum, a) => sum + Number(a.quantity_change), 0);
    const productSales = (sales || []).filter(s => s.product_id === product.id).reduce((sum, s) => sum + Number(s.quantity), 0);

    // This is the absolute truth of the business (The Ledger)
    let strictExpectedStock = productAdditions + productAdjustments - productSales;
    const currentFloatingStock = Number(product.quantity);
    
    // If the database's floating quantity number has drifted away from the Strict Ledger:
    if (Math.abs(strictExpectedStock - currentFloatingStock) > 0.01) {
      
      console.log(`[${product.name}] Forcing Quantity to match Ledger...`);
      console.log(`  Floating value was: ${currentFloatingStock.toFixed(2)} | True Ledger Math: ${strictExpectedStock.toFixed(2)}`);

      // Overwrite the products.quantity to enforce strict history!
      const { error } = await supabase
        .from('products')
        .update({ quantity: strictExpectedStock })
        .eq('id', product.id);

      if (error) {
         console.error(`  ERROR updating ${product.name}:`, error.message);
      } else {
         console.log(`  SUCCESS! Quantity securely locked to ${strictExpectedStock.toFixed(2)}\n`);
         enforcementCount++;
      }
    }
  }
  
  console.log("=====================================================");
  console.log(`   ENFORCEMENT COMPLETE! Overwrote ${enforcementCount} products to strict ledger metrics.`);
  console.log("   The application is now 100% honest. Missing physical stock MUST be investigated.");
  console.log("=====================================================");
}

enforceHonestLedger();
