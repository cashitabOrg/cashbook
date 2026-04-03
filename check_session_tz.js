const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envLocal.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join('=').trim();
        env[k] = v;
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSessionDates() {
  console.log('--- Sales Session Timezone Audit (Nigeria / WAT) ---');
  console.log('Current Local Time (System): ' + new Date().toLocaleString());
  
  // 1. Fetch the most recent 10 sessions
  const { data: sessions, error } = await supabase
    .from('sales_sessions')
    .select('id, started_at, status, total_revenue')
    .order('started_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching sessions:', error.message);
    return;
  }

  console.log('---------------------------------------------------------------------------------------------------');
  console.log('| Session ID                           | UTC Timestamp (DB)   | Nigeria Time (WAT)   | Date Match? |');
  console.log('---------------------------------------------------------------------------------------------------');

  sessions.forEach(s => {
    const utcDate = new Date(s.started_at);
    
    // Format for Nigeria (UTC+1)
    const options = { 
        timeZone: 'Africa/Lagos', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
    };
    
    const nigeriaStr = utcDate.toLocaleString('en-GB', options);
    // Locale en-GB gives DD/MM/YYYY
    const [datePart, timePart] = nigeriaStr.split(', ');
    const [day, month, year] = datePart.split('/');
    const nigeriaISODate = `${year}-${month}-${day}`;
    
    const utcISODate = s.started_at.split('T')[0];
    const match = (utcISODate === nigeriaISODate) ? 'YES' : 'NO (FIX NEEDED)';

    console.log(`| ${s.id.padEnd(36)} | ${s.started_at.padEnd(20)} | ${nigeriaStr} | ${match.padEnd(11)} |`);
  });
  console.log('---------------------------------------------------------------------------------------------------');
  console.log('Note: If "Date Match" is NO, the app will show the session as "Yesterday" due to UTC offset.');
}

checkSessionDates();
