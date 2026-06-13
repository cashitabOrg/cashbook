import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function testWithRetry() {
  console.log('--- DIAGNOSING getManagerHistory RETRY ISSUE ---');
  
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars: any = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

  const storeId = '2d46e24a-a378-4312-a871-cc893635bf58';
  const managerId = 'b0417c76-b323-451e-98a6-623a5456918d';

  // Build the query object ONCE
  let query = supabase
    .from('sales_sessions')
    .select('id, started_at, ended_at, total_revenue, status, approval_status')
    .eq('store_id', storeId)
    .eq('manager_id', managerId)
    .eq('status', 'closed')
    .order('started_at', { ascending: false });

  // Attempt 1
  console.log('Attempt 1...');
  const res1 = await query;
  console.log('Attempt 1 Error:', res1.error);
  console.log('Attempt 1 Data count:', res1.data?.length);

  // Attempt 2 (simulating what withRetry does: awaiting the same query object again)
  console.log('\nAttempt 2 (awaiting the same query object)...');
  const res2 = await query;
  console.log('Attempt 2 Error:', res2.error);
  console.log('Attempt 2 Data count:', res2.data?.length);

  console.log('\n--- DIAGNOSTIC COMPLETE ---');
}

testWithRetry().catch(console.error);
