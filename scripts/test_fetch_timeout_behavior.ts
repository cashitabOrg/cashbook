const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8').replace(/\r/g, '');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = 15000
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const signal = options.signal;
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => {
    clearTimeout(id);
  });
}

async function runTest() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('1. Querying WITHOUT custom fetch...');
  const clientNormal = createClient(url, key);
  const resNormal = await clientNormal.from('sale_items').select('id').limit(5);
  console.log('Normal Count:', resNormal.data?.length, 'Error:', resNormal.error);

  console.log('\n2. Querying WITH custom fetch...');
  const clientTimeout = createClient(url, key, {
    global: {
      fetch: (u, o) => fetchWithTimeout(u, o, 15000)
    }
  });
  const resTimeout = await clientTimeout.from('sale_items').select('id').limit(5);
  console.log('Timeout Count:', resTimeout.data?.length, 'Error:', resTimeout.error);

  process.exit(0);
}

runTest().catch(console.error);
