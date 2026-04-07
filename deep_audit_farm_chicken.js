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

const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const farmChickenId = 'b1e5457e-cabb-4d52-9ea4-9868e5c03177';

async function deepAudit() {
  console.log('====================================================');
  console.log('   DEEP FORENSIC AUDIT: FARM CHICKEN              ');
  console.log('====================================================\n');

  // 1. Current Live State
  const { data: p } = await s.from('products').select('*').eq('id', farmChickenId).single();
  console.log('CURRENT DATABASE STATE:');
  console.log(`  - Name:          ${p.name}`);
  console.log(`  - Cloud Stock:   ${p.quantity.toFixed(2)}`);
  console.log(`  - Store ID:      ${p.store_id}`);
  console.log('');

  // 2. Total "Stocked In" (Additions)
  const { data: additions } = await s.from('stock_additions').select('quantity_added').eq('product_id', farmChickenId);
  const totalAdded = (additions || []).reduce((acc, curr) => acc + (curr.quantity_added || 0), 0);
  console.log('STOCK ADDITIONS (Restocks):');
  console.log(`  - Total In:      ${totalAdded.toFixed(2)}`);
  console.log('');

  // 3. Total Sales (All Time)
  const { data: sales } = await s.from('sale_items').select('quantity').eq('product_id', farmChickenId);
  const totalSold = (sales || []).reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  console.log('SALES RECORD (All Sessions):');
  console.log(`  - Total Sold:    ${totalSold.toFixed(2)}`);
  console.log('');

  // 4. Adjustments
  const { data: adjustments } = await s.from('stock_adjustments').select('quantity_change').eq('product_id', farmChickenId);
  const totalAdj = (adjustments || []).reduce((acc, curr) => acc + (curr.quantity_change || 0), 0);
  console.log('MANUAL ADJUSTMENTS:');
  console.log(`  - Net Change:    ${totalAdj.toFixed(2)}`);
  console.log('');

  // 5. Final Reconciliation
  const calculatedBalance = (totalAdded + totalAdj) - totalSold;
  console.log('RECONCILIATION CALCULATION:');
  console.log(`  (Stock In: ${totalAdded.toFixed(2)}) + (Adj: ${totalAdj.toFixed(2)}) - (Sold: ${totalSold.toFixed(2)})`);
  console.log(`  = EXPECTED:      ${calculatedBalance.toFixed(2)}`);
  console.log(`  = ACTUAL CLOUD:  ${p.quantity.toFixed(2)}`);
  
  const discrepancy = p.quantity - calculatedBalance;
  console.log(`\n  DISCREPANCY:     ${discrepancy.toFixed(2)}`);
  
  console.log('\n====================================================');
}

deepAudit();
