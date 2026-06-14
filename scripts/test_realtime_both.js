const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

function getEnv() {
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });
  return envVars;
}

async function main() {
  const env = getEnv();
  const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const managerId = 'b0417c76-b323-451e-98a6-623a5456918d';
  const managerEmail = 'frozenpaymanagergmailcom@frozenpayfoodies.frozenpos.local';
  const storeId = '2d46e24a-a378-4312-a871-cc893635bf58';

  console.log('1. Signing in as manager...');
  const managerClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: authData, error: authErr } = await managerClient.auth.signInWithPassword({
    email: managerEmail,
    password: 'TemporaryPassword123!'
  });
  if (authErr) {
    console.error('Sign in failed:', authErr);
    return;
  }

  console.log('2. Subscribing to products changes...');
  const prodChannel = managerClient
    .channel(`test-products-${storeId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `store_id=eq.${storeId}`
      },
      (payload) => {
        console.log('🎉 RECEIVED PRODUCTS EVENT:', payload.eventType, payload.new?.name);
      }
    )
    .subscribe((status) => {
      console.log('Products subscription status:', status);
    });

  console.log('3. Subscribing to sales_sessions changes...');
  const sessChannel = managerClient
    .channel(`test-sessions-${storeId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sales_sessions',
        filter: `store_id=eq.${storeId}`
      },
      (payload) => {
        console.log('🎉 RECEIVED SESSIONS EVENT:', payload.eventType, payload.new?.id);
      }
    )
    .subscribe((status) => {
      console.log('Sessions subscription status:', status);
    });

  // Wait 3 seconds, then trigger updates on both
  setTimeout(async () => {
    console.log('4. Triggering test update on products...');
    const { data: products } = await adminClient
      .from('products')
      .select('id, name, quantity')
      .eq('store_id', storeId)
      .limit(1);

    if (products && products.length > 0) {
      const p = products[0];
      const newQty = p.quantity + 1;
      console.log(`Updating product "${p.name}" quantity from ${p.quantity} to ${newQty}...`);
      await adminClient.from('products').update({ quantity: newQty }).eq('id', p.id);
    }

    console.log('5. Triggering test update on sales_sessions...');
    const { data: sessions } = await adminClient
      .from('sales_sessions')
      .select('id, approval_status')
      .eq('store_id', storeId)
      .limit(1);

    if (sessions && sessions.length > 0) {
      const s = sessions[0];
      const nextStatus = s.approval_status === 'approved' ? 'pending' : 'approved';
      console.log(`Updating session ${s.id} approval_status from "${s.approval_status}" to "${nextStatus}"...`);
      await adminClient.from('sales_sessions').update({ approval_status: nextStatus }).eq('id', s.id);
    }
  }, 3000);

  // Keep script running for 8 seconds
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  console.log('Cleaning up channels...');
  managerClient.removeChannel(prodChannel);
  managerClient.removeChannel(sessChannel);
}

main().catch(console.error);
