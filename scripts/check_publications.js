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

  console.log('Querying publications...');

  const { data: pubData, error } = await supabase.rpc('inspect_sql', {
    query_text: `
      SELECT 
        pubname, 
        schemaname, 
        tablename 
      FROM pg_publication_tables;
    `
  });

  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('Publication tables:', JSON.stringify(pubData, null, 2));
  }
}

main().catch(console.error);
