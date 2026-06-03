const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function listRpcs() {
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

  // We can query pg_proc by selecting from a view or if there's some exposed catalog
  // Wait, does Supabase allow us to query pg_catalog.pg_proc directly? Let's see!
  const { data, error } = await supabase.from('pg_proc').select('proname').limit(10);
  if (error) {
    console.error('Failed to query pg_proc:', error.message);
  } else {
    console.log('pg_proc query succeeded:', data);
  }
}

listRpcs().catch(console.error);
