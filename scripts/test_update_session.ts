import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function testUpdateSession() {
  console.log('--- TESTING SALES SESSION UPDATE ---');
  
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars: any = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

  const sessionId = '733ac7a2-7020-49cb-a9dc-183fe7d92f85';
  console.log(`Attempting to update session ${sessionId} to closed status...`);

  const { data, error } = await supabase
    .from('sales_sessions')
    .update({ 
      status: 'closed', 
      ended_at: new Date().toISOString(), 
      total_revenue: 3600 
    })
    .eq('id', sessionId)
    .select();

  if (error) {
    console.error('❌ UPDATE FAILED with database error:', error);
  } else {
    console.log('✅ UPDATE SUCCEEDED! Result data:', data);
  }

  console.log('--- TEST COMPLETE ---');
}

testUpdateSession().catch(console.error);
