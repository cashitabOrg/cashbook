import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function inspectPolicies() {
  console.log('--- DATABASE POLICY & TRIGGER INSPECTION STARTING ---');
  
  const envFile = fs.readFileSync('.env.local', 'utf8').replace(/\r/g, '');
  const envVars: any = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  });

  const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

  // 1. Fetch triggers from pg_trigger and pg_class
  console.log('\n--- 1. TRIGGERS ON sale_items ---');
  const { data: triggers, error: trigErr } = await supabase.rpc('inspect_sql', {
    query_text: `
      SELECT 
        tgname AS trigger_name,
        proname AS function_name,
        prosrc AS function_source
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE c.relname = 'sale_items';
    `
  });
  
  if (trigErr) {
    // If inspect_sql RPC doesn't exist, try running raw select if allowed, or we will see
    console.log('RPC inspect_sql failed:', trigErr.message);
  } else {
    console.log('Triggers:', JSON.stringify(triggers, null, 2));
  }

  // Let's try executing standard queries if inspect_sql isn't an RPC
  // Wait, let's look for standard Postgres system view queries or try running them via a custom RPC if one exists.
  // Wait! Let's list available RPCs or functions by searching our codebase, or we can check the logs of debug_database.ts first.
}

inspectPolicies().catch(console.error);
