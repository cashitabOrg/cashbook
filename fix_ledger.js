const { createClient } = require('@supabase/supabase-js');

// Connect to SuperAdmin account to bypass row-level-security
const supabaseUrl = 'https://imlnfwxfswxbxmtfrarr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbG5md3hmc3d4YnhtdGZyYXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg2Mjk1NiwiZXhwIjoyMDkwNDM4OTU2fQ.VyD08G2ixdgHedLkOdSPxnFZ7QCtCL-nB6DHCGQNlIo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLedger() {
  console.log("==========================================");
  console.log("   INITIATING DATABASE AUTO-HEAL...       ");
  console.log("==========================================");
  
  const { data: store } = await supabase.from('stores').select('id, name').eq('slug', 'frozenpay-foodies').single();
  if (!store) return console.error("Store not found!");

  // Get current state
  const { data: products } = await supabase.from('products').select('id, name, quantity').eq('store_id', store.id);
  const { data: additions } = await supabase.from('stock_additions').select('product_id, quantity_added').eq('store_id', store.id);
  const { data: adjustments } = await supabase.from('stock_adjustments').select('product_id, quantity_change').eq('store_id', store.id);
  const { data: sales } = await supabase.from('sale_items').select('product_id, quantity').eq('store_id', store.id);

  let fixCount = 0;

  for (const product of products || []) {
    const productAdditions = (additions || []).filter(a => a.product_id === product.id).reduce((sum, a) => sum + Number(a.quantity_added), 0);
    const productAdjustments = (adjustments || []).filter(a => a.product_id === product.id).reduce((sum, a) => sum + Number(a.quantity_change), 0);
    const productSales = (sales || []).filter(s => s.product_id === product.id).reduce((sum, s) => sum + Number(s.quantity), 0);

    let expectedStock = productAdditions + productAdjustments - productSales;
    const actualStock = Number(product.quantity);
    
    // Using 0.01 to handle minor JS float rounding errors
    if (Math.abs(expectedStock - actualStock) > 0.01) {
      // If expected is 33 but actual is 30, the change we need to make is -3.
      // So change = actual - expected.
      const correctiveChange = actualStock - expectedStock;
      
      console.log(`[${product.name}] Discrepancy Found!`);
      console.log(`  Expected: ${expectedStock.toFixed(2)} | DB Actual: ${actualStock.toFixed(2)}`);
      console.log(`  --> Injecting Adjustment: ${correctiveChange.toFixed(2)} units`);

      // Inject the adjustment row into the database
      const { error } = await supabase.from('stock_adjustments').insert({
        store_id: store.id,
        product_id: product.id,
        quantity_change: correctiveChange,
        reason: 'Correction',
        note: '[Auto-Heal] Bridging dropped sales from constraint bug'
      });

      if (error) {
         console.error(`  ERROR inserting fix for ${product.name}:`, error.message);
      } else {
         console.log(`  SUCCESS! Ledger updated for ${product.name}.\n`);
         fixCount++;
      }
    }
  }
  
  console.log("==========================================");
  console.log(`   AUTO-HEAL COMPLETE! Fixed ${fixCount} products.`);
  console.log("==========================================");
}

fixLedger();
