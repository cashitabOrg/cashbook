const fs = require('fs');

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
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Missing env variables in .env.local");
    return;
  }

  // Fetch users from public.users table
  const res = await fetch(`${url}/rest/v1/users?select=*,stores(*)`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    console.error("Failed to fetch users:", res.status, await res.text());
    return;
  }

  const users = await res.json();
  console.log('--- PUBLIC USERS ---');
  users.forEach(u => {
    console.log(`User: ${u.email} | Username: ${u.username} | Role: ${u.role} | Store Slug: ${u.stores?.slug} | Active: ${u.is_active}`);
  });

  // Let's also fetch from auth.users via supabase admin API if possible, or just print these.
}

main().catch(console.error);
