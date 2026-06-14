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
  
  const storeId = 'c00cc824-6dd1-43cb-9c44-04384ed33040'; // Bishop Frozens
  const dateStr = '2026-06-14'; // The date with multiple sessions
  const adminId = '8faaee25-598f-4a72-a21d-c3ebaf20bf0b'; // Bishop

  console.log('--- TEST START: Set one session on June 14th to Approved ---');
  const targetApproveSessId = 'b503d805-5b87-40fa-ac04-9e466229181a';
  
  const { error: prepErr } = await supabase
    .from('sales_sessions')
    .update({ approval_status: 'approved', approved_by: adminId })
    .eq('id', targetApproveSessId);

  if (prepErr) {
     console.error('Failed to set up approved session:', prepErr);
     return;
  }
  console.log(`Successfully set session ${targetApproveSessId} to "approved" initially.`);

  console.log('\n--- SIMULATING approveDailySales ACTION LOGIC ---');
  
  // 1. Fetch all closed sessions
  const { data: allSessions, error: fetchError } = await supabase
    .from('sales_sessions')
    .select('id, started_at, approval_status')
    .eq('store_id', storeId)
    .eq('status', 'closed');

  if (fetchError || !allSessions) {
    console.error('Failed to fetch sessions:', fetchError);
    return;
  }

  // 2. Group and filter
  const sessionsForDate = allSessions.filter(s => {
    const sDateStr = toLagosDateString(s.started_at);
    return sDateStr === dateStr;
  });

  console.log(`Found ${sessionsForDate.length} sessions for date ${dateStr}:`);
  sessionsForDate.forEach(s => {
    console.log(`  Sess ID: ${s.id} | Started: ${s.started_at} | Status: ${s.approval_status}`);
  });

  const sessionIdsToApprove = sessionsForDate
    .filter(s => s.approval_status !== 'approved')
    .map(s => s.id);

  console.log(`Pending session IDs to update:`, sessionIdsToApprove);

  if (sessionIdsToApprove.length === 0) {
    console.log('No pending sessions to approve.');
    return;
  }

  // 3. Update only pending ones
  console.log('Updating pending sessions...');
  const { data: updated, error: updateError } = await supabase
    .from('sales_sessions')
    .update({
      approval_status: 'approved',
      approved_by: adminId,
      approval_reason: 'Simulated approve daily sales mixed test'
    })
    .in('id', sessionIdsToApprove)
    .select();

  if (updateError) {
    console.error('❌ UPDATE FAILED with error:', updateError);
  } else {
    console.log('✅ UPDATE SUCCEEDED! Successfully approved pending sessions:', updated.map(u => u.id));
  }

  console.log('\n--- CLEANUP: Reverting sessions back to pending for real testing ---');
  const sessionIdsToRevert = sessionsForDate.map(s => s.id);
  await supabase
    .from('sales_sessions')
    .update({ approval_status: 'pending', approved_by: null, approval_reason: null })
    .in('id', sessionIdsToRevert);
  console.log('Reverted sessions:', sessionIdsToRevert);
}

main().catch(console.error);
