const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://imlnfwxfswxbxmtfrarr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbG5md3hmc3d4YnhtdGZyYXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg2Mjk1NiwiZXhwIjoyMDkwNDM4OTU2fQ.VyD08G2ixdgHedLkOdSPxnFZ7QCtCL-nB6DHCGQNlIo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log("==========================================");
  console.log("   FROZENPAYFOODIES INVENTORY AUDIT   ");
  console.log("==========================================");
  
  // 1. Get Store ID
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, name')
    .eq('slug', 'frozenpay-foodies')
    .single();

  if (storeError || !store) {
    console.error("Store 'frozenpay-foodies' not found.");
    return;
  }

  // 2. Fetch baseline data
  const { data: products } = await supabase.from('products').select('id, name, quantity').eq('store_id', store.id);
  const { data: additions } = await supabase.from('stock_additions').select('product_id, quantity_added').eq('store_id', store.id);
  const { data: adjustments } = await supabase.from('stock_adjustments').select('product_id, quantity_change').eq('store_id', store.id);
  const { data: sales } = await supabase.from('sale_items').select('product_id, quantity').eq('store_id', store.id);

  console.log(`Auditing ${products?.length || 0} Products...\n`);
  
  // Output Headers
  console.log( // Max width 120
      "PRODUCT NAME".padEnd(25) + 
      "| RESTOCK ".padEnd(11) + 
      "| CORRECTIONS ".padEnd(15) + 
      "| SOLD ".padEnd(8) + 
      "| EXPECTED ".padEnd(12) + 
      "| ACTUAL DB ".padEnd(12) +
      "| DIFF (LOST)"
  );
  console.log("-".repeat(98));

  for (const product of products || []) {
    // Math Aggregations
    const productAdditions = (additions || []).filter(a => a.product_id === product.id).reduce((sum, a) => sum + Number(a.quantity_added), 0);
    const productAdjustments = (adjustments || []).filter(a => a.product_id === product.id).reduce((sum, a) => sum + Number(a.quantity_change), 0);
    const productSales = (sales || []).filter(s => s.product_id === product.id).reduce((sum, s) => sum + Number(s.quantity), 0);

    // Expected calculation (Historical theoretical stock)
    let expectedStock = productAdditions + productAdjustments - productSales;
    
    const actualStock = Number(product.quantity);
    const diff = expectedStock - actualStock;
    const discrepancy = Math.abs(diff) > 0.01;
    
    // Format the output
    const outName = (product.name.length > 23 ? product.name.substring(0, 20) + "..." : product.name).padEnd(25);
    const outAdd = productAdditions.toFixed(2).padEnd(8);
    const outAdj = productAdjustments.toFixed(2).padEnd(12);
    const outSold = productSales.toFixed(2).padEnd(5);
    const outExp = expectedStock.toFixed(2).padEnd(9);
    const outAct = actualStock.toFixed(2).padEnd(9);
    const outDiff = diff.toFixed(2).padEnd(9);
    
    let flag = discrepancy ? "   <-- DISCREPANCY!" : "";

    console.log(`${outName}| ${outAdd} | ${outAdj} | ${outSold} | ${outExp} | ${outAct} | ${outDiff}${flag}`);
  }
}

runAudit();
