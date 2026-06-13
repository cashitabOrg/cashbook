import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function testPgPolicies() {
  console.log('--- FETCHING PG POLICIES ---');
  
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars: any = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

  // We can query pg_policies via standard supabase query if it's exposed in the schema cache
  const { data, error } = await supabase
    .from('pg_policies')
    .select('*')
    .or('tablename.eq.sales_sessions,tablename.eq.sale_items');

  if (error) {
    console.error('❌ Failed to fetch pg_policies:', error);
  } else {
    console.log('✅ Policies:', data);
  }

  console.log('--- COMPLETE ---');
}

testPgPolicies().catch(console.error);
