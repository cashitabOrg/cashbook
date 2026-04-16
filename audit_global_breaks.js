const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://imlnfwxfswxbxmtfrarr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbG5md3hmc3d4YnhtdGZyYXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg2Mjk1NiwiZXhwIjoyMDkwNDM4OTU2fQ.VyD08G2ixdgHedLkOdSPxnFZ7QCtCL-nB6DHCGQNlIo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findGlobalSequenceBreaks() {
  console.log("=== SEARCHING FOR GLOBAL LEDGER SEQUENCE BREAKS (Last 7 Days) ===");

  const { data: store } = await supabase.from('stores').select('id').eq('slug', 'frozenpay-foodies').single();
  const storeId = store.id;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: movements, error } = await supabase
    .from('inventory_movements')
    .select('*, products(name)')
    .eq('store_id', storeId)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('product_id')
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error fetching movements:", error.message);
    return;
  }

  console.log(`Analyzing ${movements.length} movements...`);

  const productBreaks = {};

  for (let i = 1; i < movements.length; i++) {
    const m = movements[i];
    const prev = movements[i-1];

    if (m.product_id === prev.product_id) {
       const diff = Math.abs(Number(m.quantity_before) - Number(prev.quantity_after));
       if (diff > 0.01) {
          const prodName = m.products.name;
          if (!productBreaks[prodName]) productBreaks[prodName] = [];
          productBreaks[prodName].push({
            time: m.created_at,
            prevAfter: prev.quantity_after,
            currentBefore: m.quantity_before,
            diff: diff
          });
       }
    }
  }

  const affectedProducts = Object.keys(productBreaks);
  console.log(`\nFound breaks in ${affectedProducts.length} products:`);
  
  affectedProducts.forEach(name => {
    console.log(`\n[${name}] - ${productBreaks[name].length} breaks:`);
    productBreaks[name].slice(0, 3).forEach(b => {
      console.log(`  - ${b.time}: GAP OF ${b.diff.toFixed(2)} units (${b.prevAfter} -> ${b.currentBefore})`);
    });
    if (productBreaks[name].length > 3) console.log(`  ... and ${productBreaks[name].length - 3} more.`);
  });
}

findGlobalSequenceBreaks();
