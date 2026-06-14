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

  console.log('Querying triggers and function sources for sales_sessions...');

  // Use raw SQL execution via a common system query.
  // Since inspect_sql RPC may not be available, we can use standard query on pg_proc/pg_trigger
  // through the Supabase client or a custom RPC if we know it exists.
  // Let's write an RPC or query pg_proc.
  // Wait, let's see if we can do this via public schema queries if pg_tables/pg_proc are exposed, 
  // or write a quick SQL execution script.
  // Since service_role has full access, we can query system views.
  
  const { data: triggers, error } = await supabase.rpc('inspect_sql', {
    query_text: `
      SELECT 
        trg.tgname AS trigger_name,
        proc.proname AS function_name,
        proc.prosrc AS function_definition,
        c.relname AS table_name
      FROM pg_trigger trg
      JOIN pg_class c ON trg.tgrelid = c.oid
      JOIN pg_proc proc ON trg.tgfoid = proc.oid
      WHERE c.relname = 'sales_sessions';
    `
  });

  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('Triggers on sales_sessions:', JSON.stringify(triggers, null, 2));
  }
}

main().catch(console.error);
