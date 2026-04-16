import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function runDiagnostic() {
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars: any = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

  console.log('=== STEP 1: Fetch a real sale_item to test with ===');
  const { data: item } = await supabase
    .from('sale_items')
    .select('id, product_id, quantity, subtotal, is_deleted, session_id, store_id')
    .eq('is_deleted', false)
    .limit(1)
    .single();
  
  if (!item) { console.error('No active sale_items found. Cannot test.'); return; }
  console.log('Test Item:', item);

  console.log('\n=== STEP 2: Check product stock BEFORE edit ===');
  const { data: prodBefore } = await supabase
    .from('products')
    .select('id, name, quantity')
    .eq('id', item.product_id)
    .single();
  console.log('Product BEFORE:', prodBefore);

  console.log('\n=== STEP 3: Count inventory_movements BEFORE edit ===');
  const { count: movCountBefore } = await supabase
    .from('inventory_movements')
    .select('*', { count: 'exact', head: true })
    .eq('reference_id', item.id);
  console.log('Movements for this item before:', movCountBefore);

  console.log('\n=== STEP 4: Perform a real UPDATE (change subtotal by 0.01 and back to test trigger) ===');
  const newQty = (Number(item.quantity) + 1); // increment qty by 1 to test stock adjustment
  const { error: updateErr } = await supabase
    .from('sale_items')
    .update({ quantity: newQty })
    .eq('id', item.id);
  
  if (updateErr) {
    console.error('UPDATE FAILED:', updateErr);
    return;
  }
  console.log(`Updated quantity from ${item.quantity} → ${newQty}`);

  // Wait a moment for async trigger
  await new Promise(r => setTimeout(r, 1500));

  console.log('\n=== STEP 5: Check product stock AFTER edit ===');
  const { data: prodAfter } = await supabase
    .from('products')
    .select('id, name, quantity')
    .eq('id', item.product_id)
    .single();
  console.log('Product AFTER:', prodAfter);
  
  const expectedQty = Number(prodBefore?.quantity) - 1; // we sold 1 more, stock should drop by 1
  if (prodAfter?.quantity === expectedQty) {
    console.log('✅ TRIGGER IS WORKING: Stock updated correctly!');
  } else {
    console.error(`❌ TRIGGER FAILED: Expected stock ${expectedQty}, got ${prodAfter?.quantity}`);
  }

  console.log('\n=== STEP 6: Check inventory_movements AFTER edit ===');
  const { count: movCountAfter } = await supabase
    .from('inventory_movements')
    .select('*', { count: 'exact', head: true })
    .eq('reference_id', item.id);
  console.log('Movements for this item after:', movCountAfter);
  
  if ((movCountAfter || 0) > (movCountBefore || 0)) {
    console.log('✅ LEDGER IS WORKING: New movement logged!');
  } else {
    console.error('❌ LEDGER FAILED: No new movement was created. The trigger is NOT firing.');
  }

  console.log('\n=== STEP 7: Revert the change ===');
  await supabase.from('sale_items').update({ quantity: item.quantity }).eq('id', item.id);
  console.log('Reverted test change.');
  
  console.log('\n=== DIAGNOSTIC COMPLETE ===');
}

runDiagnostic().catch(console.error);
