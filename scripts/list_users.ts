import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function listUsers() {
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars: any = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

  console.log('Fetching users and their stores...');
  const { data: users, error: userErr } = await supabase.from('users').select('*, stores(*)');
  if (userErr) {
    console.error('ERROR users:', userErr);
  } else {
    users?.forEach(u => {
      console.log(`User: ${u.email} | Role: ${u.role} | Store Slug: ${u.stores?.slug} | Active: ${u.is_active}`);
    });
  }
}

listUsers().catch(console.error);
