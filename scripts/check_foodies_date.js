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
  
  const { data: sessions, error } = await supabase
    .from('sales_sessions')
    .select('*')
    .eq('store_id', storeId)
    .order('started_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  // Group by Lagos date
  const groups = {};
  sessions.forEach(s => {
    const dateStr = toLagosDateString(s.started_at);
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(s);
  });

  console.log('Sessions by Lagos Date:');
  Object.keys(groups).sort().reverse().forEach(dateStr => {
    const sessList = groups[dateStr];
    const pendingCount = sessList.filter(s => s.approval_status === 'pending').length;
    const approvedCount = sessList.filter(s => s.approval_status === 'approved').length;
    console.log(`Date: ${dateStr} | Total: ${sessList.length} | Pending: ${pendingCount} | Approved: ${approvedCount}`);
  });
}

main().catch(console.error);
