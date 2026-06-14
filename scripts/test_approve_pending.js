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
  
  const sessionId = '5133b5e8-8684-48e8-8a39-0c874855a7c5'; // pending session
  const adminId = '8faaee25-598f-4a72-a21d-c3ebaf20bf0b'; // Admin

  console.log(`Checking session ${sessionId} before...`);
  const { data: before } = await supabase
    .from('sales_sessions')
    .select('id, approval_status, status, total_revenue')
    .eq('id', sessionId)
    .single();
  console.log('Session before:', before);

  console.log(`Updating session ${sessionId} approval_status to "approved"...`);
  const { data: after, error: updateErr } = await supabase
    .from('sales_sessions')
    .update({
      approval_status: 'approved',
      approved_by: adminId,
      approval_reason: 'Testing pending session approval'
    })
    .eq('id', sessionId)
    .select();

  if (updateErr) {
    console.error('❌ Update failed with error:', updateErr);
  } else {
    console.log('✅ Update succeeded! Result:', after);
    
    console.log('Reverting session back to pending...');
    await supabase
      .from('sales_sessions')
      .update({
        approval_status: 'pending',
        approved_by: null,
        approval_reason: null
      })
      .eq('id', sessionId);
    console.log('Reverted.');
  }
}

main().catch(console.error);
