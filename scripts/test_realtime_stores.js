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

  console.log('2. Subscribing to stores changes...');
  const channel = managerClient
    .channel(`test-stores-${storeId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'stores',
        filter: `id=eq.${storeId}`
      },
      (payload) => {
        console.log('🎉 RECEIVED STORES UPDATE EVENT:', payload);
      }
    )
    .subscribe((status) => {
      console.log('Stores subscription status:', status);
    });

  // Wait 3 seconds, then trigger update on stores
  setTimeout(async () => {
    console.log('3. Triggering test update on stores...');
    const { data: store, error } = await adminClient
      .from('stores')
      .select('name')
      .eq('id', storeId)
      .single();

    if (store) {
      console.log(`Updating store name to same or slightly different...`);
      const { error: updErr } = await adminClient
        .from('stores')
        .update({ name: store.name }) // Just updating it triggers the replication
        .eq('id', storeId);
      if (updErr) {
        console.error('Store update failed:', updErr);
      } else {
        console.log('Store update completed.');
      }
    }
  }, 3000);

  // Keep script running for 8 seconds
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  console.log('Cleaning up channel...');
  managerClient.removeChannel(channel);
}

main().catch(console.error);
