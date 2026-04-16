const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://imlnfwxfswxbxmtfrarr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbG5md3hmc3d4YnhtdGZyYXJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg2Mjk1NiwiZXhwIjoyMDkwNDM4OTU2fQ.VyD08G2ixdgHedLkOdSPxnFZ7QCtCL-nB6DHCGQNlIo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runStressTest() {
  console.log("=== LEDGER CONCURRENCY STRESS TEST (UNIT TEST) ===");

  const { data: store } = await supabase.from('stores').select('id').eq('slug', 'frozenpay-foodies').single();
  const storeId = store.id;

  // 1. Create a Test Product
  console.log("[1] Creating test product...");
  const { data: product, error: prodErr } = await supabase
    .from('products')
    .insert({
      store_id: storeId,
      name: `STRESS_TEST_${Date.now()}`,
      unit: 'kg',
      quantity: 1000, // Large starting quantity
      selling_price: 100,
      cost_price: 50
    })
    .select()
    .single();

  if (prodErr) throw prodErr;
  console.log(`Product created: ${product.name} with ID: ${product.id}`);

  // 2. Find a valid session for the test
  console.log("[2] Finding a valid session...");
  const { data: session } = await supabase.from('sales_sessions').select('id').eq('store_id', storeId).limit(1).single();
  if (!session) throw new Error("No session found to run test");

  // 3. Perform 20 Simultaneous Sale Insertions
  console.log("[3] Firing 20 simultaneous sale insertions...");
  const salePromises = [];
  for (let i = 0; i < 20; i++) {
    salePromises.push(
      supabase.from('sale_items').insert({
        store_id: storeId,
        session_id: session.id,
        product_id: product.id,
        quantity: 1,
        subtotal: 100,
        unit_price: 100,
        unit_cost: 50
      })
    );
  }

  const results = await Promise.all(salePromises);
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    console.error(`Encountered ${errors.length} errors during insertions:`);
    errors.slice(0, 3).forEach(e => console.error(`  - ${e.error.message}`));
  }

  // 3. Pause for a moment to let triggers finish
  console.log("[3] Waiting for ledger entries to stabilize...");
  await new Promise(r => setTimeout(r, 3000));

  // 4. Fetch the resulting ledger
  console.log("[4] Analyzing Ledger (inventory_movements)...");
  const { data: movements, error: movErr } = await supabase
    .from('inventory_movements')
    .select('*')
    .eq('product_id', product.id)
    .order('created_at', { ascending: true });

  if (movErr) throw movErr;

  console.log(`Found ${movements.length} movements.`);
  
  let overlaps = 0;
  let sequenceBreaks = 0;
  let mathErrors = 0;

  for (let i = 0; i < movements.length; i++) {
    const m = movements[i];
    const calcAfter = Number(m.quantity_before) + Number(m.quantity_change);
    const mathOk = Math.abs(calcAfter - Number(m.quantity_after)) < 0.01;
    
    if (!mathOk) {
       console.log(`  ❌ Math Error in row ${i}: ${m.quantity_before} + (${m.quantity_change}) = ${m.quantity_after}`);
       mathErrors++;
    }

    if (i > 0) {
       const prev = movements[i-1];
       if (Math.abs(Number(m.quantity_before) - Number(prev.quantity_after)) > 0.01) {
          console.log(`  ❌ Sequence Break at row ${i}: Prev After ${prev.quantity_after} != Current Before ${m.quantity_before}`);
          sequenceBreaks++;
       }
       if (Math.abs(Number(m.quantity_before) - Number(prev.quantity_before)) < 0.01) {
          console.log(`  ⚠️ OVERLAP DETECTED: Row ${i} and ${i-1} both started at ${m.quantity_before}`);
          overlaps++;
       }
    }
  }

  console.log("-----------------------------------------");
  console.log(`OVERLAPS (RACE CONDITIONS): ${overlaps}`);
  console.log(`SEQUENCE BREAKS: ${sequenceBreaks}`);
  console.log(`MATH ERRORS: ${mathErrors}`);
  console.log("-----------------------------------------");

  if (overlaps > 0 || sequenceBreaks > 0) {
    console.log("🚨 VERDICT: SYSTEM IS NOT CONCURRENCY SAFE!");
  } else {
    console.log("✅ VERDICT: SYSTEM PASSED STRESS TEST.");
  }

  // 5. Cleanup
  console.log("[5] Cleaning up test data...");
  await supabase.from('inventory_movements').delete().eq('product_id', product.id);
  await supabase.from('sale_items').delete().eq('product_id', product.id);
  await supabase.from('products').delete().eq('id', product.id);
  console.log("Cleanup complete.");
}

runStressTest().catch(console.error);
