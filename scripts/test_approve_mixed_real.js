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

// Convert UTC timestamp to Lagos date string (YYYY-MM-DD)
function toLagosDateString(dateInput) {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Africa/Lagos', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(date);
}

async function main() {
  const env = getEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  const storeId = '2d46e24a-a378-4312-a871-cc893635bf58'; // frozenpay-foodies
  const dateStr = '2026-05-01';
  const adminId = '8faaee25-598f-4a72-a21d-c3ebaf20bf0b'; // Admin

  console.log(`=== RUNNING MIXED-STATE APPROVAL TEST FOR ${dateStr} ===`);

  // 1. Fetch all closed sessions for this store
  const { data: allSessions, error: fetchError } = await supabase
    .from('sales_sessions')
    .select('id, started_at, approval_status')
    .eq('store_id', storeId)
    .eq('status', 'closed');

  if (fetchError || !allSessions) {
    console.error('Failed to fetch sessions:', fetchError);
    return;
  }

  // 2. Filter sessions for this date
  const sessionsForDate = allSessions.filter(s => {
    const sDateStr = toLagosDateString(s.started_at);
    return sDateStr === dateStr;
  });

  console.log(`Found ${sessionsForDate.length} sessions for date ${dateStr}:`);
  sessionsForDate.forEach(s => {
    console.log(`  Session ID: ${s.id} | Started: ${s.started_at} | Status: ${s.approval_status}`);
  });

  // 3. Select pending ones (filter out already-approved)
  const sessionIdsToApprove = sessionsForDate
    .filter(s => s.approval_status !== 'approved')
    .map(s => s.id);

  console.log('Session IDs to update (pending only):', sessionIdsToApprove);

  if (sessionIdsToApprove.length === 0) {
    console.log('No pending sessions to approve. Bypassing database update.');
    return;
  }

  // 4. Update the pending sessions
  console.log('Sending update request for pending sessions...');
  const { data: updated, error: updateError } = await supabase
    .from('sales_sessions')
    .update({
      approval_status: 'approved',
      approved_by: adminId,
      approval_reason: 'Real mixed-state approval test'
    })
    .in('id', sessionIdsToApprove)
    .select();

  if (updateError) {
    console.error('❌ UPDATE FAILED with error:', updateError);
  } else {
    console.log('✅ UPDATE SUCCEEDED! Result:', updated);
  }
}

main().catch(console.error);
