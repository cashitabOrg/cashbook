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

  console.log('Fetching all stores...');
  const { data: stores, error: fetchErr } = await supabase
    .from('stores')
    .select('id, name, slug, is_billing_exempt');

  if (fetchErr) {
    console.error('❌ Failed to fetch stores:', fetchErr.message);
    return;
  }

  console.log(`Found ${stores.length} stores.`);

  for (const store of stores) {
    console.log(`Updating store: ${store.name} (${store.slug}) to be billing exempt...`);
    const { error: updateErr } = await supabase
      .from('stores')
      .update({ is_billing_exempt: true })
      .eq('id', store.id);

    if (updateErr) {
      console.error(`❌ Failed to update ${store.name}:`, updateErr.message);
    } else {
      console.log(`✅ Successfully updated ${store.name}`);
    }
  }

  console.log('--- ALL STORES UPDATED ---');
}

main().catch(console.error);
