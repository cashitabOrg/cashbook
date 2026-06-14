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
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const storeId = '2d46e24a-a378-4312-a871-cc893635bf58'; // frozenpay-foodies store

  // Get a pending session
  console.log('Fetching a pending session for store...');
  const { data: sessions, error } = await supabase
    .from('sales_sessions')
    .select('id, approval_status, started_at')
    .eq('store_id', storeId)
    .eq('approval_status', 'pending')
    .limit(1);

  if (error || !sessions || sessions.length === 0) {
    console.error('No pending sessions found to toggle or error:', error);
    return;
  }

  const session = sessions[0];
  console.log('Found pending session:', session);

  console.log(`Approving session ${session.id}...`);
  const { data: approvedData, error: approveError } = await supabase
    .from('sales_sessions')
    .update({ approval_status: 'approved', approved_by: 'd2dea849-8599-456d-8a2f-170c429c65f6', approval_reason: 'Real-time toggle verification' })
    .eq('id', session.id)
    .select();

  if (approveError) {
    console.error('Failed to approve session:', approveError);
    return;
  }

  console.log('Session approved successfully!', approvedData);

  // Now, fetch the session back to verify
  const { data: verifiedSession } = await supabase
    .from('sales_sessions')
    .select('id, approval_status')
    .eq('id', session.id)
    .single();

  console.log('Verified status in DB:', verifiedSession);

  // Revert back to pending to preserve original test data/state
  console.log('Reverting session back to pending...');
  await supabase
    .from('sales_sessions')
    .update({ approval_status: 'pending', approved_by: null, approval_reason: null })
    .eq('id', session.id);

  console.log('Reverted successfully!');
}

main().catch(console.error);
