import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function testDirectQuery() {
  console.log('--- DIRECT SALE ITEMS IN-DEPTH INSPECTION ---');
  
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars: any = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

  const sessionId = '6057ea06-a27c-43ab-ae98-53ddb6a9a936'; // the closed session with revenue 25

  const { data: items, error } = await supabase
    .from('sale_items')
    .select('id, session_id, product_id, quantity, subtotal, created_at, is_deleted, products(name)')
    .eq('session_id', sessionId);

  if (error) {
    console.error('❌ Error fetching items:', error);
  } else {
    console.log(`✅ Succeeded! Found ${items?.length} items for session ${sessionId}:`);
    console.log(JSON.stringify(items, null, 2));
  }

  console.log('--- COMPLETE ---');
}

testDirectQuery().catch(console.error);
