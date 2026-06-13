import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function testInQuery() {
  console.log('--- TESTING IN QUERY FOR SALE ITEMS ---');
  
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars: any = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

  const sessionIds = [
    '6057ea06-a27c-43ab-ae98-53ddb6a9a936',
    '733ac7a2-7020-49cb-a9dc-183fe7d92f85',
    'd8f42c41-a4e7-4385-9e26-b78de07095ad',
    '4641ea42-7077-4306-a158-972c110002a0'
  ];

  console.log('Running in query...');
  const { data, error } = await supabase
    .from('sale_items')
    .select('id, session_id, product_id, quantity, subtotal, created_at, is_deleted, products(name)')
    .in('session_id', sessionIds)
    .limit(500);

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log(`✅ Success! Count: ${data?.length}`);
    data?.forEach(item => {
      console.log(`Item ID: ${item.id} | Session ID: ${item.session_id} | Product: ${item.products?.name} | Subtotal: ${item.subtotal}`);
    });
  }

  console.log('--- COMPLETE ---');
}

testInQuery().catch(console.error);
