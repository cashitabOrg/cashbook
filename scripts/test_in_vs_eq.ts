import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function testInVsEq() {
  console.log('--- TESTING EQ VS IN ---');
  
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars: any = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);
  const sessionId = '6057ea06-a27c-43ab-ae98-53ddb6a9a936';

  console.log('1. Running EQ query...');
  const resEq = await supabase
    .from('sale_items')
    .select('id, session_id, product_id, quantity, subtotal')
    .eq('session_id', sessionId);
  
  console.log('EQ success! Count:', resEq.data?.length, 'Error:', resEq.error);

  console.log('2. Running IN query...');
  const resIn = await supabase
    .from('sale_items')
    .select('id, session_id, product_id, quantity, subtotal')
    .in('session_id', [sessionId]);

  console.log('IN success! Count:', resIn.data?.length, 'Error:', resIn.error);

  console.log('--- DONE ---');
  process.exit(0);
}

testInVsEq().catch(err => {
  console.error(err);
  process.exit(1);
});
