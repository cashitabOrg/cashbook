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

  console.log('1. Setting manager password to TemporaryPassword123!...');
  const { error: passErr } = await adminClient.auth.admin.updateUserById(managerId, {
    password: 'TemporaryPassword123!'
  });
  if (passErr) {
    console.error('Failed to set password:', passErr);
    return;
  }

  console.log('2. Signing in as manager using browser client...');
  const managerClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: authData, error: authErr } = await managerClient.auth.signInWithPassword({
    email: managerEmail,
    password: 'TemporaryPassword123!'
  });
  if (authErr) {
    console.error('Sign in failed:', authErr);
    return;
  }
  console.log('Signed in successfully.');

  console.log('3. Subscribing to sales_sessions realtime changes...');
  const channel = managerClient
    .channel(`sync-sales_sessions-${storeId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sales_sessions',
        filter: `store_id=eq.${storeId}`
      },
      (payload) => {
        console.log('🎉 RECEIVED REALTIME EVENT:', payload);
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
    });

  // Wait 3 seconds, then trigger an update using admin client
  setTimeout(async () => {
    console.log('4. Triggering test update on sales_sessions...');
    
    // Let's find a closed session for this store or create one
    const { data: sessions } = await adminClient
      .from('sales_sessions')
      .select('id, approval_status')
      .eq('store_id', storeId)
      .limit(1);

    if (sessions && sessions.length > 0) {
      const targetSession = sessions[0];
      const nextStatus = targetSession.approval_status === 'approved' ? 'pending' : 'approved';
      console.log(`Updating session ${targetSession.id} approval_status from "${targetSession.approval_status}" to "${nextStatus}"...`);
      
      const { error: updateErr } = await adminClient
        .from('sales_sessions')
        .update({ approval_status: nextStatus })
        .eq('id', targetSession.id);
        
      if (updateErr) {
        console.error('Update failed:', updateErr);
      } else {
        console.log('Update query completed.');
      }
    } else {
      console.log('No session found to update.');
    }
  }, 3000);

  // Keep script running for 8 seconds
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  console.log('Cleaning up channel...');
  managerClient.removeChannel(channel);
}

main().catch(console.error);
