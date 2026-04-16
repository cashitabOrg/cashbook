import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function debugDatabase() {
  console.log('--- DATABASE AUDIT STARTING ---');
  
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars: any = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

  console.log('1. Checking PRODUCTS table schema...');
  const { data: products, error: prodErr } = await supabase.from('products').select('*').limit(1);
  if (prodErr) {
    console.error('ERROR products:', prodErr);
  } else {
    console.log('Products Columns:', Object.keys(products?.[0] || {}));
  }

  console.log('\n2. Checking SALE_ITEMS table schema...');
  const { data: saleItems, error: saleErr } = await supabase.from('sale_items').select('*').limit(1);
  if (saleErr) {
    console.error('ERROR sale_items:', saleErr);
  } else {
    console.log('Sale Items Columns:', Object.keys(saleItems?.[0] || {}));
  }

  console.log('\n3. Checking INVENTORY_MOVEMENTS table schema...');
  const { data: movements, error: moveErr } = await supabase.from('inventory_movements').select('*').limit(1);
  if (moveErr) {
    console.error('ERROR inventory_movements:', moveErr);
  } else {
    console.log('Movements Columns:', Object.keys(movements?.[0] || {}));
  }

  console.log('\n4. Probing for specific STORE_ID data...');
  const STORE_ID = '2d46e24a-a378-4312-a871-cc893635bf58'; // from full_restoration script
  const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', STORE_ID);
  console.log(`Products in store ${STORE_ID}: ${prodCount}`);

  console.log('--- AUDIT COMPLETE ---');
}

debugDatabase().catch(console.error);
