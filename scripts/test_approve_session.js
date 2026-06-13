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
  const sessionId = 'fe7852d2-8447-400f-92e0-12f597546374';
  const adminId = '8faaee25-598f-4a72-a21d-c3ebaf20bf0b'; // Bishop (Precious Awire)

  console.log(`Checking session ${sessionId} state before approval...`);
  const { data: before, error: getErr } = await supabase
    .from('sales_sessions')
    .select('id, approval_status, status, total_revenue')
    .eq('id', sessionId)
    .single();

  if (getErr) {
    console.error('Error fetching session:', getErr);
    return;
  }
  console.log('Session before:', before);

  console.log(`Updating session ${sessionId} approval_status to "approved"...`);
  const { data: after, error: updateErr } = await supabase
    .from('sales_sessions')
    .update({
      approval_status: 'approved',
      approved_by: adminId,
      approval_reason: 'Tested programmatically'
    })
    .eq('id', sessionId)
    .select();

  if (updateErr) {
    console.error('❌ Update failed with error:', updateErr);
  } else {
    console.log('✅ Update succeeded! Result:', after);
  }
}

main().catch(console.error);
