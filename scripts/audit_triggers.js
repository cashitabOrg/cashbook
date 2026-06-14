const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function auditTriggers() {
  console.log('--- TRIGGER AUDIT STARTING ---');
  
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

  console.log('Fetching all triggers for sale_items...');
  const { data: triggers, error } = await supabase.rpc('get_triggers', { table_name: 'sale_items' });
  
  if (error) {
    console.log('RPC failed, querying pg_trigger via raw SQL...');
    const { data: pgTriggers, error: pgError } = await supabase.from('pg_trigger').select('tgname').limit(10);
    console.log('Raw SQL result:', pgTriggers, pgError);
  } else {
    console.log('Triggers found:', triggers);
  }

  console.log('--- AUDIT COMPLETE ---');
}

auditTriggers().catch(console.error);
