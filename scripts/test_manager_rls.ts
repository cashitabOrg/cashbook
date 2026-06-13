import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function testManagerRls() {
  console.log('--- TESTING MANAGER RLS POLICIES ---');
  
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars: any = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const adminClient = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);
  const managerId = 'b0417c76-b323-451e-98a6-623a5456918d';
  const managerEmail = 'frozenpaymanagergmailcom@frozenpayfoodies.frozenpos.local';
  
  console.log(`1. Temporarily resetting password for manager ${managerEmail}...`);
  const { error: passErr } = await adminClient.auth.admin.updateUserById(managerId, {
    password: 'TemporaryPassword123!'
  });

  if (passErr) {
    console.error('Failed to reset manager password:', passErr);
    return;
  }
  console.log('Password reset successfully.');

  // 2. Initialize manager client (enforcing RLS)
  const managerClient = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  console.log('2. Signing in as manager...');
  const { data: authData, error: authErr } = await managerClient.auth.signInWithPassword({
    email: managerEmail,
    password: 'TemporaryPassword123!'
  });

  if (authErr) {
    console.error('Failed to sign in as manager:', authErr);
    return;
  }
  console.log('Signed in successfully as manager.');

  // 3. Test update sales_sessions
  console.log('\n3. Testing UPDATE on sales_sessions (closing a session)...');
  // Let's create a new test session first using admin client to ensure we have a valid open session to test with
  const testSessionId = crypto.randomUUID();
  console.log(`Creating test session ${testSessionId} with admin client...`);
  await adminClient.from('sales_sessions').insert({
    id: testSessionId,
    store_id: '2d46e24a-a378-4312-a871-cc893635bf58',
    manager_id: managerId,
    status: 'open',
    total_revenue: 0
  });

  console.log('Now attempting to CLOSE the session using the MANAGER client...');
  const { data: updateSess, error: updateSessErr } = await managerClient
    .from('sales_sessions')
    .update({ 
      status: 'closed', 
      ended_at: new Date().toISOString(), 
      total_revenue: 1500 
    })
    .eq('id', testSessionId)
    .select();

  if (updateSessErr) {
    console.error('❌ Session CLOSE failed:', updateSessErr);
  } else {
    console.log('✅ Session CLOSE succeeded:', updateSess);
  }

  // 4. Test insert sale_item
  console.log('\n4. Testing INSERT on sale_items using the MANAGER client...');
  const testSaleItemId = crypto.randomUUID();
  const { data: insertItem, error: insertItemErr } = await managerClient
    .from('sale_items')
    .insert({
      id: testSaleItemId,
      store_id: '2d46e24a-a378-4312-a871-cc893635bf58',
      session_id: testSessionId,
      product_id: '3883fbb3-e9dc-49c7-8277-6678b580edb0', // Titus Fish
      quantity: 1,
      subtotal: 1500,
      unit_price: 1500,
      unit_cost: 1000
    })
    .select();

  if (insertItemErr) {
    console.error('❌ Sale item INSERT failed:', insertItemErr);
  } else {
    console.log('✅ Sale item INSERT succeeded:', insertItem);
  }

  // Cleanup test session
  console.log('\nCleaning up test records using admin client...');
  await adminClient.from('sale_items').delete().eq('id', testSaleItemId);
  await adminClient.from('sales_sessions').delete().eq('id', testSessionId);

  console.log('--- TEST COMPLETE ---');
}

testManagerRls().catch(console.error);
