import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function testInQueryOne() {
  console.log('--- TESTING IN QUERY ONE ---');
  
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars: any = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

  const sessionIds = [
    '6057ea06-a27c-43ab-ae98-53ddb6a9a936'
  ];

  console.log('Running query for session:', sessionIds);
  const { data, error } = await supabase
    .from('sale_items')
    .select('id, session_id, product_id, quantity, subtotal')
    .in('session_id', sessionIds);

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log(`✅ Success! Count: ${data?.length}`);
  }

  console.log('--- DONE ---');
  process.exit(0);
}

testInQueryOne().catch(err => {
  console.error(err);
  process.exit(1);
});
